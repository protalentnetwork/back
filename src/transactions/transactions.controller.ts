import { Controller, Get } from '@nestjs/common';
import { IpnService } from './transactions.service';

@Controller('transactions')
export class TransactionsController {
    constructor(private readonly ipnService: IpnService) { }

    @Get()
    getTransactions() {
        const transactions = this.ipnService.getTransactions();
        console.log('Transacciones devueltas:', transactions);
        return transactions;
    }
}