import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class Chat {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: number;

    @Column({ name: 'user_id', nullable: false })
    userId: string;

    @Column({ name: 'message', nullable: false })
    message: string;

    @Column({ name: 'sender', nullable: false })
    sender: string;

    @Column({ name: 'agent_id', nullable: true })
    agentId: string;

    @CreateDateColumn({
        type: 'timestamp with time zone',
        default: () => 'CURRENT_TIMESTAMP(6)',
        name: 'timestamp'
    })
    timestamp: Date;
} 
