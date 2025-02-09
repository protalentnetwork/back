import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from 'src/users/entities/user.entity';

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