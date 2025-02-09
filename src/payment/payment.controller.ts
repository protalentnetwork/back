import { IPaymentGateway } from "src/payment/payment.types";
import { Controller, Post, Body, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreatePaymentDto, PaymentResponseDto, WebhookPayloadDto, WebhookResponseDto } from './dto/payment.dto';

@ApiTags('Payments')
@Controller('payments')
export class PaymentController {
    constructor(
        @Inject('PaymentGateway') private paymentGateway: IPaymentGateway
    ) { }

    @Post('create')
    @ApiOperation({ summary: 'Create a new payment' })
    @ApiResponse({ 
        status: 201, 
        description: 'Payment created successfully',
        type: PaymentResponseDto 
    })
    async createPayment(@Body() createPaymentDto: CreatePaymentDto): Promise<PaymentResponseDto> {
        const checkoutUrl = await this.paymentGateway.createPreference({
            items: [{
                id: 'message',
                title: 'Mensaje',
                unit_price: 100,
                quantity: 1
            }],
            metadata: { text: createPaymentDto.text }
        });
        return { checkoutUrl };
    }

    @Post('webhook')
    @ApiOperation({ summary: 'Handle payment webhook' })
    @ApiResponse({ 
        status: 200, 
        description: 'Webhook processed successfully',
        type: WebhookResponseDto 
    })
    async handleWebhook(@Body() body: WebhookPayloadDto): Promise<WebhookResponseDto> {
        const payment = await this.paymentGateway.verifyPayment(body.data.id);

        if (payment.status === "approved") {
            // Aquí iría la lógica de mensaje cuando implementemos MessageService
            console.log("Payment approved:", payment);
        }

        return { status: 200 };
    }
}