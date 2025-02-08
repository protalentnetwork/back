import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { Injectable } from '@nestjs/common';
import { IPaymentGateway } from "src/core/domain/payment/IPaymentGateway";
import { PaymentPreference } from "src/core/domain/payment/PaymentPreference";

@Injectable()
export class MercadoPagoGateway implements IPaymentGateway {
    private client: MercadoPagoConfig;

    constructor() {
        if (!process.env.MP_ACCESS_TOKEN) {
            throw new Error('MP_ACCESS_TOKEN must be defined');
        }
        this.client = new MercadoPagoConfig({
            accessToken: process.env.MP_ACCESS_TOKEN
        });
    }

    async createPreference(preference: PaymentPreference): Promise<string> {
        const preferenceClient = new Preference(this.client);
        const mpPreference = await preferenceClient.create({
            body: {
                items: preference.items,
                metadata: preference.metadata,
            },
        });

        return mpPreference.init_point!;
    }

    async verifyPayment(paymentId: string) {
        const paymentClient = new Payment(this.client);
        const payment = await paymentClient.get({ id: paymentId });

        if (!payment.status) {
            throw new Error('Payment status not found');
        }

        return {
            status: payment.status,
            metadata: payment.metadata || {},
        };
    }
}