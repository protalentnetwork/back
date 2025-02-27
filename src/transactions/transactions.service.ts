import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { IpnNotification, DepositData, WithdrawData, Transaction, PaymentData } from './transaction.types';
// Importamos el tipo RussiansDepositData
import { RussiansDepositData } from './deposit/russians-deposit.types';

// Re-exportamos los tipos necesarios
export { Transaction } from './transaction.types';

@Injectable()
export class IpnService {
  private accessToken = 'APP_USR-3129742543233710-022613-83ea3095ed06b53e7b12597ae3ec5e65-61359072';
  private transactions: Transaction[] = [];

  async handleNotification(notification: IpnNotification) {
    const { topic, id, data } = notification;
    console.log('Procesando notificación de Mercado Pago:', { topic, id, data });

    // Inicializamos la transacción vacía
    let transaction: Transaction;
    const paymentId = data?.resource || id;

    try {
      console.log('Consultando detalles del pago en la API de Mercado Pago para ID:', paymentId);
      const response = await axios.get(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });
      const apiData = response.data;
      console.log('Respuesta completa de la API de Mercado Pago:', JSON.stringify(apiData, null, 2));

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

      // En caso de error, creamos una transacción básica con lo que tenemos
      transaction = {
        id: paymentId,
        type: 'deposit',
        amount: 0,
        status: 'Pending',
        date_created: new Date().toISOString(),
        description: 'Error al obtener detalles del pago',
      };

      return {
        status: 'error',
        message: 'No se pudieron obtener los detalles del pago',
        transaction
      };
    }

    this.transactions.push(transaction);
    console.log('Transacción almacenada:', transaction);

    return {
      status: 'success',
      message: 'Notificación procesada correctamente',
      transaction
    };
  }

  getTransactions() {
    console.log('Transacciones disponibles antes de devolver:', this.transactions);
    return this.transactions;
  }

  // Modificamos validateWithMercadoPago para aceptar RussiansDepositData
  async validateWithMercadoPago(depositData: RussiansDepositData) {
    console.log('Validando depósito:', depositData);

    // Mapear RussiansDepositData a DepositData si es necesario
    const depositToValidate: DepositData = {
      cbu: depositData.cbu,
      amount: depositData.amount,
      idTransferencia: depositData.idTransferencia,
      dateCreated: depositData.dateCreated
    };

    // Buscar coincidencia en las transacciones almacenadas (depósitos de MP)
    const matchingTransaction = this.transactions.find(transaction => {
      return (
        transaction.type === 'deposit' &&
        transaction.amount === depositToValidate.amount && // Coincidencia de monto
        this.matchCbuWithMp(transaction, depositToValidate.cbu) && // Coincidencia de CBU con receiver_id o bank_transfer_id
        this.isDateCloseEnough(transaction.date_created, depositToValidate.dateCreated) // Coincidencia aproximada de fecha
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

      console.log('Respuesta de búsqueda en API de Mercado Pago:', JSON.stringify(response.data, null, 2));

      const payments = response.data.results;
      const matchedPayment = payments.find((payment: PaymentData) => {
        return (
          payment.amount === depositToValidate.amount &&
          this.matchCbuWithMp({ payment_method_id: payment.payment_method_id, receiver_id: payment.receiver_id } as unknown as Transaction, depositToValidate.cbu) &&
          this.isDateCloseEnough(payment.date_created, depositToValidate.dateCreated)
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
        id: depositToValidate.idTransferencia,
        type: 'deposit',
        amount: depositToValidate.amount,
        status: 'Pending',
        date_created: depositToValidate.dateCreated || new Date().toISOString(),
        description: 'Depósito pendiente de validación',
        cbu: depositToValidate.cbu,
      };
      this.transactions.push(newTransaction);
      return { status: 'error', message: 'No se pudo validar el depósito con Mercado Pago, pendiente de revisión', transaction: newTransaction };
    } catch (error) {
      console.error('Error al consultar la API de MP:', error);
      const newTransaction: Transaction = {
        id: depositToValidate.idTransferencia,
        type: 'deposit',
        amount: depositToValidate.amount,
        status: 'Pending',
        date_created: depositToValidate.dateCreated || new Date().toISOString(),
        description: 'Depósito con error en validación',
        cbu: depositToValidate.cbu,
      };
      this.transactions.push(newTransaction);
      return { status: 'error', message: 'Error al validar el depósito con Mercado Pago', transaction: newTransaction };
    }
  }

  async validateWithdraw(withdrawData: WithdrawData) {
    console.log('Validando retiro:', withdrawData);

    const newTransaction: Transaction = {
      id: `withdraw_${Date.now()}`,
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

  private matchCbuWithMp(transaction: Transaction | PaymentData, cbu: string): boolean {
    if ('receiver_id' in transaction) {
      // Si es PaymentData o Transaction con receiver_id
      if (!transaction.payment_method_id || !transaction.receiver_id) return false;
      const mappedCbu = this.mapCbuToMpIdentifier(cbu);
      return mappedCbu === transaction.receiver_id || (transaction.payment_method_id === 'cvu' && (transaction as Transaction).type === 'deposit');
    }
    return false; // Si no tiene receiver_id, no hay coincidencia
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