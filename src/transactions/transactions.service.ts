import { Injectable } from '@nestjs/common';
import axios from 'axios';

// Definir las interfaces aquí o importarlas desde transaction.types.ts
export interface IpnNotification {
    topic: string;
    id: string;
    data?: {
        resource: string;
        topic: string;
    };
}

export interface RussiansDepositData {
    cbu: string;
    amount: number;
    idTransferencia: string;
    dateCreated?: string;
    paymentMethod?: string;
}

export interface RussiansWithdrawData {
    amount: number;
    wallet_address: string;
    dateCreated?: string;
    withdraw_method: string;
}

// transaction.types.ts
export interface Transaction {
    id: string | number;
    type: 'deposit' | 'withdraw';
    amount: number;
    status?: 'Pending' | 'Aceptado' | 'approved' | string;
    date_created?: string;
    description?: string;
    payment_method_id?: string;
    payer_id?: string | number;
    payer_email?: string;
    payer_identification?: {
        type?: string;
        number?: string;
    } | null;
    cbu?: string;
    wallet_address?: string;
    external_reference?: string | null;
    receiver_id?: string; // Añadir receiver_id como opcional
}

// Definir PaymentData para las transferencias de Mercado Pago
export interface PaymentData {
    id: string | number;
    description: string;
    amount: number;
    status?: string;
    date_created?: string;
    date_approved?: string;
    date_last_updated?: string;
    money_release_date?: string;
    status_detail?: string;
    payment_method_id?: string;
    payment_type_id?: string;
    payer_id?: string | number;
    payer_email?: string;
    payer_identification?: {
        type?: string;
        number?: string;
    } | null;
    receiver_id?: string; // ID del receptor en MP (puede usarse como proxy para CBU)
    bank_transfer_id?: number; // ID de la transferencia bancaria, si aplica
    transaction_details?: {
        acquirer_reference?: string | null;
        bank_transfer_id?: number;
        external_resource_url?: string | null;
        financial_institution?: string;
        installment_amount?: number;
        net_received_amount?: number;
        overpaid_amount?: number;
        payable_deferral_period?: string | null;
        payment_method_reference_id?: string | null;
        total_paid_amount?: number;
        transaction_id?: string;
    } | null;
    additional_info?: {
        tracking_id?: string;
        items?: Array<{
            id?: string;
            title?: string;
            description?: string;
            quantity?: number;
            unit_price?: number;
        }>;
        payer?: {
            registration_date?: string;
        };
        shipments?: {
            receiver_address?: {
                street_name?: string;
                street_number?: string;
                zip_code?: string;
                city_name?: string;
                state_name?: string;
            };
        };
    } | null;
    external_reference?: string | null;
    fee_details?: Array<{
        type?: string;
        amount?: number;
        fee_payer?: string;
    }>;
}

@Injectable()
export class IpnService {
    private accessToken = 'APP_USR-3129742543233710-022613-83ea3095ed06b53e7b12597ae3ec5e65-61359072';
    private transactions: Transaction[] = [];

    async handleNotification(notification: IpnNotification) {
        const { topic, id, data } = notification;
        console.log('Procesando notificación de Mercado Pago:', { topic, id, data });

        let transaction: Transaction = {
            id: data?.resource || id,
            type: 'deposit', // Asumimos que las notificaciones de MP son depósitos
            amount: 0,
            status: 'Pending',
            date_created: new Date().toISOString(),
        };

        if (!data || !data.resource || !transaction.status) {
            try {
                console.log('Consultando detalles del pago en la API de Mercado Pago para ID:', transaction.id);
                const response = await axios.get(`https://api.mercadopago.com/v1/payments/${transaction.id}`, {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                    },
                });
                const apiData = response.data;

                const paymentData: PaymentData = {
                    id: apiData.id,
                    description: apiData.description || 'Sin descripción',
                    amount: apiData.transaction_amount || 0,
                    status: apiData.status || 'Pending',
                    date_created: apiData.date_created,
                    date_approved: apiData.date_approved,
                    date_last_updated: apiData.date_last_updated,
                    money_release_date: apiData.money_release_date,
                    status_detail: apiData.status_detail,
                    payment_method_id: apiData.payment_method_id,
                    payment_type_id: apiData.payment_type_id,
                    payer_id: apiData.payer?.id,
                    payer_email: apiData.payer?.email,
                    payer_identification: apiData.payer?.identification || null,
                    receiver_id: apiData.collector_id || apiData.receiver_id,
                    bank_transfer_id: apiData.transaction_details?.bank_transfer_id,
                    transaction_details: apiData.transaction_details || null,
                    additional_info: apiData.additional_info || null,
                    external_reference: apiData.external_reference || null,
                    fee_details: apiData.fee_details || [],
                };

                transaction = {
                    id: paymentData.id,
                    type: 'deposit',
                    amount: paymentData.amount,
                    status: paymentData.status,
                    date_created: paymentData.date_created,
                    description: paymentData.description,
                    payment_method_id: paymentData.payment_method_id,
                    payer_id: paymentData.payer_id,
                    payer_email: paymentData.payer_email,
                    payer_identification: paymentData.payer_identification,
                    external_reference: paymentData.external_reference,
                };
                console.log('Transacción de MP obtenida:', transaction);
            } catch (error) {
                console.error('Error al obtener detalles del pago:', error.response?.data || error.message);
                return { status: 'error', message: 'No se pudieron obtener los detalles del pago' };
            }
        }

        this.transactions.push(transaction);
        console.log('Transacción almacenada:', transaction);

        return { status: 'success', message: 'Notificación procesada correctamente', transaction };
    }

    getTransactions() {
        console.log('Transacciones disponibles antes de devolver:', this.transactions);
        return this.transactions;
    }

    async validateWithMercadoPago(depositData: RussiansDepositData) {
        console.log('Validando depósito de los rusos:', depositData);

        // Buscar coincidencia en las transacciones almacenadas (depósitos de MP)
        const matchingTransaction = this.transactions.find(transaction => {
            return (
                transaction.type === 'deposit' &&
                transaction.amount === depositData.amount && // Coincidencia de monto
                this.matchCbuWithMp(transaction, depositData.cbu) && // Coincidencia de CBU con receiver_id o bank_transfer_id
                this.isDateCloseEnough(transaction.date_created, depositData.dateCreated) // Coincidencia aproximada de fecha
            );
        });

        if (matchingTransaction) {
            console.log('Depósito validado con éxito:', matchingTransaction);
            // Actualizar automáticamente el estado a "Aceptado" si coincide con MP
            const updatedTransactions = this.transactions.map(t =>
                t.id === matchingTransaction.id ? { ...t, status: 'Aceptado' } : t
            );
            this.transactions = updatedTransactions;
            return { status: 'success', transaction: matchingTransaction, message: 'Depósito validado automáticamente con Mercado Pago' };
        }

        // Si no hay coincidencia local, consulta la API de MP
        try {
            const response = await axios.get(`https://api.mercadopago.com/v1/payments`, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                },
                params: {
                    status: 'approved',
                    limit: 10,
                },
            });

            const payments = response.data.results;
            const matchedPayment = payments.find((payment: PaymentData) => {
                return (
                    payment.amount === depositData.amount &&
                    this.matchCbuWithMp({ payment_method_id: payment.payment_method_id, receiver_id: payment.receiver_id } as unknown as Transaction, depositData.cbu) && // Cambio aquí
                    this.isDateCloseEnough(payment.date_created, depositData.dateCreated)
                );
            });

            if (matchedPayment) {
                const newTransaction: Transaction = {
                    id: matchedPayment.id,
                    type: 'deposit',
                    amount: matchedPayment.amount,
                    status: 'Aceptado',
                    date_created: matchedPayment.date_created,
                    description: matchedPayment.description || 'Depósito validado',
                    payment_method_id: matchedPayment.payment_method_id,
                    payer_id: matchedPayment.payer_id,
                    payer_email: matchedPayment.payer_email,
                    payer_identification: matchedPayment.payer_identification,
                    external_reference: matchedPayment.external_reference,
                };
                this.transactions.push(newTransaction);
                console.log('Pago encontrado en la API de MP y validado:', newTransaction);
                return { status: 'success', transaction: newTransaction, message: 'Depósito validado automáticamente desde la API de MP' };
            }

            console.log('No se encontró coincidencia con Mercado Pago');
            const newTransaction: Transaction = {
                id: depositData.idTransferencia,
                type: 'deposit',
                amount: depositData.amount,
                status: 'Pending',
                date_created: depositData.dateCreated || new Date().toISOString(),
                description: 'Depósito pendiente de validación',
                cbu: depositData.cbu,
            };
            this.transactions.push(newTransaction);
            return { status: 'error', message: 'No se pudo validar el depósito con Mercado Pago, pendiente de revisión', transaction: newTransaction };
        } catch (error) {
            console.error('Error al consultar la API de MP:', error);
            const newTransaction: Transaction = {
                id: depositData.idTransferencia,
                type: 'deposit',
                amount: depositData.amount,
                status: 'Pending',
                date_created: depositData.dateCreated || new Date().toISOString(),
                description: 'Depósito con error en validación',
                cbu: depositData.cbu,
            };
            this.transactions.push(newTransaction);
            return { status: 'error', message: 'Error al validar el depósito con Mercado Pago', transaction: newTransaction };
        }
    }

    async validateWithdraw(withdrawData: RussiansWithdrawData) {
        console.log('Validando retiro de los rusos:', withdrawData);

        const newTransaction: Transaction = {
            id: `withdraw_${Date.now()}`, // Generar un ID único para retiros
            type: 'withdraw',
            amount: withdrawData.amount,
            status: 'Pending',
            date_created: withdrawData.dateCreated || new Date().toISOString(),
            description: `Retiro via ${withdrawData.withdraw_method}`,
            wallet_address: withdrawData.wallet_address,
            payment_method_id: withdrawData.withdraw_method,
        };

        this.transactions.push(newTransaction);
        console.log('Retiro almacenado:', newTransaction);

        return { status: 'success', message: 'Retiro registrado, pendiente de validación', transaction: newTransaction };
    }

    private matchCbuWithMp(transaction: Transaction, cbu: string): boolean {
        if (!transaction.payment_method_id || !transaction.receiver_id) return false;
        const mappedCbu = this.mapCbuToMpIdentifier(cbu);
        return mappedCbu === transaction.receiver_id || (transaction.payment_method_id === 'cvu' && transaction.type === 'deposit');
    }

    private mapCbuToMpIdentifier(cbu: string): string {
        const cbuMapping = {
            '00010101': 'TU_RECEIVER_ID', // Reemplaza con el receiver_id de tu cuenta MP
            // Agrega más mapeos según tus cuentas
        };
        return cbuMapping[cbu] || '';
    }

    private isDateCloseEnough(date1: string | undefined, date2: string | undefined): boolean {
        if (!date1 || !date2) return false;
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        const diffMs = Math.abs(d1.getTime() - d2.getTime());
        const diffHours = diffMs / (1000 * 60 * 60); // Diferencia en horas
        return diffHours <= 24; // Tolerancia de 24 horas para transferencias
    }
}