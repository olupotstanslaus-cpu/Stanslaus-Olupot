import React, { useState } from 'react';
import { Order, OrderStatus, DeliveryAgent } from '../types';
import { DELIVERY_AGENTS } from '../constants';
import { CheckCircleIcon, ClockIcon, TruckIcon, ClipboardListIcon, ChevronDownIcon, XCircleIcon } from './Icons';

interface AdminViewProps {
  orders: Order[];
  updateOrderStatus: (orderId: number, status: OrderStatus, deliveryAgentId?: string) => void;
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

    const handleApprove = () => {
        onUpdateStatus(order.id, OrderStatus.APPROVED);
    };

    const handleAssign = () => {
        if(selectedAgent){
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


const AdminView: React.FC<AdminViewProps> = ({ orders, updateOrderStatus }) => {
  const onUpdate = (orderId: number, status: OrderStatus, agent?: DeliveryAgent) => {
    updateOrderStatus(orderId, status, agent?.id);
  }

  const pendingOrders = orders.filter(o => o.status === OrderStatus.PENDING);
  const approvedOrders = orders.filter(o => o.status === OrderStatus.APPROVED);
  const inDeliveryOrders = orders.filter(o => o.status === OrderStatus.OUT_FOR_DELIVERY);
  const completedOrders = orders.filter(o => o.status === OrderStatus.DELIVERED || o.status === OrderStatus.CANCELLED);
  
  return (
    <div className="p-4 bg-gray-50 h-full overflow-y-auto">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 border-b pb-2">Admin Dashboard</h2>
      
      {orders.length === 0 ? (
        <div className="text-center py-16">
            <ClipboardListIcon className="w-16 h-16 mx-auto text-gray-300" />
            <p className="mt-4 text-gray-500">No orders have been placed yet.</p>
        </div>
      ) : (
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
      )}
    </div>
  );
};

export default AdminView;
