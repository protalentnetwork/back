import { Injectable } from "@nestjs/common";
import { ConfigService } from '@nestjs/config';
import { IPaymentGateway } from "../payment.types";
import { PaymentPreference } from "../payment.types";
import { Preference, MercadoPagoConfig, Payment } from "mercadopago";

@Injectable()
export class MercadoPagoRepository implements IPaymentGateway {
    private client: MercadoPagoConfig;

    constructor(private configService: ConfigService) {
        const mpAccessToken = this.configService.get<string>('MP_ACCESS_TOKEN');
        if (!mpAccessToken) {
            throw new Error('MP_ACCESS_TOKEN must be defined');
        }
        this.client = new MercadoPagoConfig({
            accessToken: mpAccessToken
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


    async verifyPayment(paymentId: string): Promise<{ status: string; metadata: Record<string, any> }> {
        const paymentClient = new Payment(this.client);
        const payment = await paymentClient.get({ id: paymentId });

        if (!payment.status) {
            throw new Error('Payment status not found');
        }
        return { status: payment.status, metadata: payment.metadata || {} };
    }
}
