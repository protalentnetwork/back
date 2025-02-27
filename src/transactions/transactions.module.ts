import { Module } from '@nestjs/common';
import { IpnController } from './ipn.controller';
import { IpnService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { DepositController } from './deposit/deposit.controller';
import { RussiansWithdrawController } from './withdraw/withdrawler.controller';

@Module({
  controllers: [IpnController, DepositController, RussiansWithdrawController, TransactionsController],
  providers: [IpnService],
})
export class IpnModule { }