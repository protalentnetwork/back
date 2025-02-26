import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('api_keys')
export class ApiKey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100, unique: true })
  name: string;

  @Column({ length: 64 })
  keyHash: string;
  
  @Column({ default: true })
  isActive: boolean;

  @Column('simple-array')
  permissions: string[];

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  clientName: string;

  @Column({ nullable: true, type: 'timestamp' })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 