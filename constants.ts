import { DeliveryAgent, MenuItem } from './types';

export const DELIVERY_AGENTS: DeliveryAgent[] = [
  { id: 'da1', name: 'John Doe' },
  { id: 'da2', name: 'Jane Smith' },
  { id: 'da3', name: 'Mike Ross' },
  { id: 'da4', name: 'Rachel Zane' },
];

export const INITIAL_MENU_ITEMS: MenuItem[] = [
  { id: 1, name: 'Margherita Pizza', price: 12.99 },
  { id: 2, name: 'Cheeseburger', price: 8.99 },
  { id: 3, name: 'Caesar Salad', price: 7.49 },
  { id: 4, name: 'Spaghetti Carbonara', price: 14.50 },
  { id: 5, name: 'Chocolate Lava Cake', price: 6.00 },
];

export const BOT_NAME = "Quick Eats Bot";