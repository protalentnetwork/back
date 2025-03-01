import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OfficeService } from './office.service';
import { OfficeController } from './office.controller';
import { OfficeRepository } from './office.repository';
import { Office } from './entities/office.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Office])],
  controllers: [OfficeController],
  providers: [OfficeService, OfficeRepository],
  exports: [OfficeService],
})
export class OfficeModule {} 