import { Controller, Get } from '@nestjs/common';
import { IpnService } from './transactions.service';
import { PaymentData } from './transactions.service';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly ipnService: IpnService) {}

  @Get()
  getTransactions(): PaymentData[] {
    console.log('Transacciones devueltas por el controlador:', this.ipnService.getTransactions());
    return this.ipnService.getTransactions();
  }
}