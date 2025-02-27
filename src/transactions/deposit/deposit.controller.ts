import { Controller, Post, Body } from '@nestjs/common';
import { Transaction } from '../transaction.types';
import { IpnService } from '../transactions.service';
import { RussiansDepositData } from './russians-deposit.types';

interface ValidationResult {
    status: string;
    transaction?: Transaction;
    message: string;
}

@Controller('deposit')
export class DepositController {
    constructor(private readonly ipnService: IpnService) { }

    @Post()
    async validateDeposit(@Body() depositData: RussiansDepositData): Promise<ValidationResult> {
        console.log('Datos de depósito recibidos:', depositData);
        const validationResult: ValidationResult = await this.ipnService.validateWithMercadoPago(depositData);

        if (validationResult.status === 'success') {
            return {
                status: 'success',
                message: 'Depósito validado con Mercado Pago',
                transaction: validationResult.transaction
            };
        } else {
            return { status: 'error', message: validationResult.message };
        }
    }
}