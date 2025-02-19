import { Ticket } from 'src/payment/entities/ticket.entity';
import { User } from 'src/users/entities/user.entity';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, UpdateDateColumn } from 'typeorm';

@Entity()
export class ChatConversation {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  user: User;

  @Column()
  status: string;

  @Column({ default: 0 })
  unreadCount: number;

  @Column({ nullable: true })
  lastMessage: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity()
export class ChatMessage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  message: string;

  @Column()
  sender: string; // 'user' | 'agent'

  @ManyToOne(() => User)
  user: User;

  @ManyToOne(() => ChatConversation)
  conversation: ChatConversation;

  @CreateDateColumn()
  createdAt: Date;
}