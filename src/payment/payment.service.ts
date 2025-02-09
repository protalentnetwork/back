import { IPaymentGateway } from "./payment.types";

export class PaymentService {
    constructor(
        private paymentGateway: IPaymentGateway
    ) { }

    async createPaymentPreference(data: {
        productId: string;
        title: string;
        price: number;
        metadata: Record<string, any>;
    }) {
        return this.paymentGateway.createPreference({
            items: [{
                id: data.productId,
                title: data.title,
                unit_price: data.price,
                quantity: 1,
            }],
            metadata: data.metadata,
        });
    }

    async verifyPayment(paymentId: string) {
        return this.paymentGateway.verifyPayment(paymentId);
    }
}

