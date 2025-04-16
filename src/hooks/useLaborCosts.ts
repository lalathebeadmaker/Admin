import { useState, useEffect } from 'react';
import { LaborCost } from '../types';
import { laborCostsService } from '../services/laborCosts';

export function useLaborCosts() {
  const [laborCosts, setLaborCosts] = useState<LaborCost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const fetchLaborCosts = async () => {
      try {
        const costs = await laborCostsService.getLaborCosts();
        setLaborCosts(costs);
      } catch (error) {
        console.error('Error fetching labor costs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLaborCosts();
  }, []);

  const addLaborCost = async (laborCost: Omit<LaborCost, 'id'>) => {
    setIsAdding(true);
    try {
      const id = await laborCostsService.addLaborCost(laborCost);
      const newLaborCost = {
        ...laborCost,
        id,
      };
      setLaborCosts([...laborCosts, newLaborCost]);
    } catch (error) {
      console.error('Error adding labor cost:', error);
      throw error;
    } finally {
      setIsAdding(false);
    }
  };

  const updateLaborCost = async (id: string, laborCost: Partial<LaborCost>) => {
    try {
      await laborCostsService.updateLaborCost(id, laborCost);
      setLaborCosts(laborCosts.map(cost => 
        cost.id === id ? { ...cost, ...laborCost } : cost
      ));
    } catch (error) {
      console.error('Error updating labor cost:', error);
      throw error;
    }
  };

  const deleteLaborCost = async (id: string) => {
    try {
      await laborCostsService.deleteLaborCost(id);
      setLaborCosts(laborCosts.filter(cost => cost.id !== id));
    } catch (error) {
      console.error('Error deleting labor cost:', error);
      throw error;
    }
  };

  const calculateTotalMonthlyLaborCost = () => {
    return laborCosts.reduce((total, cost) => total + cost.monthlySalary, 0);
  };

  const calculateTotalLaborDays = () => {
    return laborCosts.reduce((total, cost) => total + cost.daysWorked, 0);
  };

  const calculateDailyRate = () => {
    const totalMonthlyCost = calculateTotalMonthlyLaborCost();
    const totalDays = calculateTotalLaborDays();
    return totalDays > 0 ? totalMonthlyCost / totalDays : 0;
  };

  return {
    laborCosts,
    isLoading,
    isAdding,
    addLaborCost,
    updateLaborCost,
    deleteLaborCost,
    calculateTotalMonthlyLaborCost,
    calculateTotalLaborDays,
    calculateDailyRate,
  };
} 