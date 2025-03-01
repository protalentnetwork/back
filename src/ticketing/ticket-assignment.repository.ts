import { Repository } from 'typeorm';
import { TicketAssignment } from './entities/ticket-assignment.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class TicketAssignmentRepository {
    constructor(
        @InjectRepository(TicketAssignment)
        private repository: Repository<TicketAssignment>,
    ) {}

    async save(entity: TicketAssignment): Promise<TicketAssignment> {
        return this.repository.save(entity);
    }

    async findOne(options: any): Promise<TicketAssignment> {
        return this.repository.findOne(options);
    }

    async find(options?: any): Promise<TicketAssignment[]> {
        return this.repository.find(options);
    }

    async count(options?: any): Promise<number> {
        return this.repository.count(options);
    }

    create(entityLike: Partial<TicketAssignment>): TicketAssignment {
        return this.repository.create(entityLike) as TicketAssignment;
    }
} 