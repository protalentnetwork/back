import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class Ticket {
   @PrimaryGeneratedColumn()
   id: number;

   @ManyToOne(() => User, user => user.tickets)
   user: User;

   @Column()
   message: string;

   @Column()
   status: string;

   @ManyToOne(() => User)
   assignedTo: User;
}