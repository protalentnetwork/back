// src/chat/entities/chat-message.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity()
export class ChatMessage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: string; // ID del cliente

  @Column()
  message: string;

  @Column()
  sender: string; // 'client' o 'agent'

  @Column({ nullable: true })
  agentId: string; // ID del agente asignado

  @CreateDateColumn()
  timestamp: Date;
}