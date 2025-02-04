import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class Transaction {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, (user) => user.transactions, { eager: true })
    user: User;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount: number;

    @Column()
    status: string;

    @Column()
    type: string;
}