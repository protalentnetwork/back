import { Injectable } from '@nestjs/common';
import { IPaymentGateway, PaymentPreference } from './payment.types';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from './entities/transaction.entity';

@Injectable()
export class PaymentService implements IPaymentGateway {
    constructor(
        @InjectRepository(Transaction)
        private transactionRepository: Repository<Transaction>
    ) {}

    async createPreference(preference: PaymentPreference): Promise<string> {
        // Aquí implementarías la lógica real de creación de preferencia de pago
        // Por ahora retornamos una URL de ejemplo
        return `https://checkout.example.com/${Date.now()}`;
    }

    async verifyPayment(paymentId: string): Promise<{ status: string; metadata: Record<string, any> }> {
        // Aquí implementarías la verificación real del pago
        // Por ahora retornamos un estado de ejemplo
        return {
            status: "approved",
            metadata: {
                paymentId,
                timestamp: new Date().toISOString()
            }
        };
    }

    async createTransaction(userId: number, amount: number, type: string): Promise<Transaction> {
        const transaction = this.transactionRepository.create({
            user: { id: userId },
            amount,
            type,
            status: 'pending'
        });
        
        return this.transactionRepository.save(transaction);
    }

    async updateTransactionStatus(transactionId: number, status: string): Promise<Transaction> {
        await this.transactionRepository.update(transactionId, { status });
        return this.transactionRepository.findOne({ where: { id: transactionId } });
    }
}

