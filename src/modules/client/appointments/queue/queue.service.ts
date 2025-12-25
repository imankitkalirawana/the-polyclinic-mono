import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Between, DataSource, In, MoreThanOrEqual, Not } from 'typeorm';
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
import { CompleteQueueDto } from './dto/compelete-queue.dto';

const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
const todayEnd = new Date(new Date().setHours(23, 59, 59, 999));

const queueRelations = [
  'patient',
  'patient.user',
  'doctor',
  'doctor.user',
  'bookedByUser',
  'completedByUser',
];

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
      relations: queueRelations,
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
      relations: queueRelations,
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

  async getQueueForDoctor(doctorId: string, queueId?: string) {
    let requestedQueue: Queue | null = null;

    this.logger.log(`Queue ID: ${queueId}`);

    if (queueId) {
      requestedQueue = await this.getRepository(Queue).findOne({
        where: { id: queueId },
        relations: queueRelations,
      });
      if (!requestedQueue) {
        throw new NotFoundException(`Queue with ID ${queueId} not found`);
      }
    }

    const previousQueues = await this.getRepository(Queue).find({
      where: {
        doctorId,
        createdAt: Between(todayStart, todayEnd),
        status: In([QueueStatus.COMPLETED, QueueStatus.CANCELLED]),
      },

      relations: queueRelations,
      order: {
        sequenceNumber: 'DESC',
      },
    });

    const nextQueues = await this.getRepository(Queue).find({
      where: {
        doctorId,
        createdAt: Between(todayStart, todayEnd),
        status: Not(In([QueueStatus.COMPLETED, QueueStatus.CANCELLED])),
      },
      relations: queueRelations,
      order: {
        status: 'ASC',
        counter: {
          skip: 'ASC',
        },
        sequenceNumber: 'ASC',
      },
    });

    // add the id of next queue in the each queue
    const next = queueId
      ? nextQueues.filter((queue) => queue.id !== queueId)
      : nextQueues.slice(1);

    const currentQueue = queueId ? requestedQueue : nextQueues[0];
    const current = currentQueue
      ? {
          ...currentQueue,
          nextQueueId: next[0]?.id,
          previousQueueId: previousQueues[0]?.id,
        }
      : null;

    return ApiResponse.success({
      previous: previousQueues.map(formatQueue),
      current: current ? formatQueue(current) : null,
      next: next ? next.map(formatQueue) : null,
    });
  }

  // Call queue by id
  async callQueue(id: string) {
    const queueRepository = this.getRepository(Queue);
    const queue = await queueRepository.findOne({
      where: { id },
      relations: queueRelations,
    });
    if (!queue) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    if (
      ![QueueStatus.BOOKED, QueueStatus.SKIPPED, QueueStatus.CALLED].includes(
        queue.status,
      )
    ) {
      throw new BadRequestException('Patient is already called');
    }

    queue.status = QueueStatus.CALLED;
    queue.counter = {
      skip: queue.counter?.skip || 0,
      clockIn: queue.counter?.clockIn || 0,
      call: queue.counter?.call + 1 || 1,
    };
    await queueRepository.save(queue);

    return ApiResponse.success(
      null,
      `${queue.patient.user.name} has been called`,
    );
  }

  // skip queue by id
  async skipQueue(id: string) {
    const queueRepository = this.getRepository(Queue);
    const queue = await queueRepository.findOne({
      where: { id },
      relations: queueRelations,
    });
    if (!queue) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    if (
      ![
        QueueStatus.BOOKED,
        QueueStatus.SKIPPED,
        QueueStatus.CALLED,
        QueueStatus.IN_CONSULTATION,
      ].includes(queue.status)
    ) {
      throw new BadRequestException(
        'The appointment is not in a valid state to skip',
      );
    }

    queue.status = QueueStatus.SKIPPED;
    queue.counter = {
      skip: queue.counter?.skip + 1 || 1,
      clockIn: queue.counter?.clockIn || 0,
      call: queue.counter?.call || 0,
    };
    await queueRepository.save(queue);

    return ApiResponse.success(
      null,
      `${queue.patient.user.name}'s turn is skipped`,
    );
  }

  // clock in
  async clockIn(id: string) {
    const queueRepository = this.getRepository(Queue);
    const queue = await queueRepository.findOne({ where: { id } });
    if (!queue) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    if (queue.status !== QueueStatus.CALLED) {
      throw new BadRequestException(
        'Please call the appointment before clocking in',
      );
    }

    queue.status = QueueStatus.IN_CONSULTATION;
    queue.counter = {
      skip: queue.counter?.skip || 0,
      clockIn: queue.counter?.clockIn + 1 || 1,
      call: queue.counter?.call || 0,
    };
    queue.startedAt = new Date();
    await queueRepository.save(queue);

    return ApiResponse.success(null, 'Appointment has been started');
  }

  // complete appointment queue
  async completeAppointmentQueue(
    id: string,
    completeQueueDto: CompleteQueueDto,
    user: CurrentUserPayload,
  ) {
    const queueRepository = this.getRepository(Queue);

    const queue = await queueRepository.findOne({
      where: { id },
      relations: queueRelations,
    });
    if (!queue) {
      throw new NotFoundException(`Queue with ID ${id} not found`);
    }

    if (queue.status !== QueueStatus.IN_CONSULTATION) {
      throw new BadRequestException(
        'Appointment should be in consultation to complete',
      );
    }

    Object.assign(queue, {
      ...completeQueueDto,
      status: QueueStatus.COMPLETED,
      completedBy: user.userId,
      completedAt: new Date(),
    });

    await queueRepository.save(queue);

    return ApiResponse.success(null, 'Appointment completed successfully');
  }
}
