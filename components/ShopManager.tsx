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
                                onClick={() => addToCart(item