import React, { useState } from 'react';
import { Order, OrderStatus, DeliveryAgent, MenuItem } from '../types';
import { DELIVERY_AGENTS } from '../constants';
import { CheckCircleIcon, ClockIcon, TruckIcon, ClipboardListIcon, ChevronDownIcon, XCircleIcon, PlusCircleIcon, MenuIcon } from './Icons';

interface AdminViewProps {
  orders: Order[];
  updateOrderStatus: (orderId: number, status: OrderStatus, deliveryAgentId?: string) => void;
  menuItems: MenuItem[];
  addMenuItem: (item: Omit<MenuItem, 'id'>) => void;
  addOrder: (order: Omit<Order, 'id' | 'status' | 'deliveryAgent'>) => void;
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

const OrderCard: React.FC<{ order: Order, onUpdateStatus: (orderId: number, status: OrderStatus, deliveryAgent?: DeliveryAgent) => void }> = ({ order, onUpdateStatus }) => {
    const [selectedAgent, setSelectedAgent] = useState<DeliveryAgent | null>(null);
    const [showAgentSelect, setShowAgentSelect] = useState(false);

    const handleApprove = () => onUpdateStatus(order.id, OrderStatus.APPROVED);
    const handleAssign = () => {
        if(selectedAgent) {
            onUpdateStatus(order.id, OrderStatus.OUT_FOR_DELIVERY, selectedAgent);
            setShowAgentSelect(false);
        }
    }

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
            <div className="mt-4 space-y-2 text-gray-600">
                <p><strong>Customer:</strong> {order.customerName}</p>
                <p><strong>Item:</strong> {order.item}</p>
                <p><strong>Address:</strong> {order.address}</p>
                <p className="text-sm text-gray-400"><strong>Time:</strong> {order.timestamp}</p>
                 {order.deliveryAgent && <p><strong>Agent:</strong> {order.deliveryAgent.name}</p>}
            </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            {order.status === OrderStatus.PENDING && (
                <button onClick={handleApprove} className="w-full bg-green-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-green-600 transition-colors">Approve</button>
            )}
            {order.status === OrderStatus.APPROVED && !showAgentSelect && (
                 <button onClick={() => setShowAgentSelect(true)} className="w-full bg-blue-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-600 transition-colors">Assign to Delivery Agent</button>
            )}
            {showAgentSelect && (
                <div className="w-full space-y-2">
                    <div className="relative">
                        <select
                            onChange={(e) => setSelectedAgent(DELIVERY_AGENTS.find(a => a.id === e.target.value) || null)}
                            className="w-full appearance-none bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                        >
                            <option value="">Select an agent</option>
                            {DELIVERY_AGENTS.map(agent => (
                                <option key={agent.id} value={agent.id}>{agent.name}</option>
                            ))}
                        </select>
                        <ChevronDownIcon className="w-5 h-5 text-gray-500 absolute top-1/2 right-3 -translate-y-1/2 pointer-events-none" />
                    </div>
                    <div className="flex space-x-2">
                        <button onClick={handleAssign} disabled={!selectedAgent} className="flex-grow bg-blue-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors">Confirm Assignment</button>
                        <button onClick={() => setShowAgentSelect(false)} className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors">Cancel</button>
                    </div>
                </div>
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

const AddOrderForm: React.FC<{ menuItems: MenuItem[]; addOrder: (order: Omit<Order, 'id'|'status'|'deliveryAgent'>) => void; setActiveTab: (tab: string) => void }> = ({ menuItems, addOrder, setActiveTab }) => {
    const [customerName, setCustomerName] = useState('');
    const [address, setAddress] = useState('');
    const [selectedItem, setSelectedItem] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (customerName.trim() && address.trim() && selectedItem) {
            addOrder({
                customerName,
                address,
                item: selectedItem,
                timestamp: new Date().toLocaleTimeString()
            });
            setCustomerName('');
            setAddress('');
            setSelectedItem('');
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
                    <textarea id="address" value={address} onChange={e => setAddress(e.target.value)} rows={3} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required></textarea>
                </div>
                <button type="submit" className="w-full bg-blue-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-600 transition-colors flex items-center justify-center">
                    <PlusCircleIcon className="w-5 h-5 mr-2" /> Create Order
                </button>
             </form>
        </div>
    );
}

const Dashboard: React.FC<{orders: Order[], onUpdate: (orderId: number, status: OrderStatus, agent?: DeliveryAgent) => void}> = ({orders, onUpdate}) => {
  const pendingOrders = orders.filter(o => o.status === OrderStatus.PENDING);
  const approvedOrders = orders.filter(o => o.status === OrderStatus.APPROVED);
  const inDeliveryOrders = orders.filter(o => o.status === OrderStatus.OUT_FOR_DELIVERY);
  const completedOrders = orders.filter(o => o.status === OrderStatus.DELIVERED || o.status === OrderStatus.CANCELLED);

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
        <section>
            <h3 className="text-xl font-semibold text-gray-700 mb-3">Pending Orders ({pendingOrders.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingOrders.map(order => <OrderCard key={order.id} order={order} onUpdateStatus={onUpdate} />)}
                {pendingOrders.length === 0 && <p className="text-gray-500 col-span-full">No pending orders.</p>}
            </div>
        </section>
        <section>
            <h3 className="text-xl font-semibold text-gray-700 mb-3">Approved for Delivery ({approvedOrders.length})</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {approvedOrders.map(order => <OrderCard key={order.id} order={order} onUpdateStatus={onUpdate} />)}
                 {approvedOrders.length === 0 && <p className="text-gray-500 col-span-full">No orders are currently approved.</p>}
            </div>
        </section>
        <section>
            <h3 className="text-xl font-semibold text-gray-700 mb-3">Out for Delivery ({inDeliveryOrders.length})</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {inDeliveryOrders.map(order => <OrderCard key={order.id} order={order} onUpdateStatus={onUpdate} />)}
                {inDeliveryOrders.length === 0 && <p className="text-gray-500 col-span-full">No orders are out for delivery.</p>}
            </div>
        </section>
         <section>
            <h3 className="text-xl font-semibold text-gray-700 mb-3">Completed Orders ({completedOrders.length})</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {completedOrders.map(order => <OrderCard key={order.id} order={order} onUpdateStatus={onUpdate} />)}
                {completedOrders.length === 0 && <p className="text-gray-500 col-span-full">No orders have been completed or cancelled.</p>}
            </div>
        </section>
    </div>
  );
}

const AdminView: React.FC<AdminViewProps> = ({ orders, updateOrderStatus, menuItems, addMenuItem, addOrder }) => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const onUpdate = (orderId: number, status: OrderStatus, agent?: DeliveryAgent) => {
    updateOrderStatus(orderId, status, agent?.id);
  }

  const TabButton: React.FC<{label: string, tabName: string, icon: React.ReactNode}> = ({label, tabName, icon}) => (
     <button
        onClick={() => setActiveTab(tabName)}
        className={`flex items-center space-x-2 py-2 px-4 text-sm font-medium text-center rounded-t-lg transition-colors ${
            activeTab === tabName
            ? 'border-b-2 border-blue-500 text-blue-600'
            : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }`}
        >
        {icon}
        <span>{label}</span>
    </button>
  );
  
  return (
    <div className="p-4 bg-gray-50 h-full flex flex-col">
      <div className="flex-shrink-0">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Admin Panel</h2>
        <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                <TabButton label="Order Dashboard" tabName="dashboard" icon={<ClipboardListIcon className="w-5 h-5"/>} />
                <TabButton label="Menu Manager" tabName="menu" icon={<MenuIcon className="w-5 h-5"/>} />
                <TabButton label="Add Order" tabName="addOrder" icon={<PlusCircleIcon className="w-5 h-5"/>} />
            </nav>
        </div>
      </div>
      
      <div className="flex-grow overflow-y-auto pt-4">
        {activeTab === 'dashboard' && <Dashboard orders={orders} onUpdate={onUpdate} />}
        {activeTab === 'menu' && <MenuManager menuItems={menuItems} addMenuItem={addMenuItem} />}
        {activeTab === 'addOrder' && <AddOrderForm menuItems={menuItems} addOrder={addOrder} setActiveTab={setActiveTab} />}
      </div>
    </div>
  );
};

export default AdminView;