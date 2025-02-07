import { PaymentPreference } from "./PaymentPreference";

export interface IPaymentGateway {
    createPreference(preference: PaymentPreference): Promise<string>;
    verifyPayment(paymentId: string): Promise<{
      status: string;
      metadata: Record<string, any>;
    }>;
  }