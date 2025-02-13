export class Chat {
    id: string;
    userId?: string;  // Para usuarios registrados
    guestId?: string; // Para usuarios no registrados
    status: ChatStatus;
    lastMessage: string;
    unreadCount: number;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export enum ChatStatus {
    ACTIVE = 'ACTIVE',
    CLOSED = 'CLOSED'
  }