import { Module } from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { DoctorsController } from './doctors.controller';
import { SpecializationsService } from './specializations.service';

@Module({
  controllers: [DoctorsController],
  providers: [DoctorsService, SpecializationsService],
  exports: [DoctorsService, SpecializationsService],
})
export class DoctorsModule {}
