import { useState, useEffect } from 'react';
import { Order } from '../types';
import { ordersService } from '../services/orders';
import { useProducts } from './useProducts';
import { useLaborCosts } from './useLaborCosts';

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const { products } = useProducts();
  const { calculateDailyRate } = useLaborCosts();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const fetchedOrders = await ordersService.getOrders();
        setOrders(fetchedOrders);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const calculateExpectedDeliveryDate = (items: Order['items']) => {
    const maxDaysToMake = Math.max(...items.map(item => {
      const product = products.find(p => p.id === item.productId);
      return product ? product.timeToMake : 0;
    }));
    const date = new Date();
    date.setDate(date.getDate() + maxDaysToMake);
    return date;
  };

  const calculateRealisticDeliveryDate = (items: Order['items']) => {
    // const pendingOrders = orders.filter(order => 
    //   order.status === OrderStatus.PENDING || order.status === OrderStatus.PROCESSING
    // );
    
    const totalDaysNeeded = items.reduce((total, item) => {
      const product = products.find(p => p.id === item.productId);
      return total + (product ? product.timeToMake : 0);
    }, 0);

    const dailyRate = calculateDailyRate();
    const availableLaborDays = dailyRate > 0 ? 30 / dailyRate : 0;
    const daysToAdd = Math.ceil(totalDaysNeeded / availableLaborDays);

    const date = new Date();
    date.setDate(date.getDate() + daysToAdd);
    return date;
  };

  const addOrder = async (order: Omit<Order, 'id' | 'expectedDeliveryDate' | 'realisticDeliveryDate'>) => {
    setIsAdding(true);
    try {
      const expectedDeliveryDate = calculateExpectedDeliveryDate(order.items);
      const realisticDeliveryDate = calculateRealisticDeliveryDate(order.items);

      const orderWithDates = {
        ...order,
        expectedDeliveryDate,
        realisticDeliveryDate,
      };

      const id = await ordersService.addOrder(orderWithDates);
      setOrders([...orders, { ...orderWithDates, id }]);
    } catch (error) {
      console.error('Error adding order:', error);
      throw error;
    } finally {
      setIsAdding(false);
    }
  };

  const updateOrder = async (id: string, order: Partial<Order>) => {
    try {
      await ordersService.updateOrder(id, order);
      setOrders(orders.map(o => o.id === id ? { ...o, ...order } : o));
    } catch (error) {
      console.error('Error updating order:', error);
      throw error;
    }
  };

  const getDateStatus = (date: Date) => {
    const today = new Date();
    const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return {
        status: 'overdue',
        days: Math.abs(diffDays),
        color: 'red'
      };
    } else if (diffDays <= 3) {
      return {
        status: 'approaching',
        days: diffDays,
        color: 'orange'
      };
    } else {
      return {
        status: 'on-track',
        days: diffDays,
        color: 'green'
      };
    }
  };

  return {
    orders,
    isLoading,
    isAdding,
    addOrder,
    updateOrder,
    getDateStatus
  };
} 