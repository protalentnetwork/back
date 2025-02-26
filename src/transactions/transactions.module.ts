// transactions.module.ts
import { Module } from '@nestjs/common';
import { IpnController } from './ipn.controller'; // Cambia a ipn.controller.ts
import { IpnService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { RussiansDepositController } from './deposit/russians-deposit.controller';

@Module({
    controllers: [IpnController, RussiansDepositController, TransactionsController],
    providers: [IpnService],
})
export class IpnModule { }