import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Log, Ticket, Transaction } from '../../payment/entities';

@Entity()
export class User {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: number;

    @Column({ name: 'username', nullable: false })
    username: string;

    @Column({ unique: true })
    email: string;

    @Column({ name: 'role', nullable: false })
    role: string;

    @Column({ name: 'status', nullable: false })
    status: string;

    @Column({ name: 'office', nullable: false })
    office: string;

    @CreateDateColumn({
        type: 'timestamp with time zone',
        default: () => 'CURRENT_TIMESTAMP(6)',
    })
    createdAt: Date;

    @Column({ name: 'withdrawal', nullable: false })
    withdrawal: string;

    @OneToMany(() => Transaction, (transaction) => transaction.user)
    transactions: Transaction[];

    @OneToMany(() => Ticket, ticket => ticket.user)
    tickets: Ticket[];

    @OneToMany(() => Log, log => log.user)
    logs: Log[];
}