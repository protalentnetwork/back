import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Log, Transaction } from '../../payment/entities';

@Entity()
export class User {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: number;

    @Column({ name: 'username', nullable: false })
    username: string;

    @Column({ unique: true })
    email: string;

    @Column({ name: 'password', nullable: false })
    password: string;

    @Column({ name: 'role', nullable: false })
    role: string;

    @Column({ name: 'status', nullable: false, default: 'active' })
    status: string;

    @Column({ name: 'office', nullable: false })
    office: string;

    @CreateDateColumn({
        type: 'timestamp with time zone',
        default: () => 'CURRENT_TIMESTAMP(6)',
        name: 'created_at'
    })
    createdAt: Date;

    @Column({ name: 'withdrawal', nullable: false, default: 'enabled' })
    withdrawal: string;

    @Column({ name: 'last_login_date', type: 'timestamp with time zone', nullable: true })
    lastLoginDate: Date;

    @Column({ name: 'last_logout_date', type: 'timestamp with time zone', nullable: true })
    lastLogoutDate: Date;

    @Column({ name: 'phone_number', nullable: true })
    phoneNumber: string;

    @Column({ name: 'description', type: 'text', nullable: true })
    description: string;

    @OneToMany(() => Transaction, (transaction) => transaction.user)
    transactions: Transaction[];

    @OneToMany(() => Log, log => log.user)
    logs: Log[];
}