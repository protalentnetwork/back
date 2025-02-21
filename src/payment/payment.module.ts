import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { Transaction } from './entities/transaction.entity';
import { Log } from './entities/log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction, Log])],
  controllers: [PaymentController],
  providers: [
    PaymentService,
    {
      provide: 'PaymentGateway',
      useClass: PaymentService
    }
  ],
  exports: [PaymentService]
})
export class PaymentModule { }