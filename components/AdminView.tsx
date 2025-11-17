import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Order, OrderStatus, DeliveryAgent, MenuItem, PaymentMethod } from '../types';
import { PAYMENT_METHODS } from '../constants';
import { CheckCircleIcon, ClockIcon, TruckIcon, ClipboardListIcon, ChevronDownIcon, XCircleIcon, PlusCircleIcon, MenuIcon, SearchIcon, UsersIcon, BellIcon, XIcon } from './Icons';

interface AdminViewProps {
  orders: Order[];
  updateOrderStatus: (orderId: number, status: OrderStatus, deliveryAgentId?: string) => void;
  menuItems: MenuItem[];
  addMenuItem: (item: Omit<MenuItem, 'id'>) => void;
  addOrder: (order: Omit<Order, 'id' | 'status' | 'deliveryAgent'>) => void;
  deliveryAgents: DeliveryAgent[];
  toggleAgentAvailability: (agentId: string) => void;
}

const getStatusIcon = (status: OrderStatus) => {
  switch (status) {
    case OrderStatus.PENDING:
      return <ClockIcon className="w-5 h-5 text-yellow-500" />;
    case OrderStatus.APPROVED:
      return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
    case OrderStatus.OUT_FOR_DELIVERY:
      return <TruckIcon className="w-5 h-5 text-blue-500" />;
    case OrderStatus.DELIVERED:
      return <CheckCircleIcon className="w-5 h-5 text-teal-500" />;
    case OrderStatus.CANCELLED:
      return <XCircleIcon className="w-5 h-5 text-red-500" />;
    default:
      return <ClipboardListIcon className="w-5 h-5 text-gray-500" />;
  }
};

const getStatusColorClass = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case OrderStatus.APPROVED:
        return 'bg-green-100 text-green-800';
      case OrderStatus.OUT_FOR_DELIVERY:
        return 'bg-blue-100 text-blue-800';
      case OrderStatus.DELIVERED:
        return 'bg-teal-100 text-teal-800';
      case OrderStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

const OrderCard: React.FC<{ order: Order, onUpdateStatus: (orderId: number, status: OrderStatus, deliveryAgent?: DeliveryAgent) => void, deliveryAgents: DeliveryAgent[] }> = ({ order, onUpdateStatus, deliveryAgents }) => {
    const [selectedAgent, setSelectedAgent] = useState<DeliveryAgent | null>(null);
    const [isAssigning, setIsAssigning] = useState(false);
    
    const availableAgents = deliveryAgents.filter(agent => agent.isAvailable);

    const handleConfirmAssignment = () => {
        if(selectedAgent) {
            onUpdateStatus(order.id, OrderStatus.OUT_FOR_DELIVERY, selectedAgent);
            setIsAssigning(false);
        }
    }
    
    const renderAssignUI = () => (
        <div className="w-full space-y-2">
            <div className="relative">
                <select
                    onChange={(e) => setSelectedAgent(availableAgents.find(a => a.id === e.target.value) || null)}
                    className="w-full appearance-none bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                >
                    <option value="">Select an agent</option>
                    {availableAgents.map(agent => (
                        <option key={agent.id} value={agent.id}>{agent.name}</option>
                    ))}
                </select>
                <ChevronDownIcon className="w-5 h-5 text-gray-500 absolute top-1/2 right-3 -translate-y-1/2 pointer-events-none" />
            </div>
            {availableAgents.length === 0 && <p className="text-xs text-center text-red-600">No delivery agents are currently available.</p>}
            <div className="flex space-x-2">
                <button onClick={handleConfirmAssignment} disabled={!selectedAgent} className="flex-grow bg-blue-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors">Confirm Assignment</button>
                <button onClick={() => setIsAssigning(false)} className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors">Cancel</button>
            </div>
        </div>
    );

  return (
    <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 transition-shadow hover:shadow-lg flex flex-col justify-between">
        <div>
            <div className="flex justify-between items-start">
                <h3 className="font-bold text-lg text-gray-800">Order #{order.id}</h3>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full flex items-center space-x-2 ${getStatusColorClass(order.status)}`}>
                    {getStatusIcon(order.status)}
                    <span>{order.status}</span>
                </span>
            </div>
            <div className="mt-4 space-y-2 text-gray-600 text-sm">
                <p><strong>Customer:</strong> {order.customerName}</p>
                <p><strong>Item:</strong> {order.item}</p>
                <p><strong>Address:</strong> {order.address}</p>
                <p><strong>Payment:</strong> {order.paymentMethod}</p>
                <p className="text-xs text-gray-400 pt-1"><strong>Time:</strong> {order.timestamp}</p>
                 {order.deliveryAgent && <p><strong>Agent:</strong> {order.deliveryAgent.name}</p>}
            </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            {order.status === OrderStatus.PENDING && (
                <div className="w-full flex space-x-2">
                    <button onClick={() => onUpdateStatus(order.id, OrderStatus.APPROVED)} className="flex-grow bg-green-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-green-600 transition-colors">Approve Order</button>
                    <button onClick={() => onUpdateStatus(order.id, OrderStatus.CANCELLED)} className="flex-grow bg-red-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-red-600 transition-colors">Cancel</button>
                </div>
            )}
            {order.status === OrderStatus.APPROVED && (
                !isAssigning ? (
                    <button 
                        onClick={() => setIsAssigning(true)} 
                        className="w-full text-white bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-md font-semibold transition-colors"
                    >
                        Assign Delivery Agent
                    </button>
                ) : (
                    renderAssignUI()
                )
            )}
            {order.status === OrderStatus.OUT_FOR_DELIVERY && (
                <div className="w-full flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <button onClick={() => onUpdateStatus(order.id, OrderStatus.DELIVERED)} className="w-full bg-teal-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-teal-600 transition-colors">Mark as Delivered</button>
                    <button onClick={() => onUpdateStatus(order.id, OrderStatus.CANCELLED)} className="w-full bg-red-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-red-600 transition-colors">Cancel Order</button>
                </div>
            )}
        </div>
    </div>
  )
}

const MenuManager: React.FC<{ menuItems: MenuItem[]; addMenuItem: (item: Omit<MenuItem, 'id'>) => void; }> = ({ menuItems, addMenuItem }) => {
    const [newItemName, setNewItemName] = useState('');
    const [newItemPrice, setNewItemPrice] = useState('');

    const handleAddItem = (e: React.FormEvent) => {
        e.preventDefault();
        const price = parseFloat(newItemPrice);
        if (newItemName.trim() && !isNaN(price) && price > 0) {
            addMenuItem({ name: newItemName, price });
            setNewItemName('');
            setNewItemPrice('');
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold text-gray-700 mb-3">Add New Menu Item</h3>
                <form onSubmit={handleAddItem} className="bg-white p-4 rounded-lg shadow-md border space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="itemName" className="block mb-2 text-sm font-medium text-gray-900">Item Name</label>
                            <input
                                type="text"
                                id="itemName"
                                value={newItemName}
                                onChange={(e) => setNewItemName(e.target.value)}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                                placeholder="e.g., Pepperoni Pizza"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="itemPrice" className="block mb-2 text-sm font-medium text-gray-900">Price</label>
                            <input
                                type="number"
                                id="itemPrice"
                                value={newItemPrice}
                                onChange={(e) => setNewItemPrice(e.target.value)}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                                placeholder="e.g., 14.99"
                                required
                                step="0.01"
                                min="0"
                            />
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-green-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-green-600 transition-colors flex items-center justify-center">
                        <PlusCircleIcon className="w-5 h-5 mr-2" /> Add Item
                    </button>
                </form>
            </div>
            <div>
                <h3 className="text-xl font-semibold text-gray-700 mb-3">Current Menu</h3>
                <div className="bg-white p-4 rounded-lg shadow-md border">
                    <ul className="space-y-2">
                        {menuItems.map(item => (
                            <li key={item.id} className="flex justify-between items-center p-2 rounded-md hover:bg-gray-50">
                                <span className="text-gray-800">{item.name}</span>
                                <span className="font-semibold text-gray-600">${item.price.toFixed(2)}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

const AddOrderForm: React.FC<{ menuItems: MenuItem[]; addOrder: (order: Omit<Order, 'id'|'status'|'deliveryAgent'>) => void; setActiveTab: (tab: string) => void; }> = ({ menuItems, addOrder, setActiveTab }) => {
    const [customerName, setCustomerName] = useState('');
    const [address, setAddress] = useState('');
    const [selectedItem, setSelectedItem] = useState('');
    const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>(PaymentMethod.COD);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (customerName.trim() && address.trim() && selectedItem) {
            addOrder({
                customerName,
                address,
                item: selectedItem,
                paymentMethod: selectedPayment,
                timestamp: new Date().toLocaleTimeString()
            });
            setCustomerName('');
            setAddress('');
            setSelectedItem('');
            setSelectedPayment(PaymentMethod.COD);
            alert('Order added successfully!');
            setActiveTab('dashboard');
        }
    };

    return (
        <div>
             <h3 className="text-xl font-semibold text-gray-700 mb-3">Create a New Order</h3>
             <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow-md border space-y-4">
                <div>
                    <label htmlFor="customerName" className="block mb-2 text-sm font-medium text-gray-900">Customer Name</label>
                    <input type="text" id="customerName" value={customerName} onChange={e => setCustomerName(e.target.value)} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required />
                </div>
                <div>
                    <label htmlFor="item" className="block mb-2 text-sm font-medium text-gray-900">Menu Item</label>
                    <select id="item" value={selectedItem} onChange={e => setSelectedItem(e.target.value)} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required>
                        <option value="">Select an item</option>
                        {menuItems.map(item => <option key={item.id} value={item.name}>{item.name}</option>)}
                    </select>
                </div>
                 <div>
                    <label htmlFor="address" className="block mb-2 text-sm font-medium text-gray-900">Delivery Address</label>
                    <textarea id="address" value={address} onChange={e => setAddress(e.target.value)} rows={2} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required></textarea>
                </div>
                 <div className="grid grid-cols-1">
                    <div>
                        <label htmlFor="payment" className="block mb-2 text-sm font-medium text-gray-900">Payment Method</label>
                        <select id="payment" value={selectedPayment} onChange={e => setSelectedPayment(e.target.value as PaymentMethod)} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required>
                            {PAYMENT_METHODS.map(method => <option key={method} value={method}>{method}</option>)}
                        </select>
                    </div>
                 </div>
                <button type="submit" className="w-full bg-blue-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-600 transition-colors flex items-center justify-center">
                    <PlusCircleIcon className="w-5 h-5 mr-2" /> Create Order
                </button>
             </form>
        </div>
    );
}

const Dashboard: React.FC<{orders: Order[], deliveryAgents: DeliveryAgent[], onUpdate: (orderId: number, status: OrderStatus, agent?: DeliveryAgent) => void}> = ({orders, deliveryAgents, onUpdate}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrders = orders.filter(order =>
    order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.item.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingOrders = filteredOrders.filter(o => o.status === OrderStatus.PENDING);
  const approvedOrders = filteredOrders.filter(o => o.status === OrderStatus.APPROVED);
  const inDeliveryOrders = filteredOrders.filter(o => o.status === OrderStatus.OUT_FOR_DELIVERY);
  const completedOrders = filteredOrders.filter(o => o.status === OrderStatus.DELIVERED || o.status === OrderStatus.CANCELLED);

  if (orders.length === 0) {
      return (
        <div className="text-center py-16">
            <ClipboardListIcon className="w-16 h-16 mx-auto text-gray-300" />
            <p className="mt-4 text-gray-500">No orders have been placed yet.</p>
        </div>
      )
  }

  return (
      <div className="space-y-6">
        <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <SearchIcon className="w-5 h-5 text-gray-500" />
            </div>
            <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search orders by customer or item..."
                className="block w-full p-2.5 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-white focus:ring-blue-500 focus:border-blue-500"
            />
        </div>

        {filteredOrders.length === 0 && orders.length > 0 && (
            <div className="text-center py-16">
                <SearchIcon className="w-16 h-16 mx-auto text-gray-300" />
                <p className="mt-4 text-lg font-semibold text-gray-600">No Orders Found</p>
                <p className="mt-2 text-gray-500">Your search for "{searchQuery}" did not match any orders.</p>
            </div>
        )}

        {filteredOrders.length > 0 && (
            <>
                <section>
                    <h3 className="text-xl font-semibold text-gray-700 mb-3">Pending Orders ({pendingOrders.length})</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {pendingOrders.map(order => <OrderCard key={order.id} order={order} onUpdateStatus={onUpdate} deliveryAgents={deliveryAgents} />)}
                        {pendingOrders.length === 0 && <p className="text-gray-500 col-span-full">No pending orders.</p>}
                    </div>
                </section>
                <section>
                    <h3 className="text-xl font-semibold text-gray-700 mb-3">Approved for Delivery ({approvedOrders.length})</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {approvedOrders.map(order => <OrderCard key={order.id} order={order} onUpdateStatus={onUpdate} deliveryAgents={deliveryAgents} />)}
                        {approvedOrders.length === 0 && <p className="text-gray-500 col-span-full">No orders are currently approved.</p>}
                    </div>
                </section>
                <section>
                    <h3 className="text-xl font-semibold text-gray-700 mb-3">Out for Delivery ({inDeliveryOrders.length})</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {inDeliveryOrders.map(order => <OrderCard key={order.id} order={order} onUpdateStatus={onUpdate} deliveryAgents={deliveryAgents} />)}
                        {inDeliveryOrders.length === 0 && <p className="text-gray-500 col-span-full">No orders are out for delivery.</p>}
                    </div>
                </section>
                <section>
                    <h3 className="text-xl font-semibold text-gray-700 mb-3">Completed Orders ({completedOrders.length})</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {completedOrders.map(order => <OrderCard key={order.id} order={order} onUpdateStatus={onUpdate} deliveryAgents={deliveryAgents} />)}
                        {completedOrders.length === 0 && <p className="text-gray-500 col-span-full">No orders have been completed or cancelled.</p>}
                    </div>
                </section>
            </>
        )}
    </div>
  );
}

const AgentDetailView: React.FC<{ agent: DeliveryAgent, orders: Order[] }> = ({ agent, orders }) => {
    const agentOrders = orders.filter(order => order.deliveryAgent?.id === agent.id);
    const outForDeliveryCount = agentOrders.filter(o => o.status === OrderStatus.OUT_FOR_DELIVERY).length;
    const deliveredCount = agentOrders.filter(o => o.status === OrderStatus.DELIVERED).length;

    return (
        <div className="bg-white p-6 rounded-lg shadow-md border h-full">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">{agent.name}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-700 font-medium">Out for Delivery</p>
                    <p className="text-2xl font-bold text-blue-900">{outForDeliveryCount}</p>
                </div>
                <div className="bg-teal-50 p-4 rounded-lg">
                    <p className="text-sm text-teal-700 font-medium">Delivered</p>
                    <p className="text-2xl font-bold text-teal-900">{deliveredCount}</p>
                </div>
            </div>

            <h4 className="text-lg font-semibold text-gray-700 mb-3">Assigned Orders ({agentOrders.length})</h4>
            {agentOrders.length > 0 ? (
                <ul className="space-y-3">
                    {agentOrders.map(order => (
                        <li key={order.id} className="p-3 bg-gray-50 rounded-md border flex justify-between items-center">
                            <div>
                                <p className="font-semibold text-gray-800">Order #{order.id} - {order.item}</p>
                                <p className="text-sm text-gray-500">{order.address}</p>
                            </div>
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full flex items-center space-x-2 ${getStatusColorClass(order.status)}`}>
                                {getStatusIcon(order.status)}
                                <span>{order.status}</span>
                            </span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-gray-500">No orders assigned to this agent yet.</p>
            )}
        </div>
    );
};

const DeliveryAgentsView: React.FC<{ orders: Order[], deliveryAgents: DeliveryAgent[], onToggleAvailability: (agentId: string) => void }> = ({ orders, deliveryAgents, onToggleAvailability }) => {
    const [selectedAgentId, setSelectedAgentId] = useState<string | null>(deliveryAgents.length > 0 ? deliveryAgents[0].id : null);

    const selectedAgent = deliveryAgents.find(agent => agent.id === selectedAgentId);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 h-full">
            <div className="md:col-span-1 lg:col-span-1 bg-white p-4 rounded-lg shadow-md border">
                <h3 className="text-xl font-semibold text-gray-700 mb-3">Delivery Agents</h3>
                <ul className="space-y-2">
                    {deliveryAgents.map(agent => (
                        <li key={agent.id} 
                            onClick={() => setSelectedAgentId(agent.id)}
                            className={`p-3 rounded-md transition-all cursor-pointer ${
                                selectedAgentId === agent.id ? 'bg-blue-100 ring-2 ring-blue-500' : 'bg-gray-50 hover:bg-gray-100'
                            } ${!agent.isAvailable ? 'opacity-60' : ''}`}
                        >
                            <div className="flex justify-between items-center">
                                <div className="flex items-center">
                                    <div className={`w-3 h-3 rounded-full mr-3 ${agent.isAvailable ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                    <span className={`font-medium ${selectedAgentId === agent.id ? 'text-blue-800' : 'text-gray-800'}`}>{agent.name}</span>
                                </div>
                                <label htmlFor={`toggle-${agent.id}`} className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        id={`toggle-${agent.id}`}
                                        className="sr-only peer"
                                        checked={agent.isAvailable}
                                        onChange={(e) => {
                                            e.stopPropagation();
                                            onToggleAvailability(agent.id);
                                        }}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                 </label>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="md:col-span-2 lg:col-span-3">
                {selectedAgent ? (
                    <AgentDetailView agent={selectedAgent} orders={orders} />
                ) : (
                    <div className="flex items-center justify-center h-full bg-white rounded-lg shadow-md border">
                        <div className="text-center">
                            <UsersIcon className="w-16 h-16 mx-auto text-gray-300" />
                            <p className="mt-4 text-gray-500">Select an agent to see their details.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};


const AdminView: React.FC<AdminViewProps> = ({ orders, updateOrderStatus, menuItems, addMenuItem, addOrder, deliveryAgents, toggleAgentAvailability }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [notifications, setNotifications] = useState<{ id: number; message: string }[]>([]);
  const prevOrderCountRef = useRef(orders.length);

  const onUpdate = (orderId: number, status: OrderStatus, agent?: DeliveryAgent) => {
    updateOrderStatus(orderId, status, agent?.id);
  };

  const removeNotification = useCallback((id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  useEffect(() => {
    if (orders.length > prevOrderCountRef.current) {
        const newOrdersCount = orders.length - prevOrderCountRef.current;
        const newOrders = orders.slice(-newOrdersCount);

        newOrders.forEach(newOrder => {
            const newNotification = {
                id: newOrder.id,
                message: `New order #${newOrder.id} from ${newOrder.customerName}.`
            };
            setNotifications(prev => [newNotification, ...prev]);

            setTimeout(() => {
                removeNotification(newOrder.id);
            }, 6000);
        });
    }
    prevOrderCountRef.current = orders.length;
  }, [orders, removeNotification]);


  const pendingOrderCount = orders.filter(o => o.status === OrderStatus.PENDING).length;

  const TabButton: React.FC<{label: string, tabName: string, icon: React.ReactNode, notificationCount?: number}> = ({label, tabName, icon, notificationCount}) => (
     <button
        onClick={() => setActiveTab(tabName)}
        className={`relative flex items-center space-x-2 py-2 px-4 text-sm font-medium text-center rounded-t-lg transition-colors ${
            activeTab === tabName
            ? 'border-b-2 border-blue-500 text-blue-600'
            : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }`}
        >
        {icon}
        <span>{label}</span>
        {notificationCount && notificationCount > 0 && (
            <span className="absolute top-0 right-0 -mt-1 -mr-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
                {notificationCount}
            </span>
        )}
    </button>
  );
  
  return (
    <div className="p-4 bg-gray-50 h-full flex flex-col">
       {/* Notification Toast Container */}
      <div aria-live="assertive" className="fixed inset-0 flex items-end px-4 py-6 pointer-events-none sm:p-6 sm:items-start z-50">
        <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
          {notifications.map((notification) => (
            <div key={notification.id} className="max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden">
              <div className="p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <BellIcon className="h-6 w-6 text-green-500" aria-hidden="true" />
                  </div>
                  <div className="ml-3 w-0 flex-1 pt-0.5">
                    <p className="text-sm font-medium text-gray-900">New Order Received</p>
                    <p className="mt-1 text-sm text-gray-500">{notification.message}</p>
                  </div>
                  <div className="ml-4 flex-shrink-0 flex">
                    <button onClick={() => removeNotification(notification.id)} className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                      <span className="sr-only">Close</span>
                      <XIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-shrink-0">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Admin Panel</h2>
        <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                <TabButton label="Dashboard" tabName="dashboard" icon={<ClipboardListIcon className="w-5 h-5"/>} notificationCount={pendingOrderCount} />
                <TabButton label="Menu" tabName="menu" icon={<MenuIcon className="w-5 h-5"/>} />
                <TabButton label="Add Order" tabName="addOrder" icon={<PlusCircleIcon className="w-5 h-5"/>} />
                <TabButton label="Delivery Agents" tabName="deliveryAgents" icon={<UsersIcon className="w-5 h-5" />} />
            </nav>
        </div>
      </div>
      
      <div className="flex-grow overflow-y-auto pt-4">
        {activeTab === 'dashboard' && <Dashboard orders={orders} deliveryAgents={deliveryAgents} onUpdate={onUpdate} />}
        {activeTab === 'menu' && <MenuManager menuItems={menuItems} addMenuItem={addMenuItem} />}
        {activeTab === 'addOrder' && <AddOrderForm menuItems={menuItems} addOrder={addOrder} setActiveTab={setActiveTab} />}
        {activeTab === 'deliveryAgents' && <DeliveryAgentsView orders={orders} deliveryAgents={deliveryAgents} onToggleAvailability={toggleAgentAvailability} />}
      </div>
    </div>
  );
};

export default AdminView;