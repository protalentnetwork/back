import { Injectable } from '@nestjs/common';
import axios from 'axios';

export interface IpnNotification {
    topic: string;
    id: string;
    data?: {
        resource: string;
        topic: string;
    };
}

export interface PaymentData {
    id: string | number;
    status: string;
    amount: number;
    description: string;
    date_created: string;
    date_approved?: string;
    date_last_updated?: string;
    money_release_date?: string;
    status_detail?: string;
    payment_method_id?: string;
    payment_type_id?: string;
    payer_id?: number;
    payer_email?: string;
    payer_identification?: {
        type?: string;
        number?: string;
    };
    payer_type?: string;
    transaction_details?: {
        net_received_amount?: number;
        total_paid_amount?: number;
        overpaid_amount?: number;
        installment_amount?: number;
    };
    additional_info?: {
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
    };
    external_reference?: string;
    fee_details?: Array<{
        type?: string;
        amount?: number;
        fee_payer?: string;
    }>;
}

@Injectable()
export class IpnService {
    private accessToken = 'APP_USR-3129742543233710-022613-83ea3095ed06b53e7b12597ae3ec5e65-61359072';
    private payments: PaymentData[] = [];

    async handleNotification(notification: IpnNotification) {
        const { topic, id, data } = notification;
        console.log('Procesando notificación IPN:', { topic, id, data });

        let paymentData: PaymentData = {
            id: data?.resource || id,
            status: '',
            amount: 0,
            description: '',
            date_created: new Date().toISOString(),
        };

        if (!data || !data.resource || !paymentData.status) {
            try {
                console.log('Consultando detalles del pago en la API de Mercado Pago para ID:', paymentData.id);
                const response = await axios.get(`https://api.mercadopago.com/v1/payments/${paymentData.id}`, {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                    },
                });
                const apiData = response.data;

                paymentData = {
                    id: apiData.id,
                    status: apiData.status,
                    amount: apiData.transaction_amount || 0,
                    description: apiData.description || 'Sin descripción',
                    date_created: apiData.date_created,
                    date_approved: apiData.date_approved,
                    date_last_updated: apiData.date_last_updated,
                    money_release_date: apiData.money_release_date,
                    status_detail: apiData.status_detail,
                    payment_method_id: apiData.payment_method_id,
                    payment_type_id: apiData.payment_type_id,
                    payer_id: apiData.payer?.id,
                    payer_email: apiData.payer?.email,
                    payer_identification: apiData.payer?.identification,
                    payer_type: apiData.payer?.type,
                    transaction_details: apiData.transaction_details,
                    additional_info: apiData.additional_info,
                    external_reference: apiData.external_reference,
                    fee_details: apiData.fee_details,
                };
                console.log('Datos del pago obtenidos:', paymentData);
            } catch (error) {
                console.error('Error al obtener detalles del pago:', error.response?.data || error.message);
                return { status: 'error', message: 'No se pudieron obtener los detalles del pago' };
            }
        }

        this.payments.push(paymentData);
        console.log('Pago almacenado:', paymentData);

        return { status: 'success', message: 'Notificación procesada correctamente', payment: paymentData };
    }

    getTransactions() {
        console.log('Transacciones disponibles antes de devolver:', this.payments);
        return this.payments;
    }
}