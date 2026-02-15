import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UserService } from './users.service';
import { UserProfileService } from './user-profile.service';
import { User } from '../entities/user.entity';
import { SchemaValidatorService } from '../schema/schema-validator.service';
import { DoctorsModule } from '@common/doctors/doctors.module';
import { PatientsModule } from '@common/patients/patients.module';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([User]), DoctorsModule, PatientsModule],
  controllers: [UsersController],
  providers: [UserService, UserProfileService, SchemaValidatorService],
  exports: [UserService, UserProfileService],
})
export class UsersModule {}
