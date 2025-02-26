import { Controller, Post, Body } from '@nestjs/common';
import { RussiansDepositData } from './russians-deposit.types';
import { IpnService } from '../transactions.service';

@Controller('deposit')
export class RussiansDepositController {
    constructor(private readonly ipnService: IpnService) { }

    @Post('rusos')
    async validateDeposit(@Body() depositData: RussiansDepositData) {
        console.log('Datos de depósito recibidos de los rusos:', depositData);
        const validationResult = await this.ipnService.validateWithMercadoPago(depositData);

        if (validationResult.status === 'success') {
            return {
                status: 'success',
                message: 'Depósito validado con Mercado Pago',
                payment: validationResult.payment,
                matched_with_mp: true
            };
        } else {
            return { status: 'error', message: validationResult.message };
        }
    }
}