import React, { useState, useMemo } from 'react';
import { MenuItem, Order, PaymentMethod, CartSaleItem } from '../types';
import { TrashIcon, DollarSignIcon, ClipboardListIcon, MenuIcon } from './Icons';

interface ShopManagerProps {
    menuItems: MenuItem[];
    orders: Order[];
    addStoreSale: (cartItems: CartSaleItem[], paymentMethod: PaymentMethod, total: number) => void;
}

const TAX_RATE = 0.05; // 5% tax

const ShopManager: React.FC<ShopManagerProps> = ({ menuItems, orders, addStoreSale }) => {
    const [cart, setCart] = useState<CartSaleItem[]>([]);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);

    const addToCart = (item: MenuItem) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(cartItem => cartItem.id === item.id);
            if (existingItem) {
                return prevCart.map(cartItem =>
                    cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem
                );
            }
            return [...prevCart, { ...item, quantity: 1 }];
        });
    };

    const updateQuantity = (itemId: number, newQuantity: number) => {
        setCart(prevCart => {
            if (newQuantity <= 0) {
                return prevCart.filter(item => item.id !== itemId);
            }
            return prevCart.map(item =>
                item.id === itemId ? { ...item, quantity: newQuantity } : item
            );
        });
    };

    const removeFromCart = (itemId: number) => {
        setCart(prevCart => prevCart.filter(item => item.id !== itemId));
    };

    const { subtotal, tax, total } = useMemo(() => {
        const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const tax = subtotal * TAX_RATE;
        const total = subtotal + tax;
        return { subtotal, tax, total };
    }, [cart]);

    const handleCompleteSale = () => {
        if (cart.length === 0) {
            alert("Cart is empty.");
            return;
        }
        addStoreSale(cart, paymentMethod, total);
        setCart([]);
        alert("Sale completed successfully!");
    };
    
    // Daily Stats Calculation
    const dailyStats = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        const storeSalesToday = orders.filter(o =>
            (o.paymentMethod === PaymentMethod.CASH || o.paymentMethod === PaymentMethod.CARD) &&
            o.timestamp.startsWith(today)
        );

        const revenue = storeSalesToday.reduce((sum, order) => sum + order.price, 0);
        const transactions = storeSalesToday.length;
        
        return { revenue, transactions };
    }, [orders]);


    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {/* Left side: Menu Items */}
            <div className="lg:col-span-2 space-y-4">
                <div className="bg-white p-4 rounded-lg shadow-md border">
                    <h3 className="text-xl font-semibold text-gray-700 flex items-center mb-4"><MenuIcon className="mr-2"/> Menu</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {menuItems.map(item => (
                            <button
                                key={item.id}
                                onClick={() => addToCart(item)}
                                className="p-3 bg-gray-50 border rounded-lg text-left hover:bg-blue-100 hover:border-blue-500 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <p className="font-semibold text-gray-800">{item.name}</p>
                                <p className="text-sm text-gray-600">${item.price.toFixed(2)}</p>
                            </button>
                        ))}
                    </div>
                </div>
                 <div className="bg-white p-4 rounded-lg shadow-md border">
                    <h3 className="text-xl font-semibold text-gray-700 mb-3">Today's Shop Performance</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-green-50 p-4 rounded-lg">
                            <p className="text-sm text-green-700 font-medium">Today's Revenue</p>
                            <p className="text-2xl font-bold text-green-900">${dailyStats.revenue.toFixed(2)}</p>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <p className="text-sm text-blue-700 font-medium">Today's Transactions</p>
                            <p className="text-2xl font-bold text-blue-900">{dailyStats.transactions}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right side: Cart */}
            <div className="bg-white p-4 rounded-lg shadow-md border flex flex-col">
                <h3 className="text-xl font-semibold text-gray-700 mb-4 flex items-center"><ClipboardListIcon className="mr-2"/> Current Sale</h3>
                {cart.length === 0 ? (
                    <div className="flex-grow flex items-center justify-center text-center text-gray-500">
                        <p>Click on menu items to start a sale.</p>
                    </div>
                ) : (
                    <div className="flex-grow overflow-y-auto pr-2">
                        {cart.map(item => (
                            <div key={item.id} className="flex items-center justify-between mb-3 p-2 bg-gray-50 rounded-md">
                                <div>
                                    <p className="font-semibold">{item.name}</p>
                                    <p className="text-sm text-gray-500">${item.price.toFixed(2)}</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                                        className="w-16 text-center bg-white border rounded-md"
                                        min="1"
                                    />
                                    <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-700 p-1">
                                        <TrashIcon className="w-5 h-5"/>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-4 border-t pt-4 space-y-2 text-gray-700">
                    <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span className="font-medium">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Tax ({ (TAX_RATE * 100).toFixed(0) }%):</span>
                        <span className="font-medium">${tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold">
                        <span>Total:</span>
                        <span>${total.toFixed(2)}</span>
                    </div>

                    <div className="pt-4 space-y-2">
                         <label className="text-sm font-medium text-gray-900">Payment Method</label>
                         <div className="grid grid-cols-2 gap-2">
                             <button onClick={() => setPaymentMethod(PaymentMethod.CASH)} className={`p-2 rounded-md border-2 font-semibold ${paymentMethod === PaymentMethod.CASH ? 'bg-blue-500 text-white border-blue-500' : 'bg-gray-100 border-gray-200'}`}>Cash</button>
                             <button onClick={() => setPaymentMethod(PaymentMethod.CARD)} className={`p-2 rounded-md border-2 font-semibold ${paymentMethod === PaymentMethod.CARD ? 'bg-blue-500 text-white border-blue-500' : 'bg-gray-100 border-gray-200'}`}>Card</button>
                         </div>
                    </div>

                    <div className="pt-2">
                        <button 
                            onClick={handleCompleteSale}
                            disabled={cart.length === 0}
                            className="w-full bg-green-500 text-white p-3 rounded-md font-semibold hover:bg-green-600 transition-colors flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed">
                            <DollarSignIcon className="w-5 h-5 mr-2" /> Complete Sale
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShopManager;
