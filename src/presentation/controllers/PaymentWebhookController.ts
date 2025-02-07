import { IPaymentGateway } from "src/core/domain/payment/IPaymentGateway";
import { Controller, Post, Body, Inject } from '@nestjs/common';

@Controller('payments')
export class PaymentWebhookController {
    constructor(
        @Inject('PaymentGateway') private paymentGateway: IPaymentGateway
    ) { }

    @Post('create')
    async createPayment(@Body('text') text: string) {
        const checkoutUrl = await this.paymentGateway.createPreference({
            items: [{
                id: 'message',
                title: 'Mensaje',
                unit_price: 100,
                quantity: 1
            }],
            metadata: { text }
        });
        return { checkoutUrl };
    }
}