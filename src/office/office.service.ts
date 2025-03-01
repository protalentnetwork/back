import { Injectable, NotFoundException } from '@nestjs/common';
import { OfficeRepository } from './office.repository';
import { CreateOfficeDto } from './dto/create-office.dto';
import { UpdateOfficeDto } from './dto/update-office.dto';
import { Office } from './entities/office.entity';

@Injectable()
export class OfficeService {
  constructor(private readonly officeRepository: OfficeRepository) {}

  async findAll(): Promise<Office[]> {
    return this.officeRepository.findAll();
  }

  async findOne(id: number): Promise<Office> {
    const office = await this.officeRepository.findOne(id);
    if (!office) {
      throw new NotFoundException(`Oficina con ID ${id} no encontrada`);
    }
    return office;
  }

  async create(createOfficeDto: CreateOfficeDto): Promise<Office> {
    return this.officeRepository.create(createOfficeDto);
  }

  async update(id: number, updateOfficeDto: UpdateOfficeDto): Promise<Office> {
    const office = await this.officeRepository.findOne(id);
    if (!office) {
      throw new NotFoundException(`Oficina con ID ${id} no encontrada`);
    }
    return this.officeRepository.update(id, updateOfficeDto);
  }

  async remove(id: number): Promise<Office> {
    const office = await this.officeRepository.findOne(id);
    if (!office) {
      throw new NotFoundException(`Oficina con ID ${id} no encontrada`);
    }
    return this.officeRepository.remove(id);
  }
} 