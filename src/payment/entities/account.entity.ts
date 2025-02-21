import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class Account {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: number;

    @Column({ name: 'office', nullable: false })
    office: string;

    @Column({ name: 'wallet', nullable: false })
    wallet: string;

    @Column({ name: 'name', nullable: false })
    name: string;

    @Column({ name: 'alias', nullable: false })
    alias: string;

    @Column({ name: 'cbu', nullable: false })
    cbu: string;

    @Column({ name: 'operator', nullable: false })
    operator: string;

    @Column({ name: 'agent', nullable: false })
    agent: string;

    @CreateDateColumn({
        type: 'timestamp with time zone',
        default: () => 'CURRENT_TIMESTAMP(6)',
    })
    createdAt: Date;

    @Column({ name: 'status', nullable: false, default: 'active' })
    status: string;

    @Column({ name: 'mp_access_token', nullable: true })
    mpAccessToken: string;

    @Column({ name: 'mp_public_key', nullable: true })
    mpPublicKey: string;

    @Column({ name: 'mp_client_id', nullable: true })
    mpClientId: string;

    @Column({ name: 'mp_client_secret', nullable: true })
    mpClientSecret: string;
} 