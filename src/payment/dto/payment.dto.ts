import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentDto {
    @ApiProperty({
        description: 'Text message for the payment',
        example: 'Sample message'
    })
    text: string;
}

export class PaymentResponseDto {
    @ApiProperty({
        description: 'URL for the payment checkout',
        example: 'https://checkout.mercadopago.com/v1/checkout?pref_id=123456789'
    })
    checkoutUrl: string;
}

export class WebhookPayloadDto {
    @ApiProperty({
        description: 'Webhook data containing payment information',
        example: {
            id: '12345678',
            type: 'payment'
        }
    })
    data: {
        id: string;
        [key: string]: any;
    };
}

export class WebhookResponseDto {
    @ApiProperty({
        description: 'HTTP Status code',
        example: 200
    })
    status: number;
} 