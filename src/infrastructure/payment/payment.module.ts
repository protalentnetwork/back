import { Module } from '@nestjs/common';
import { PaymentWebhookController } from 'src/presentation/controllers/PaymentWebhookController';
import { MercadoPagoGateway } from './MercadoPagoGateway';

@Module({
    controllers: [PaymentWebhookController],
    providers: [
        {
            provide: 'PaymentGateway',
            useClass: MercadoPagoGateway
        },
    ]
})
export class PaymentModule { }