import { TypeOrmModule } from "@nestjs/typeorm";
import { Transaction } from "./entities/transaction.entity";
import { PaymentController } from "./payment.controller";
import { PaymentService } from "./payment.service";
import { Module } from "@nestjs/common";
import { Ticket } from "./entities/ticket.entity";
import { Log } from "./entities/log.entity";
import { MercadoPagoRepository } from "./repositories/mercado-pago.repository";

@Module({
    imports: [TypeOrmModule.forFeature([Transaction, Ticket, Log])],
    controllers: [PaymentController],
    providers: [
        PaymentService,
        MercadoPagoRepository,
        {
            provide: 'PaymentGateway',
            useClass: MercadoPagoRepository,
        }
    ],
})

export class PaymentModule { }

