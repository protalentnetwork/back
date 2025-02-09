export interface PaymentPreference {
    items: Array<{
        id: string;
        title: string;
        unit_price: number;
        quantity: number;
    }>;
    metadata: Record<string, any>;
}

export interface IPaymentGateway {
    createPreference(preference: PaymentPreference): Promise<string>;

    verifyPayment(paymentId: string): Promise<{
        status: string;
        metadata: Record<string, any>;
    }>;
}

