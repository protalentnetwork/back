export interface PaymentPreference {
    items: Array<{
      id: string;
      title: string; 
      unit_price: number;
      quantity: number;
    }>;
    metadata: Record<string, any>;
  }