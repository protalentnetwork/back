import { Controller, Get } from '@nestjs/common';
import { IpnService } from './transactions.service';
import { Transaction } from './transaction.types'; // Ajusta la ruta según tu estructura

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly ipnService: IpnService) {}

  @Get()
  getTransactions(): Transaction[] {
    console.log('Transacciones devueltas por el controlador:', this.ipnService.getTransactions());
    return this.ipnService.getTransactions();
  }
}