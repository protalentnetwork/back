import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IpnController } from './ipn.controller';
import { IpnService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { DepositController } from './deposit/deposit.controller';
import { RussiansWithdrawController } from './withdraw/withdrawler.controller';
import { Account } from '../account/entities/account.entity';
import { AccountModule } from '../account/account.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Account]),
    forwardRef(() => AccountModule), // Usar forwardRef para evitar dependencia circular
  ],
  controllers: [IpnController, DepositController, RussiansWithdrawController, TransactionsController],
  providers: [IpnService],
  exports: [IpnService],

})
export class IpnModule { }