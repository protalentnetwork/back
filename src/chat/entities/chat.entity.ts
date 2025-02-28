import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Conversation } from './conversation.entity';

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
    
    @Column({ name: 'conversation_id', nullable: true })
    conversationId: string;
    
    @ManyToOne(() => Conversation, conversation => conversation.messages, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'conversation_id' })
    conversation: Conversation;
} 
