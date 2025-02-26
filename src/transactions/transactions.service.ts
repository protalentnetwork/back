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
                const response = await axios.get(`https://api.mercadopago.com/v1/payments/${paymentData.id}`, {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                    },
                });
                paymentData = {
                    id: response.data.id,
                    status: response.data.status,
                    amount: response.data.transaction_amount || 0,
                    description: response.data.description || 'Sin descripción',
                    date_created: response.data.date_created,
                };
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
        return this.payments;
    }
}