import { Controller, Post, Body } from '@nestjs/common';
import { IpnService, RussiansWithdrawData } from '../transactions.service';

@Controller('withdraw')
export class RussiansWithdrawController {
  constructor(private readonly ipnService: IpnService) {}

  @Post('rusos')
  async validateWithdraw(@Body() withdrawData: RussiansWithdrawData) {
    console.log('Datos de retiro recibidos de los rusos:', withdrawData);
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