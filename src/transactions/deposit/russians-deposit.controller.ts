// russians-deposit.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { RussiansDepositData } from './russians-deposit.types';
import { IpnService, Transaction } from '../transactions.service';

interface ValidationResult {
    status: string;
    transaction?: Transaction; // Usa transaction en lugar de payment
    message: string;
}

@Controller('deposit')
export class RussiansDepositController {
    constructor(private readonly ipnService: IpnService) { }

    @Post('rusos')
    async validateDeposit(@Body() depositData: RussiansDepositData): Promise<ValidationResult> {
        console.log('Datos de depósito recibidos de los rusos:', depositData);
        const validationResult: ValidationResult = await this.ipnService.validateWithMercadoPago(depositData);

        if (validationResult.status === 'success') {
            return {
                status: 'success',
                message: 'Depósito validado con Mercado Pago',
                transaction: validationResult.transaction // Usa transaction en lugar de payment
            };
        } else {
            return { status: 'error', message: validationResult.message };
        }
    }
}