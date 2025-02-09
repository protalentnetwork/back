import { User } from 'src/users/entities/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';

@Entity()
export class Ticket {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, (user) => user.tickets)
    user: User;

    @Column()
    message: string;

    @Column()
    status: string;

    @ManyToOne(() => User)
    assignedTo: User;
}