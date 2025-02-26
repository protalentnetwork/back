// ipn.service.ts
import { Injectable } from '@nestjs/common';
import axios from 'axios';

interface IpnNotification {
    topic: string;
    id: string;
    data?: any; // O usa un tipo más específico para los datos del pago, como Transaction
}

@Injectable()
export class IpnService {
    private accessToken = 'APP_USR-3129742543233710-022613-83ea3095ed06b53e7b12597ae3ec5e65-61359072';

    async handleNotification(notification: IpnNotification) {
        const { topic, id, data } = notification;
        console.log('Procesando notificación IPN:', { topic, id, data });

        let paymentData = data?.data || {};

        if (!paymentData || Object.keys(paymentData).length === 0) {
            // Si el cuerpo está vacío, consulta la API de Mercado Pago
            try {
                const response = await axios.get(`https://api.mercadopago.com/v1/payments/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                    },
                });
                paymentData = response.data;
            } catch (error) {
                console.error('Error al obtener detalles del pago:', error);
                return { status: 'error', message: 'No se pudieron obtener los detalles del pago' };
            }
        }

        const payment = {
            id: paymentData.id || id,
            status: paymentData.status,
            amount: paymentData.amount,
            description: paymentData.description,
            dateCreated: paymentData.date_created,
        };

        // Procesar o almacenar el pago (por ejemplo, guardar en BD o enviar al frontend)
        return { status: 'success', message: 'Notificación procesada correctamente', payment };
    }
}