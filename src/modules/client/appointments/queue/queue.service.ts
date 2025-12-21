import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Between, DataSource, In, MoreThanOrEqual } from 'typeorm';
import { Request } from 'express';
import { CreateQueueDto } from './dto/create-queue.dto';
import { UpdateQueueDto } from './dto/update-queue.dto';
import { CurrentUserPayload } from '@/client/auth/decorators/current-user.decorator';
import { BaseTenantService } from '@/tenancy/base-tenant.service';
import { CONNECTION } from '@/tenancy/tenancy.symbols';
import { TenantAuthInitService } from '@/tenancy/tenant-auth-init.service';
import { Queue, QueueStatus } from './entities/queue.entity';
import { Doctor } from '@/client/doctors/entities/doctor.entity';
import { TenantUser } from '@/client/auth/entities/tenant-user.entity';
import { ApiResponse } from 'src/common/response-wrapper';
import { formatQueue } from './queue.helper';

const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
const todayEnd = new Date(new Date().setHours(23, 59, 59, 999));

@Injectable()
export class QueueService extends BaseTenantService {
  constructor(
    @Inject(REQUEST) request: Request,
    @Inject(CONNECTION) connection: DataSource | null,
    tenantAuthInitService: TenantAuthInitService,
  ) {
    super(request, connection, tenantAuthInitService, QueueService.name);
  }

  async create(createQueueDto: CreateQueueDto, user: CurrentUserPayload) {
    await this.ensureTablesExist();

    const bookedByUser = await this.getRepository(TenantUser).findOne({
      where: { id: user.userId },
    });

    if (!bookedByUser) {
      throw new NotFoundException('Booking user not found');
    }

    const doctor = await this.getRepository(Doctor).findOne({
      where: { id: createQueueDto.doctorId },
    });

    const queueRepository = this.getRepository(Queue);

    const lastSequenceNumber = doctor.lastSequenceNumber ?? 0;

    // Update doctor's last sequence number
    const doctorRepository = this.getRepository(Doctor);
    await doctorRepository.update(createQueueDto.doctorId, {
      lastSequenceNumber: lastSequenceNumber + 1,
    });

    const queue = queueRepository.create({
      ...createQueueDto,
      bookedBy: user.userId,
      sequenceNumber: lastSequenceNumber + 1,
    });

    const savedQueue = await queueRepository.save(queue);

    return {
      message: 'Queue entry created successfully',
      data: await this.findOne(savedQueue.id),
    };
  }

  async findAll(date?: string) {
    await this.ensureTablesExist();

    const qb = await this.getRepository(Queue).find({
      where: {
        createdAt: date ? MoreThanOrEqual(new Date(date)) : undefined,
      },
      relations: ['patient.user', 'doctor.user', 'bookedByUser'],
      order: {
        sequenceNumber: 'ASC',
      },
    });

    const formattedData = qb.map(formatQueue);

    return ApiResponse.success(formattedData);
  }

  async findOne(id: string) {
    await this.ensureTablesExist();
    const qb = await this.getRepository(Queue).findOne({
      where: { id },
      relations: [
        'patient',
        'patient.user',
        'doctor',
        'doctor.user',
        'bookedByUser',
      ],
    });
    const formattedData = formatQueue(qb);

    return ApiResponse.success(formattedData);
  }

  async update(id: string, updateQueueDto: UpdateQueueDto) {
    await this.ensureTablesExist();
    const queueRepository = this.getRepository(Queue);

    const queue = await queueRepository.findOne({ where: { id } });
    if (!queue) {
      throw new NotFoundException(`Queue with ID ${id} not found`);
    }

    if (updateQueueDto.doctorId) {
      const doctorRepository = this.getRepository(Doctor);
      const doctor = await doctorRepository.findOne({
        where: { id: updateQueueDto.doctorId },
      });

      if (!doctor) {
        throw new NotFoundException(
          `Doctor with ID ${updateQueueDto.doctorId} not found`,
        );
      }
    }

    Object.assign(queue, updateQueueDto);
    await queueRepository.save(queue);

    return {
      message: 'Queue entry updated successfully',
      data: await this.findOne(id),
    };
  }

  async remove(id: string) {
    await this.ensureTablesExist();
    const queueRepository = this.getRepository(Queue);

    const queue = await queueRepository.findOne({ where: { id } });

    if (!queue) {
      throw new NotFoundException(`Queue with ID ${id} not found`);
    }

    await queueRepository.remove(queue);

    return {
      message: 'Queue entry deleted successfully',
    };
  }

  async getQueueForDoctor(doctorId: string) {
    const qb = await this.getRepository(Queue).find({
      where: {
        doctorId,
        status: In([QueueStatus.BOOKED, QueueStatus.CALLED]),
        createdAt: Between(todayStart, todayEnd),
      },
      relations: [
        'patient',
        'patient.user',
        'doctor',
        'doctor.user',
        'bookedByUser',
      ],
      order: {
        sequenceNumber: 'ASC',
      },
      take: 4,
    });

    const current = qb[0];
    const next = qb.slice(1, 4);

    return {
      current,
      next,
    };
  }

  async callInQueue(doctorId: string) {
    // mark the queue as called

    const doctor = await this.getRepository(Doctor).findOne({
      where: { id: doctorId },
    });

    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${doctorId} not found`);
    }

    const currentSequenceNumber = doctor.currentSequenceNumber || 1;

    let queue = await this.getRepository(Queue).findOne({
      where: {
        doctorId,
        sequenceNumber: currentSequenceNumber,
        createdAt: Between(todayStart, todayEnd),
      },
    });

    if (!queue) {
      const nextQueue = await this.getQueueForDoctor(doctorId);
      if (
        nextQueue.current &&
        nextQueue.current.status === QueueStatus.BOOKED
      ) {
        queue = nextQueue.current;
        await this.getRepository(Doctor).update(doctorId, {
          currentSequenceNumber: queue.sequenceNumber,
        });
      } else {
        throw new NotFoundException(`No queue found for doctor ${doctorId}`);
      }
    }

    if (queue.status === QueueStatus.BOOKED) {
      await this.getRepository(Queue).update(queue.id, {
        status: QueueStatus.CALLED,
      });
    } else {
      throw new BadRequestException(
        `Queue with sequence number ${currentSequenceNumber} is already called, Either skip it or mark it as completed`,
      );
    }

    return new ApiResponse(null, 'Queue entry called successfully');
  }

  async skipQueue(doctorId: string) {
    const doctor = await this.getRepository(Doctor).findOne({
      where: { id: doctorId },
    });

    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${doctorId} not found`);
    }
  }
}
