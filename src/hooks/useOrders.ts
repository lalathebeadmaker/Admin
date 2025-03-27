import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersService } from '../services/orders';
import { Order, OrderStatus } from '../types';

export function useOrders() {
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: ordersService.getOrders,
  });

  const addOrderMutation = useMutation({
    mutationFn: (order: Omit<Order, 'id'>) => ordersService.addOrder(order),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      ordersService.updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  return {
    orders,
    isLoading,
    addOrder: addOrderMutation.mutate,
    updateOrderStatus: updateOrderStatusMutation.mutate,
    isAdding: addOrderMutation.isPending,
    isUpdating: updateOrderStatusMutation.isPending,
  };
} 