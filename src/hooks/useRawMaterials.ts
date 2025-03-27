import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rawMaterialsService } from '../services/rawMaterials';
import { RawMaterial, RawMaterialPurchase } from '../types';

export function useRawMaterials() {
  const queryClient = useQueryClient();

  const { data: materials = [], isLoading: isLoadingMaterials } = useQuery({
    queryKey: ['rawMaterials'],
    queryFn: rawMaterialsService.getRawMaterials,
  });

  const { data: purchases = [], isLoading: isLoadingPurchases } = useQuery({
    queryKey: ['rawMaterialPurchases'],
    queryFn: rawMaterialsService.getRawMaterialPurchases,
  });

  const addPurchaseMutation = useMutation({
    mutationFn: (purchase: Omit<RawMaterialPurchase, 'id'>) =>
      rawMaterialsService.addRawMaterialPurchase(purchase),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rawMaterialPurchases'] });
      queryClient.invalidateQueries({ queryKey: ['rawMaterials'] });
    },
  });

  const addMaterialMutation = useMutation({
    mutationFn: (material: Omit<RawMaterial, 'id'>) =>
      rawMaterialsService.addRawMaterial(material),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rawMaterials'] });
    },
  });

  return {
    materials,
    purchases,
    isLoading: isLoadingMaterials || isLoadingPurchases,
    addPurchase: addPurchaseMutation.mutate,
    addMaterial: addMaterialMutation.mutate,
    isAddingPurchase: addPurchaseMutation.isPending,
    isAddingMaterial: addMaterialMutation.isPending,
  };
} 