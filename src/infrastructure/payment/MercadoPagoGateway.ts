import { IPaymentGateway } from "src/core/domain/payment/IPaymentGateway";
import { PaymentPreference } from "src/core/domain/payment/PaymentPreference";
import { Payment, Preference } from "mercadopago";

export class MercadoPagoGateway implements IPaymentGateway {
    constructor(private mercadopago: any) { }

    // Crea la preferencia en MP y retorna la URL de pago
    async createPreference(preference: PaymentPreference): Promise<string> {
        const mpPreference = await new Preference(this.mercadopago).create({
            body: {
                items: preference.items,
                metadata: preference.metadata,
            },
        });

        return mpPreference.init_point!;
    }

    // Verifica un pago por ID
    async verifyPayment(paymentId: string) {
        const payment = await new Payment(this.mercadopago).get({ id: paymentId });

        if (!payment.status) {
            throw new Error('Payment status not found');
        }

        return {
            status: payment.status,
            metadata: payment.metadata || {},
        };
    }
}