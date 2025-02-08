import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Transaction, OneToMany, ManyToOne } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class Log {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    action: string;

    @ManyToOne(() => User, (user) => user.logs)
    user: User;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    date: Date;

    @Column()
    result: string;
}