import React from 'react';
import { Order, OrderStatus } from '../types';
import { DollarSignIcon, ClipboardListIcon } from './Icons';

interface SalesViewProps {
  orders: Order[];
}

const SalesView: React.FC<SalesViewProps> = ({ orders }) => {
  const deliveredOrders = orders.filter(o => o.status === OrderStatus.DELIVERED);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaysDeliveredOrders = deliveredOrders.filter(o => new Date(o.timestamp) >= today);
  
  const todaysRevenue = todaysDeliveredOrders.reduce((sum, order) => sum + order.price, 0);
  const totalRevenue = deliveredOrders.reduce((sum, order) => sum + order.price, 0);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h3 className="text-lg font-semibold text-gray-500 mb-2">Today's Sales</h3>
          <p className="text-4xl font-bold text-green-600">{formatCurrency(todaysRevenue)}</p>
          <p className="text-gray-500 mt-1">{todaysDeliveredOrders.length} delivered orders today</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h3 className="text-lg font-semibold text-gray-500 mb-2">Total Revenue</h3>
          <p className="text-4xl font-bold text-gray-800">{formatCurrency(totalRevenue)}</p>
          <p className="text-gray-500 mt-1">{deliveredOrders.length} total delivered orders</p>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-gray-700 mb-3">Delivered Orders History</h3>
        <div className="bg-white rounded-lg shadow-md border overflow-hidden">
          {deliveredOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {deliveredOrders.slice().reverse().map(order => (
                    <tr key={order.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{order.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.customerName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.item}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(order.timestamp).toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-700">{formatCurrency(order.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <ClipboardListIcon className="w-12 h-12 mx-auto text-gray-300" />
              <p className="mt-4 text-gray-500">No orders have been delivered yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesView;
