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
  description: string;
  amount: number;
  status?: string;
  date_created?: string;
  payment_method_id?: string;
  payment_type_id?: string;
  receiver_id?: string; // ID del receptor en MP (puede usarse como proxy para CBU)
  bank_transfer_id?: number; // ID de la transferencia bancaria, si aplica
  payer_id?: string | number;
  payer_email?: string;
  payer_identification?: {
    type?: string;
    number?: string;
  } | null;
  // ... otros campos según tu estructura
}

export interface RussiansDepositData {
  cbu: string;
  amount: number;
  idTransferencia: string;
  dateCreated?: string;
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
      description: '',
      amount: 0,
      status: 'Pending', // Estado inicial antes de validar
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
          description: apiData.description || 'Sin descripción',
          amount: apiData.transaction_amount || 0,
          status: apiData.status || 'Pending',
          date_created: apiData.date_created,
          payment_method_id: apiData.payment_method_id,
          payment_type_id: apiData.payment_type_id,
          receiver_id: apiData.collector_id || apiData.receiver_id, // Ajusta según la respuesta de MP
          bank_transfer_id: apiData.transaction_details?.bank_transfer_id,
          payer_id: apiData.payer?.id,
          payer_email: apiData.payer?.email,
          payer_identification: apiData.payer?.identification || null,
          // ... otros campos
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

  async validateWithMercadoPago(depositData: RussiansDepositData) {
    console.log('Validando depósito de los rusos:', depositData);

    // Buscar coincidencia en los pagos almacenados
    const matchingPayment = this.payments.find(payment => {
      return (
        payment.amount === depositData.amount && // Coincidencia de monto
        this.matchCbuWithMp(payment, depositData.cbu) && // Coincidencia de CBU con receiver_id o bank_transfer_id
        this.isDateCloseEnough(payment.date_created, depositData.dateCreated) // Coincidencia aproximada de fecha
      );
    });

    if (matchingPayment) {
      console.log('Depósito validado con éxito:', matchingPayment);
      // Actualizar automáticamente el estado a "Aceptado" si coincide con MP
      const updatedPayments = this.payments.map(payment =>
        payment.id === matchingPayment.id ? { ...payment, status: 'Aceptado' } : payment
      );
      this.payments = updatedPayments;
      return { status: 'success', payment: matchingPayment, message: 'Depósito validado automáticamente con Mercado Pago' };
    }

    // Si no hay coincidencia en this.payments, consulta la API de MP
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
          this.matchCbuWithMp(payment, depositData.cbu) &&
          this.isDateCloseEnough(payment.date_created, depositData.dateCreated)
        );
      });

      if (matchedPayment) {
        this.payments.push(matchedPayment);
        const updatedPayments = this.payments.map(payment =>
          payment.id === matchedPayment.id ? { ...payment, status: 'Aceptado' } : payment
        );
        this.payments = updatedPayments;
        console.log('Pago encontrado en la API de MP y validado:', matchedPayment);
        return { status: 'success', payment: matchedPayment, message: 'Depósito validado automáticamente desde la API de MP' };
      }

      console.log('No se encontró coincidencia con Mercado Pago');
      return { status: 'error', message: 'No se pudo validar el depósito con Mercado Pago' };
    } catch (error) {
      console.error('Error al consultar la API de MP:', error);
      return { status: 'error', message: 'Error al validar el depósito con Mercado Pago' };
    }
  }

  private matchCbuWithMp(payment: PaymentData, cbu: string): boolean {
    // Aquí intentamos matchear el CBU con el receiver_id o bank_transfer_id de MP
    // Esto es una aproximación, ya que MP no devuelve directamente el CBU, sino identificadores internos
    if (!payment.receiver_id || !payment.bank_transfer_id) return false;

    // Simulamos una coincidencia basada en receiver_id o bank_transfer_id
    // Necesitarás mapear el CBU a un receiver_id o bank_transfer_id específico en tu sistema
    const mappedCbu = this.mapCbuToMpIdentifier(cbu); // Implementa esta función según tu lógica
    return mappedCbu === payment.receiver_id || mappedCbu === payment.bank_transfer_id.toString();
  }

  private mapCbuToMpIdentifier(cbu: string): string {
    // Implementa esta lógica para mapear el CBU a un receiver_id o bank_transfer_id de MP
    // Por ejemplo, podrías tener una tabla o configuraciíon que relacione CBU con receiver_id
    // Esto es un placeholder; ajusta según tu caso
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