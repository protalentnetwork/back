import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Log } from './log.entity';
import { Ticket } from './ticket.entity';
import { Transaction } from './transaction';

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({ unique: true })
    email: string;

    @Column({ nullable: true })
    otp: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    balance: number;

    @Column()
    role: string;

    @Column()
    status: string;

    @OneToMany(() => Transaction, transaction => transaction.user)
    transactions: Transaction[];

    @OneToMany(() => Ticket, ticket => ticket.user)
    tickets: Ticket[];

    @OneToMany(() => Log, log => log.user)
    logs: Log[];
}