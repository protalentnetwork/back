import { WithdrawData } from '../transaction.types';

export interface RussiansWithdrawData extends WithdrawData {
  // Puedes añadir aquí campos específicos para el retiro de "rusos"
  // Por ejemplo:
  russiansSpecificField?: string;
}