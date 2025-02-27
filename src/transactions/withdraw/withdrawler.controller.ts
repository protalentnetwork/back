import { Controller, Post, Body } from '@nestjs/common';
import { IpnService } from '../transactions.service';
import { RussiansWithdrawData } from './russianswithdraw.types';

@Controller('russianswithdraw')
export class RussiansWithdrawController {
  constructor(private readonly ipnService: IpnService) { }

  @Post()
  async createWithdraw(@Body() withdrawData: RussiansWithdrawData) {
    console.log('Datos de retiro de rusos recibidos:', withdrawData);
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