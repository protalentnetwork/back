import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, UpdateDateColumn } from 'typeorm';
import { Chat } from './chat.entity';

@Entity()
export class Conversation {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'user_id', nullable: false })
    userId: string;

    @Column({ name: 'agent_id', nullable: true })
    agentId: string;

    @Column({ name: 'title', nullable: true })
    title: string;

    @Column({ name: 'status', default: 'active' })
    status: 'active' | 'closed';

    @CreateDateColumn({
        type: 'timestamp with time zone',
        default: () => 'CURRENT_TIMESTAMP(6)',
        name: 'created_at'
    })
    createdAt: Date;

    @UpdateDateColumn({
        type: 'timestamp with time zone',
        default: () => 'CURRENT_TIMESTAMP(6)',
        name: 'updated_at'
    })
    updatedAt: Date;

    @OneToMany(() => Chat, chat => chat.conversation, { cascade: true })
    messages: Chat[];
} 