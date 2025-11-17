import React, { useState, useCallback, useEffect, useRef } from 'react';
import { UserRole, Order, OrderStatus, MenuItem, DeliveryAgent, GalleryItem, Advertisement, PaymentMethod, CartSaleItem } from './types';
import CustomerView from './components/CustomerView';
import AdminView from './components/AdminView';
import { BotIcon, UserShieldIcon, HomeIcon } from './components/Icons';
import { DELIVERY_AGENTS, INITIAL_MENU_ITEMS } from './constants';
import HomePage from './components/HomePage';

const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'app'>('home');
  const [role, setRole] = useState<UserRole>(UserRole.CUSTOMER);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customerMessages, setCustomerMessages] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(INITIAL_MENU_ITEMS);
  const [deliveryAgents, setDeliveryAgents] = useState<DeliveryAgent[]>(DELIVERY_AGENTS);
  const [unreadCustomerNotifications, setUnreadCustomerNotifications] = useState(0);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [appLogoUrl, setAppLogoUrl] = useState<string | null>(null);
  
  const goHome = useCallback(() => setView('home'), []);

  const handleSetAppLogo = useCallback((url: string) => {
    setAppLogoUrl(url);
    alert('App logo has been updated!');
  }, []);

  const addGalleryItem = useCallback((item: Omit<GalleryItem, 'id'>) => {
    setGalleryItems(prev => [...prev, { ...item, id: `${Date.now()}` }]);
  }, []);

  const deleteGalleryItem = useCallback((itemId: string) => {
    if (window.confirm('Are you sure you want to delete this media item?')) {
      setGalleryItems(prev => prev.filter(item => item.id !== itemId));
    }
  }, []);

  const toggleHomePageAsset = useCallback((itemId: string) => {
    setGalleryItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, isHomePageAsset: !item.isHomePageAsset } : item
      )
    );
  }, []);

  const addAdvertisement = useCallback((ad: Omit<Advertisement, 'id' | 'views' | 'clicks'>) => {
    setAdvertisements(prev => [...prev, { ...ad, id: `${Date.now()}`, views: 0, clicks: 0 }]);
  }, []);

  const toggleAdStatus = useCallback((adId: string) => {
    setAdvertisements(prev =>
      prev.map(ad => (ad.id === adId ? { ...ad, isActive: !ad.isActive } : ad))
    );
  }, []);

  const deleteAdvertisement = useCallback((adId: string) => {
    if (window.confirm('Are you sure you want to delete this advertisement?')) {
      setAdvertisements(prev => prev.filter(ad => ad.id !== adId));
    }
  }, []);

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

  const addStoreSale = (cartItems: CartSaleItem[], paymentMethod: PaymentMethod, total: number) => {
    if (cartItems.length === 0) return;

    const itemsSummary = cartItems.map(item => `${item.quantity}x ${item.name}`).join(', ');
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    
    const newOrder: Order = {
      id: Date.now(),
      customerName: 'In-Store Sale',
      customerNumber: 'N/A',
      item: `${totalItems} item(s)`,
      price: total,
      address: 'In-Store',
      timestamp: new Date().toISOString(),
      status: OrderStatus.DELIVERED,
      deliveryAgent: null,
      paymentMethod: paymentMethod,
    };
    
    setOrders(prevOrders => [...prevOrders, newOrder]);
  };

  const addMenuItem = (newItem: Omit<MenuItem, 'id'>) => {
    setMenuItems(prev => [...prev, { ...newItem, id: Date.now() }]);
  };

  const toggleAgentAvailability = useCallback((agentId: string) => {
    setDeliveryAgents(prevAgents =>
      prevAgents.map(agent =>
        agent.id === agentId ? { ...agent, isAvailable: !agent.isAvailable } : agent
      )
    );
  }, []);

  const updateOrderStatus = useCallback((orderId: number, status: OrderStatus, deliveryAgentId?: string) => {
    let updatedOrder: Order | undefined;
    setOrders(prevOrders =>
      prevOrders.map(order => {
        if (order.id === orderId) {
          updatedOrder = {
              ...order,
              status,
              deliveryAgent: deliveryAgentId
                ? deliveryAgents.find(agent => agent.id === deliveryAgentId) || order.deliveryAgent
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
        let notificationType: 'success' | 'info' | 'error' = 'info';
        if (status === OrderStatus.APPROVED || status === OrderStatus.DELIVERED) {
            notificationType = 'success';
        } else if (status === OrderStatus.CANCELLED) {
            notificationType = 'error';
        }

        setCustomerMessages(prev => [...prev, {
            id: Date.now(),
            text: notificationText,
            sender: 'bot',
            isNotification: true,
            notificationType,
        }]);
        
        if (role === UserRole.ADMIN) {
            setUnreadCustomerNotifications(prev => prev + 1);
        }
    }
  }, [deliveryAgents, role]);

  const handleRoleChange = (newRole: UserRole) => {
    if (newRole === UserRole.CUSTOMER) {
      setUnreadCustomerNotifications(0);
    }
    setRole(newRole);
  };
  
  if (view === 'home') {
    return <HomePage 
              assets={galleryItems.filter(item => item.isHomePageAsset)} 
              enterApp={() => setView('app')} 
              appLogoUrl={appLogoUrl}
           />;
  }

  return (
    <div className="min-h-screen bg-gray-200 flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-4xl h-[95vh] max-h-[800px] bg-white shadow-2xl rounded-lg flex flex-col">
        <header className="bg-gray-800 text-white p-4 rounded-t-lg">
          <div className="flex justify-center items-center">
             {appLogoUrl ? (
                <img src={appLogoUrl} alt="Logo" className="h-8 w-auto" />
            ) : (
                <h1 className="text-2xl font-bold text-center">WhatsApp Quick Order</h1>
            )}
          </div>
          <div className="flex justify-center items-center mt-4 space-x-2">
            <button
              onClick={() => handleRoleChange(UserRole.CUSTOMER)}
              className={`relative px-4 py-2 rounded-full text-sm font-semibold flex items-center transition-colors duration-300 ${
                role === UserRole.CUSTOMER ? 'bg-green-500 text-white' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              <BotIcon className="w-5 h-5 mr-2" />
              Customer View
              {unreadCustomerNotifications > 0 && (
                <span className="absolute top-0 right-0 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              )}
            </button>
            <button
              onClick={() => handleRoleChange(UserRole.ADMIN)}
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
            <CustomerView 
              addOrder={addOrder} 
              messages={customerMessages} 
              setMessages={setCustomerMessages} 
              menuItems={menuItems} 
              onBackToHome={goHome}
            />
          ) : (
            <AdminView 
              orders={orders} 
              updateOrderStatus={updateOrderStatus}
              menuItems={menuItems}
              addMenuItem={addMenuItem}
              deliveryAgents={deliveryAgents}
              toggleAgentAvailability={toggleAgentAvailability}
              galleryItems={galleryItems}
              addGalleryItem={addGalleryItem}
              toggleHomePageAsset={toggleHomePageAsset}
              deleteGalleryItem={deleteGalleryItem}
              advertisements={advertisements}
              addAdvertisement={addAdvertisement}
              toggleAdStatus={toggleAdStatus}
              deleteAdvertisement={deleteAdvertisement}
              onBackToHome={goHome}
              setAppLogo={handleSetAppLogo}
              addStoreSale={addStoreSale}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;