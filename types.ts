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

export enum PaymentMethod {
  COD = 'Cash on Delivery',
  ONLINE = 'Online Payment',
}

export interface DeliveryAgent {
  id: string;
  name: string;
  isAvailable: boolean;
}

export interface MenuItem {
  id: number;
  name: string;
  price: number;
}

export interface Order {
  id: number;
  customerName: string;
  item: string;
  address: string;
  timestamp: string;
  status: OrderStatus;
  deliveryAgent: DeliveryAgent | null;
  paymentMethod: PaymentMethod;
}

export interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  isNotification?: boolean;
  notificationType?: 'success' | 'info' | 'error';
}

export enum ChatStep {
  GREETING,
  ASK_NAME,
  ASK_ITEM,
  ASK_ADDRESS,
  ASK_PAYMENT,
  CONFIRMATION,
  ORDER_PLACED,
  DONE
}

export interface GalleryItem {
  id: string;
  type: 'image' | 'video';
  url: string; // base64 or object URL
  prompt: string;
  isHomePageAsset: boolean;
}