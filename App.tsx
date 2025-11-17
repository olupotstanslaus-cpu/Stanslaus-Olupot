import React, { useState, useCallback } from 'react';
import { UserRole, Order, OrderStatus, MenuItem } from './types';
import CustomerView from './components/CustomerView';
import AdminView from './components/AdminView';
import { BotIcon, UserShieldIcon } from './components/Icons';
import { DELIVERY_AGENTS, INITIAL_MENU_ITEMS } from './constants';

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole>(UserRole.CUSTOMER);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customerMessages, setCustomerMessages] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(INITIAL_MENU_ITEMS);

  const addOrder = (newOrder: Omit<Order, 'id' | 'status' | 'deliveryAgent'>) => {
    setOrders(prevOrders => [
      ...prevOrders,
      {
        id: Date.now(),
        ...newOrder,
        status: OrderStatus.PENDING,
        deliveryAgent: null,
      },
    ]);
  };

  const addMenuItem = (newItem: Omit<MenuItem, 'id'>) => {
    setMenuItems(prev => [...prev, { ...newItem, id: Date.now() }]);
  };
  
  const updateOrderStatus = useCallback((orderId: number, status: OrderStatus, deliveryAgentId?: string) => {
    let updatedOrder: Order | undefined;
    setOrders(prevOrders =>
      prevOrders.map(order => {
        if (order.id === orderId) {
          updatedOrder = {
              ...order,
              status,
              deliveryAgent: deliveryAgentId
                ? DELIVERY_AGENTS.find(agent => agent.id === deliveryAgentId) || order.deliveryAgent
                : order.deliveryAgent,
            };
            return updatedOrder;
        }
        return order;
      })
    );

    if (!updatedOrder) return;

    let notificationText: string | null = null;
    switch (status) {
        case OrderStatus.APPROVED:
            notificationText = `Great news! Your order #${orderId} has been approved by the admin.`;
            break;
        case OrderStatus.OUT_FOR_DELIVERY:
            notificationText = `Your order #${orderId} is out for delivery with ${updatedOrder.deliveryAgent?.name || 'our delivery partner'}.`;
            break;
        case OrderStatus.DELIVERED:
            notificationText = `Your order #${orderId} has been delivered. Enjoy!`;
            break;
        case OrderStatus.CANCELLED:
            notificationText = `Unfortunately, your order #${orderId} has been cancelled. Please contact support for more details.`;
            break;
        default:
            break;
    }

    if (notificationText) {
        setCustomerMessages(prev => [...prev, {
            id: Date.now(),
            text: notificationText,
            sender: 'bot',
            isNotification: true,
        }]);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-200 flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-4xl h-[95vh] max-h-[800px] bg-white shadow-2xl rounded-lg flex flex-col">
        <header className="bg-gray-800 text-white p-4 rounded-t-lg">
          <h1 className="text-2xl font-bold text-center">WhatsApp Quick Order</h1>
          <div className="flex justify-center items-center mt-4 space-x-2">
            <button
              onClick={() => setRole(UserRole.CUSTOMER)}
              className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center transition-colors duration-300 ${
                role === UserRole.CUSTOMER ? 'bg-green-500 text-white' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              <BotIcon className="w-5 h-5 mr-2" />
              Customer View
            </button>
            <button
              onClick={() => setRole(UserRole.ADMIN)}
              className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center transition-colors duration-300 ${
                role === UserRole.ADMIN ? 'bg-blue-500 text-white' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
               <UserShieldIcon className="w-5 h-5 mr-2" />
              Admin View
            </button>
          </div>
        </header>
        <main className="flex-grow overflow-hidden">
          {role === UserRole.CUSTOMER ? (
            <CustomerView addOrder={addOrder} messages={customerMessages} setMessages={setCustomerMessages} menuItems={menuItems} />
          ) : (
            <AdminView 
              orders={orders} 
              updateOrderStatus={updateOrderStatus}
              menuItems={menuItems}
              addMenuItem={addMenuItem}
              addOrder={addOrder}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;