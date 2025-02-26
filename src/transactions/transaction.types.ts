// transaction.types.ts
export interface Transaction {
    id: string | number; // Puede ser deposit_id, withdraw_id, o payment_id de MP
    type: 'deposit' | 'withdraw'; // Tipo de operación
    amount: number;
    status?: 'Pending' | 'Aceptado' | 'approved' | string; // Estado común
    date_created?: string;
    description?: string;
    payment_method_id?: string;
    payer_id?: string | number;
    payer_email?: string;
    payer_identification?: {
      type?: string;
      number?: string;
    } | null;
    cbu?: string; // Para depósitos, si aplica
    wallet_address?: string; // Para retiros, si aplica
    external_reference?: string | null; // Referencia externa de MP o "los rusos"
  }