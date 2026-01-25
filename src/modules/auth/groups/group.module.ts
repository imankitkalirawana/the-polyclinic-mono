import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Group } from '../entities/group.entity';
import { Company } from '../entities/company.entity';
import { UserGroup } from '../entities/user-group.entity';
import { GroupController } from './group.controller';
import { GroupService } from './group.service';
import { SchemaValidatorService } from '../schema/schema-validator.service';

@Module({
  imports: [TypeOrmModule.forFeature([Group, Company, UserGroup])],
  controllers: [GroupController],
  providers: [GroupService, SchemaValidatorService],
  exports: [GroupService, SchemaValidatorService],
})
export class GroupModule {}
