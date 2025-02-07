import { IPaymentGateway } from "src/core/domain/payment/IPaymentGateway";
import { Controller, Post, Body } from '@nestjs/common';

@Controller('payments')
export class PaymentWebhookController {
   constructor(
     private paymentGateway: IPaymentGateway,
     private messageService: any 
   ) {}
 
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

   @Post('webhook')
   async handleWebhook(body: { data: { id: string } }) {
     const payment = await this.paymentGateway.verifyPayment(body.data.id);
 
     if (payment.status === "approved") {
       await this.messageService.create({
         id: body.data.id,
         text: payment.metadata.text,
       });
     }
 
     return { status: 200 };
   }
}