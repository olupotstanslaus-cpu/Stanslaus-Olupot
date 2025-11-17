
export enum UserRole {
  CUSTOMER = 'customer',
  ADMIN = 'admin',
}

export enum OrderStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  OUT_FOR_DELIVERY = 'Out for Delivery',
  DELIVERED = 'Delivered',
  CANCELLED = 'Cancelled',
}

export interface DeliveryAgent {
  id: string;
  name: string;
}

export interface Order {
  id: number;
  customerName: string;
  item: string;
  address: string;
  timestamp: string;
  status: OrderStatus;
  deliveryAgent: DeliveryAgent | null;
}

export interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  isNotification?: boolean;
}

export enum ChatStep {
  GREETING,
  ASK_NAME,
  ASK_ITEM,
  ASK_ADDRESS,
  CONFIRMATION,
  ORDER_PLACED,
  DONE
}
