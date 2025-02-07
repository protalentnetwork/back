import { IPaymentGateway } from "src/core/domain/payment/IPaymentGateway";

export class CreatePaymentPreference {
    constructor(private paymentGateway: IPaymentGateway) {}
  
    // Ejecuta la creación de preferencia con los datos del producto
    async execute(data: {
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
  }