import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Drug } from './entities/drug.entity';
import { DrugService } from './drug.service';
import { DrugController } from './drug.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Drug])],
  controllers: [DrugController],
  providers: [DrugService],
  exports: [DrugService],
})
export class DrugModule {}
