import { Controller, Post, Body } from '@nestjs/common';
import { IpnService } from '../transactions.service';
import { WithdrawData } from '../transaction.types';

@Controller('withdraw')
export class WithdrawController {
  constructor(private readonly ipnService: IpnService) { }

  @Post()
  async validateWithdraw(@Body() withdrawData: WithdrawData) {
    console.log('Datos de retiro recibidos:', withdrawData);
    const validationResult = await this.ipnService.validateWithdraw(withdrawData);

    if (validationResult.status === 'success') {
      return {
        status: 'success',
        message: 'Retiro registrado, pendiente de validación',
        transaction: validationResult.transaction
      };
    } else {
      return { status: 'error', message: validationResult.message };
    }
  }
}