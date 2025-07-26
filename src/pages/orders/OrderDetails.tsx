import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ordersService } from '../../services/orders';
import { useProducts } from '../../hooks/useProducts';
import { useRawMaterials } from '../../hooks/useRawMaterials';
import { useLaborCosts } from '../../hooks/useLaborCosts';
import { Order, OrderStatus, Currency, ExtraExpense, AdditionalPayment, CurrencyRate, OrderItem, ProductMaterial } from '../../types';

export default function OrderDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products, isLoading: productsLoading } = useProducts();
  const { materials } = useRawMaterials();
  const { calculateDailyRate } = useLaborCosts();
  const [order, setOrder] = useState<Order | null>(null);
  
  // Currency conversion rates (you can update these or fetch from an API)
  const currencyRates: CurrencyRate[] = [
    { currency: Currency.NGN, rateToNGN: 1, lastUpdated: new Date() },
    { currency: Currency.USD, rateToNGN: 1500, lastUpdated: new Date() },
    { currency: Currency.GBP, rateToNGN: 1900, lastUpdated: new Date() },
    { currency: Currency.EUR, rateToNGN: 1650, lastUpdated: new Date() },
    { currency: Currency.CAD, rateToNGN: 1100, lastUpdated: new Date() }
  ];

  // Currency conversion function
  const convertToNGN = (amount: number, fromCurrency: Currency): number => {
    const rate = currencyRates.find(r => r.currency === fromCurrency);
    return rate ? amount * rate.rateToNGN : amount;
  };

  // Calculate material cost for product materials
  const calculateMaterialCost = (productMaterials: ProductMaterial[]) => {
    return productMaterials.reduce((total, material) => {
      const rawMaterial = materials.find(rm => rm.id === material.materialId);
      if (rawMaterial) {
        return total + (rawMaterial.lastPurchasePrice * material.quantity);
      }
      return total;
    }, 0);
  };

  // Calculate labor cost
  const calculateLaborCost = (timeToMake: number) => {
    const dailyRate = calculateDailyRate();
    return dailyRate * timeToMake;
  };

  // Calculate total cost using the same formula as ProductDetails
  const calculateTotalCost = (materials: ProductMaterial[], timeToMake: number) => {
    const materialCost = calculateMaterialCost(materials);
    const laborCost = calculateLaborCost(timeToMake);
    return {
      materialCost,
      laborCost,
      totalCost: materialCost + laborCost,
    };
  };

  // Calculate product cost in NGN
  const calculateProductCost = (items: OrderItem[]): { cost: number; hasInvalidProducts: boolean } => {
    let totalCost = 0;
    let hasInvalidProducts = false;

    // If products are still loading, assume there are invalid products
    if (productsLoading || products.length === 0) {
      console.log('Products still loading or empty, assuming invalid products');
      return { cost: 0, hasInvalidProducts: true };
    }

    // Debug: Log products and items
    console.log('calculateProductCost - products:', products);
    console.log('calculateProductCost - items:', items);

    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      console.log(`Looking for product ID: ${item.productId}, found:`, product);
      if (!product) {
        console.log(`Product not found for ID: ${item.productId}`);
        hasInvalidProducts = true;
        continue;
      }

      // Use the same formula as ProductDetails page
      const { totalCost: productCost } = calculateTotalCost(product.materials, product.timeToMake);

      // Calculate additional material costs
      const additionalMaterialCost = item.additionalMaterials?.reduce((total: number, material: any) => {
        const rawMaterial = materials.find(m => m.id === material.materialId);
        if (!rawMaterial) return total;
        return total + (material.quantity * rawMaterial.lastPurchasePrice);
      }, 0) || 0;

      // Calculate additional costs
      const additionalCosts = item.additionalCosts?.reduce((total: number, cost: any) => total + cost.amount, 0) || 0;

      const itemCost = (productCost + additionalMaterialCost + additionalCosts) * item.quantity;
      totalCost += itemCost;
    }

    return { cost: totalCost, hasInvalidProducts };
  };

  // Calculate all financial data dynamically
  const calculateFinancialData = (order: Order) => {
    // Calculate product costs
    const { cost: productCostInNGN, hasInvalidProducts } = calculateProductCost(order.items);
    
    // Calculate shipping cost in NGN (actual cost is already in NGN)
    const shippingCostInNGN = order.shipping.shippingInfo.actualCost || 0;
    
    // Calculate total extra expenses in NGN
    const totalExtraExpensesInNGN = order.extraExpenses?.reduce((total, expense) => {
      return total + convertToNGN(expense.amount, order.currency);
    }, 0) || 0;
    
    // Calculate total additional payments in NGN
    const totalAdditionalPaymentsInNGN = order.additionalPayments?.reduce((total, payment) => {
      return total + convertToNGN(payment.amount, order.currency);
    }, 0) || 0;
    
    // Calculate total order amount in NGN
    const totalAmountInNGN = convertToNGN(order.totalAmount, order.currency);
    
    // Calculate profit margin
    const profitMargin = totalAmountInNGN - productCostInNGN - shippingCostInNGN - totalExtraExpensesInNGN + totalAdditionalPaymentsInNGN;
    
    return {
      productCostInNGN,
      shippingCostInNGN,
      totalExtraExpensesInNGN,
      totalAdditionalPaymentsInNGN,
      totalAmountInNGN,
      profitMargin,
      hasInvalidProducts
    };
  };

  // Migrate old order structure to new structure
  const migrateOrderStructure = (order: any): Order => {
    // Check if this is an old order structure (has shippingInfo directly on order)
    if (order.shippingInfo && !order.shipping) {
      return {
        ...order,
        shipping: {
          shippingAddress: order.shippingAddress || {
            street: '',
            city: '',
            state: '',
            country: '',
            postalCode: ''
          },
          shippingInfo: order.shippingInfo,
          status: 'pending'
        }
      } as Order;
    }
    
    // If it's already the new structure, return as is
    return order as Order;
  };
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    expectedDeliveryDate: '',
    realisticDeliveryDate: '',
    notes: '',
    socialMedia: [] as { platform: string; handle: string; url: string; }[]
  });
  const [currentSocialMedia, setCurrentSocialMedia] = useState({
    platform: '',
    handle: '',
    url: ''
  });

  const [currentExtraExpense, setCurrentExtraExpense] = useState({
    description: '',
    amount: 0,
    category: 'other' as 'shipping' | 'materials' | 'labor' | 'other',
    notes: ''
  });

  const [currentAdditionalPayment, setCurrentAdditionalPayment] = useState({
    description: '',
    amount: 0,
    type: 'other' as 'shipping' | 'product' | 'other',
    notes: ''
  });

  const [shippingFormData, setShippingFormData] = useState({
    shippingCompany: '',
    estimatedDeliveryDate: '',
    actualDeliveryDate: '',
    actualShippingCost: ''
  });

  const [addressFormData, setAddressFormData] = useState({
    street: '',
    city: '',
    state: '',
    country: '',
    postalCode: ''
  });

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) return;
      try {
        const fetchedOrder = await ordersService.getOrder(id);
        if (fetchedOrder) {
          // Migrate old order structure to new structure if needed
          const migratedOrder = migrateOrderStructure(fetchedOrder);
          
          // Calculate all financial data
          const financialData = calculateFinancialData(migratedOrder);

          const updatedOrder = {
            ...migratedOrder,
            ...financialData
          };

          setOrder(updatedOrder);
          setFormData({
            expectedDeliveryDate: '',
            realisticDeliveryDate: '',
            notes: migratedOrder.notes || '',
            socialMedia: migratedOrder.socialMedia || []
          });
        }
      } catch (error) {
        console.error('Error fetching order:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  // Update form data when order changes
  useEffect(() => {
    if (order) {
      // Helper function to safely convert date to YYYY-MM-DD format
      const formatDateForInput = (date: any): string => {
        if (!date) return '';
        try {
          let dateObj: Date;
          
          if (date instanceof Date) {
            dateObj = date;
          } else if (typeof date === 'string') {
            // Handle different date string formats
            if (date.includes('T')) {
              // ISO format like "2024-01-15T10:30:00"
              dateObj = new Date(date);
            } else if (date.includes('-')) {
              // Date-only format like "2024-01-15"
              dateObj = new Date(date + 'T00:00:00');
            } else {
              // Try parsing as timestamp
              dateObj = new Date(parseInt(date));
            }
          } else if (typeof date === 'number') {
            // Timestamp
            dateObj = new Date(date);
          } else {
            // Try generic parsing
            dateObj = new Date(date);
          }
          
          if (isNaN(dateObj.getTime())) {
            console.warn('Invalid date:', date);
            return '';
          }
          
          return dateObj.toISOString().split('T')[0];
        } catch (error) {
          console.error('Error formatting date:', date, error);
          return '';
        }
      };

      console.log('Order shipping dates:', {
        estimatedDeliveryDate: order.shipping.shippingInfo.estimatedDeliveryDate,
        actualDeliveryDate: order.shipping.shippingInfo.actualDeliveryDate,
        estimatedType: typeof order.shipping.shippingInfo.estimatedDeliveryDate,
        actualType: typeof order.shipping.shippingInfo.actualDeliveryDate
      });

      setShippingFormData({
        shippingCompany: order.shipping.shippingInfo.shippingCompany || '',
        estimatedDeliveryDate: formatDateForInput(order.shipping.shippingInfo.estimatedDeliveryDate),
        actualDeliveryDate: formatDateForInput(order.shipping.shippingInfo.actualDeliveryDate),
        actualShippingCost: order.shipping.shippingInfo.actualCost?.toString() || ''
      });

      setAddressFormData({
        street: order.shipping.shippingAddress.street || '',
        city: order.shipping.shippingAddress.city || '',
        state: order.shipping.shippingAddress.state || '',
        country: order.shipping.shippingAddress.country || '',
        postalCode: order.shipping.shippingAddress.postalCode || ''
      });
    }
  }, [order]);

  const handleAddSocialMedia = () => {
    if (currentSocialMedia.platform && currentSocialMedia.handle && currentSocialMedia.url) {
      setFormData(prev => ({
        ...prev,
        socialMedia: [...prev.socialMedia, currentSocialMedia]
      }));
      setCurrentSocialMedia({
        platform: '',
        handle: '',
        url: ''
      });
    }
  };

  const handleRemoveSocialMedia = (index: number) => {
    setFormData(prev => ({
      ...prev,
      socialMedia: prev.socialMedia.filter((_, i) => i !== index)
    }));
  };

  const handleAddExtraExpense = () => {
    if (!currentExtraExpense.description || currentExtraExpense.amount <= 0) {
      alert('Please fill in description and amount for the extra expense');
      return;
    }

    const newExpense: ExtraExpense = {
      id: Date.now().toString(),
      description: currentExtraExpense.description,
      amount: currentExtraExpense.amount,
      date: new Date(),
      category: currentExtraExpense.category,
      notes: currentExtraExpense.notes || undefined
    };

    setOrder(prev => prev ? {
      ...prev,
      extraExpenses: [...(prev.extraExpenses || []), newExpense],
      totalExtraExpenses: (prev.totalExtraExpenses || 0) + currentExtraExpense.amount
    } : null);

    setCurrentExtraExpense({
      description: '',
      amount: 0,
      category: 'other',
      notes: ''
    });
  };

  const handleRemoveExtraExpense = (expenseId: string) => {
    if (!order) return;
    
    const expense = order.extraExpenses?.find(e => e.id === expenseId);
    if (!expense) return;

    setOrder(prev => prev ? {
      ...prev,
      extraExpenses: prev.extraExpenses?.filter(e => e.id !== expenseId) || [],
      totalExtraExpenses: (prev.totalExtraExpenses || 0) - expense.amount
    } : null);
  };

  const handleAddAdditionalPayment = () => {
    if (!currentAdditionalPayment.description || currentAdditionalPayment.amount <= 0) {
      alert('Please fill in description and amount for the additional payment');
      return;
    }

    const newPayment: AdditionalPayment = {
      id: Date.now().toString(),
      description: currentAdditionalPayment.description,
      amount: currentAdditionalPayment.amount,
      date: new Date(),
      type: currentAdditionalPayment.type,
      notes: currentAdditionalPayment.notes || undefined
    };

    setOrder(prev => prev ? {
      ...prev,
      additionalPayments: [...(prev.additionalPayments || []), newPayment],
      totalAdditionalPayments: (prev.totalAdditionalPayments || 0) + currentAdditionalPayment.amount
    } : null);

    setCurrentAdditionalPayment({
      description: '',
      amount: 0,
      type: 'other',
      notes: ''
    });
  };

  const handleRemoveAdditionalPayment = (paymentId: string) => {
    if (!order) return;
    
    const payment = order.additionalPayments?.find(p => p.id === paymentId);
    if (!payment) return;

    setOrder(prev => prev ? {
      ...prev,
      additionalPayments: prev.additionalPayments?.filter(p => p.id !== paymentId) || [],
      totalAdditionalPayments: (prev.totalAdditionalPayments || 0) - payment.amount
    } : null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || !id) return;

    setIsUpdating(true);
    try {
      // Calculate all financial data dynamically
      const financialData = calculateFinancialData(order);

      // Helper function to remove undefined values from objects
      const removeUndefined = (obj: any): any => {
        const cleaned: any = {};
        Object.keys(obj).forEach(key => {
          if (obj[key] !== undefined) {
            cleaned[key] = obj[key];
          }
        });
        return cleaned;
      };

      const updateData = removeUndefined({
        notes: formData.notes || undefined,
        socialMedia: formData.socialMedia.length > 0 ? formData.socialMedia : undefined,
        extraExpenses: order.extraExpenses || undefined,
        additionalPayments: order.additionalPayments || undefined,
        ...financialData
      });

      await ordersService.updateOrder(id, updateData);
      setOrder(prev => prev ? { ...prev, ...updateData } : null);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Failed to update order. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    if (!order || !id) return;

    try {
      await ordersService.updateOrderStatus(id, newStatus);
      setOrder(prev => prev ? { ...prev, status: newStatus } : null);
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status. Please try again.');
    }
  };

  const handleShippingUpdate = async () => {
    if (!order || !id) return;

    try {
      // Helper function to remove undefined values from objects
      const removeUndefined = (obj: any): any => {
        const cleaned: any = {};
        Object.keys(obj).forEach(key => {
          if (obj[key] !== undefined) {
            cleaned[key] = obj[key];
          }
        });
        return cleaned;
      };

      // Build shipping info object, only including fields with values
      const shippingInfo: any = {
        ...order.shipping.shippingInfo
      };

      if (shippingFormData.shippingCompany) {
        shippingInfo.shippingCompany = shippingFormData.shippingCompany;
      }
      
      if (shippingFormData.estimatedDeliveryDate) {
        shippingInfo.estimatedDeliveryDate = new Date(shippingFormData.estimatedDeliveryDate);
      }
      
      if (shippingFormData.actualDeliveryDate) {
        shippingInfo.actualDeliveryDate = new Date(shippingFormData.actualDeliveryDate);
      }
      
      if (shippingFormData.actualShippingCost) {
        shippingInfo.actualCost = parseFloat(shippingFormData.actualShippingCost);
      }

      const shippingUpdateData = {
        shipping: {
          ...order.shipping,
          shippingAddress: {
            street: addressFormData.street,
            city: addressFormData.city,
            state: addressFormData.state,
            country: addressFormData.country,
            postalCode: addressFormData.postalCode
          },
          shippingInfo: removeUndefined(shippingInfo)
        }
      };

      await ordersService.updateOrder(id, shippingUpdateData);
      setOrder(prev => prev ? {
        ...prev,
        shipping: {
          ...prev.shipping,
          ...shippingUpdateData.shipping
        }
      } : null);
      
      alert('Shipping information updated successfully!');
    } catch (error) {
      console.error('Error updating shipping information:', error);
      alert('Failed to update shipping information. Please try again.');
    }
  };

  const handleProductLink = async (itemIndex: number, newProductId: string) => {
    if (!order || !id) return;

    try {
      const updatedItems = [...order.items];
      updatedItems[itemIndex] = {
        ...updatedItems[itemIndex],
        productId: newProductId
      };

      // Recalculate costs and profit margin
      // Create updated order with new items
      const updatedOrder = { ...order, items: updatedItems };
      
      // Calculate all financial data dynamically
      const financialData = calculateFinancialData(updatedOrder);

      const updateData = {
        items: updatedItems,
        ...financialData
      };

      await ordersService.updateOrder(id, updateData);
      setOrder(prev => prev ? {
        ...prev,
        ...updateData
      } : null);
      
      // Show feedback based on whether invalid products were resolved
      if (!financialData.hasInvalidProducts && order.hasInvalidProducts) {
        alert('Product linked successfully! All products are now valid and profit margin calculations are enabled.');
      } else if (financialData.hasInvalidProducts) {
        alert('Product linked successfully! Some products still need to be linked to enable profit margin calculations.');
      } else {
        alert('Product linked successfully!');
      }
    } catch (error) {
      console.error('Error linking product:', error);
      alert('Failed to link product. Please try again.');
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!order) {
    return <div>Order not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Order Details</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/orders')}
            className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            Back to Orders
          </button>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="rounded-md bg-[#6A7861] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#5a6852]"
          >
            {isEditing ? 'Cancel Edit' : 'Edit Order'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Information */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Order Information</h3>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Order ID</dt>
                <dd className="mt-1 text-sm text-gray-900">{order.id}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusUpdate(e.target.value as OrderStatus)}
                    className="rounded-md border-gray-300 shadow-sm focus:border-[#6A7861] focus:ring-[#6A7861] sm:text-sm"
                  >
                    {Object.values(OrderStatus).map(status => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Order Date</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(order.orderDate).toLocaleDateString()}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Total Amount</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {order.currency} {order.totalAmount.toFixed(2)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Date Completed</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {order.dateCompleted ? new Date(order.dateCompleted).toLocaleDateString() : 'Not completed'}
                </dd>
              </div>
            </dl>
                  </div>
      </div>

      {/* Delivery Information */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Delivery Information</h3>
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Expected Delivery Date</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {order.shipping.shippingInfo.estimatedDeliveryDate 
                  ? (() => {
                      const expectedDate = order.shipping.shippingInfo.estimatedDeliveryDate instanceof Date 
                        ? order.shipping.shippingInfo.estimatedDeliveryDate
                        : new Date(order.shipping.shippingInfo.estimatedDeliveryDate);
                      const today = new Date();
                      const diffTime = expectedDate.getTime() - today.getTime();
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      
                      let statusColor = 'text-green-600';
                      let statusText = '';
                      
                      if (order.status === 'completed' || order.status === 'delivered') {
                        statusText = 'Order completed';
                        statusColor = 'text-gray-600';
                      } else if (order.status === 'shipped') {
                        statusText = 'Order shipped';
                        statusColor = 'text-blue-600';
                      } else if (diffDays < 0) {
                        statusText = `${Math.abs(diffDays)} days overdue`;
                        statusColor = 'text-red-600';
                      } else if (diffDays <= 3) {
                        statusText = `${diffDays} days left`;
                        statusColor = 'text-yellow-600';
                      } else {
                        statusText = `${diffDays} days left`;
                        statusColor = 'text-green-600';
                      }
                      
                      return (
                        <div>
                          <div>{expectedDate.toLocaleDateString()}</div>
                          <div className={`font-medium ${statusColor}`}>{statusText}</div>
                        </div>
                      );
                    })()
                  : 'Not set'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Actual Delivery Date</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {order.shipping.shippingInfo.actualDeliveryDate 
                  ? (() => {
                      const actualDate = order.shipping.shippingInfo.actualDeliveryDate instanceof Date 
                        ? order.shipping.shippingInfo.actualDeliveryDate
                        : new Date(order.shipping.shippingInfo.actualDeliveryDate);
                      const expectedDate = order.shipping.shippingInfo.estimatedDeliveryDate 
                        ? (order.shipping.shippingInfo.estimatedDeliveryDate instanceof Date 
                            ? order.shipping.shippingInfo.estimatedDeliveryDate
                            : new Date(order.shipping.shippingInfo.estimatedDeliveryDate))
                        : null;
                      
                      if (expectedDate) {
                        const diffTime = actualDate.getTime() - expectedDate.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        
                        let statusColor = 'text-green-600';
                        let statusText = 'On time';
                        
                        if (diffDays > 0) {
                          statusText = `${diffDays} days late`;
                          statusColor = 'text-red-600';
                        } else if (diffDays < 0) {
                          statusText = `${Math.abs(diffDays)} days early`;
                          statusColor = 'text-green-600';
                        }
                        
                        return (
                          <div>
                            <div>{actualDate.toLocaleDateString()}</div>
                            <div className={`font-medium ${statusColor}`}>{statusText}</div>
                          </div>
                        );
                      }
                      
                      return actualDate.toLocaleDateString();
                    })()
                  : 'Not delivered'}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Customer Information */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Customer Information</h3>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Name</dt>
                <dd className="mt-1 text-sm text-gray-900">{order.customerName}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">{order.customerEmail}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Phone</dt>
                <dd className="mt-1 text-sm text-gray-900">{order.customerPhone}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Notes and Social Media */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Notes & Social Media</h3>
            <div className="space-y-4">
              {order.notes && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-2">Notes</dt>
                  <dd className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                    {order.notes}
                  </dd>
                </div>
              )}
              {order.socialMedia && order.socialMedia.length > 0 && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-2">Social Media</dt>
                  <dd className="space-y-2">
                    {order.socialMedia.map((sm, index) => (
                      <div key={index} className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                        <div className="font-medium">{sm.platform}</div>
                        <div>Handle: {sm.handle}</div>
                        <div>URL: <a href={sm.url} target="_blank" rel="noopener noreferrer" className="text-[#6A7861] hover:underline">{sm.url}</a></div>
                      </div>
                    ))}
                  </dd>
                </div>
              )}
              {!order.notes && (!order.socialMedia || order.socialMedia.length === 0) && (
                <div className="text-sm text-gray-500 italic">No notes or social media information available.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Editable Fields */}
      {isEditing && (
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Update Order Details</h3>
            <form onSubmit={handleSubmit} className="space-y-6">

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    notes: e.target.value
                  }))}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6A7861] focus:ring-[#6A7861] sm:text-sm"
                  placeholder="Add any notes about this order..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Social Media
                </label>
                <div className="mt-1 space-y-2">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Platform (e.g., Instagram)"
                      value={currentSocialMedia.platform}
                      onChange={(e) => setCurrentSocialMedia({ ...currentSocialMedia, platform: e.target.value })}
                      className="block w-1/3 rounded-md border-gray-300 shadow-sm focus:border-[#6A7861] focus:ring-[#6A7861] sm:text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Handle"
                      value={currentSocialMedia.handle}
                      onChange={(e) => setCurrentSocialMedia({ ...currentSocialMedia, handle: e.target.value })}
                      className="block w-1/3 rounded-md border-gray-300 shadow-sm focus:border-[#6A7861] focus:ring-[#6A7861] sm:text-sm"
                    />
                    <input
                      type="url"
                      placeholder="URL"
                      value={currentSocialMedia.url}
                      onChange={(e) => setCurrentSocialMedia({ ...currentSocialMedia, url: e.target.value })}
                      className="block w-1/3 rounded-md border-gray-300 shadow-sm focus:border-[#6A7861] focus:ring-[#6A7861] sm:text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleAddSocialMedia}
                      className="rounded-md bg-[#6A7861] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#5a6852]"
                    >
                      Add
                    </button>
                  </div>
                  {formData.socialMedia.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {formData.socialMedia.map((sm, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span>
                            {sm.platform}: {sm.handle}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSocialMedia(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="rounded-md bg-[#6A7861] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#5a6852] disabled:opacity-50"
                >
                  {isUpdating ? 'Updating...' : 'Update Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Items */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Order Items</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-300">
              <thead>
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">
                    Product
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Link Product
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Quantity
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Price
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, index) => {
                  const product = products.find(p => p.id === item.productId);
                  return (
                    <tr key={index}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                        <div>
                          <div className={!product ? 'text-red-600 font-medium' : ''}>
                            {product?.name || 'Unknown Product'}
                          </div>
                          {!product && (
                            <div className="text-xs text-red-500 mt-1">
                              Product ID: {item.productId}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <select
                          value={item.productId}
                          onChange={(e) => handleProductLink(index, e.target.value)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6A7861] focus:ring-[#6A7861] sm:text-sm"
                        >
                          <option value="">Select a product</option>
                          {products.map(product => (
                            <option key={product.id} value={product.id}>
                              {product.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {item.quantity}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {order.currency} {item.price.toFixed(2)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {order.currency} {(item.price * item.quantity).toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Shipping Information */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Shipping Information</h3>
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Street</dt>
              <dd className="mt-1 text-sm text-gray-900">{order.shipping.shippingAddress.street}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">City</dt>
              <dd className="mt-1 text-sm text-gray-900">{order.shipping.shippingAddress.city}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">State</dt>
              <dd className="mt-1 text-sm text-gray-900">{order.shipping.shippingAddress.state}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Country</dt>
              <dd className="mt-1 text-sm text-gray-900">{order.shipping.shippingAddress.country}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Postal Code</dt>
              <dd className="mt-1 text-sm text-gray-900">{order.shipping.shippingAddress.postalCode}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Shipping Cost Paid</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {order.currency} {order.shipping.shippingInfo.customerPaid.toFixed(2)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Shipping Company</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {order.shipping.shippingInfo.shippingCompany || 'Not specified'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Actual Shipping Cost (NGN)</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {order.shipping.shippingInfo.actualCost
                  ? '₦' + order.shipping.shippingInfo.actualCost.toFixed(2)
                  : 'Not set'}
              </dd>
            </div>
            
          </dl>
        </div>
      </div>

      {/* Shipping Management */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Update Shipping Information</h3>
          
          {/* Shipping Details */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Shipping Details</h4>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Shipping Company</label>
                <input
                  type="text"
                  value={shippingFormData.shippingCompany}
                  onChange={(e) => setShippingFormData(prev => ({ ...prev, shippingCompany: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6A7861] focus:ring-[#6A7861] sm:text-sm"
                  placeholder="e.g., DHL, FedEx"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Estimated Delivery Date</label>
                <input
                  type="date"
                  value={shippingFormData.estimatedDeliveryDate}
                  onChange={(e) => setShippingFormData(prev => ({ ...prev, estimatedDeliveryDate: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6A7861] focus:ring-[#6A7861] sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Actual Delivery Date</label>
                <input
                  type="date"
                  value={shippingFormData.actualDeliveryDate}
                  onChange={(e) => setShippingFormData(prev => ({ ...prev, actualDeliveryDate: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6A7861] focus:ring-[#6A7861] sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Actual Shipping Cost (NGN)</label>
                <input
                  type="number"
                  value={shippingFormData.actualShippingCost}
                  onChange={(e) => setShippingFormData(prev => ({ ...prev, actualShippingCost: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6A7861] focus:ring-[#6A7861] sm:text-sm"
                  placeholder="₦0.00"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Shipping Address</h4>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Street</label>
                <input
                  type="text"
                  value={addressFormData.street}
                  onChange={(e) => setAddressFormData(prev => ({ ...prev, street: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6A7861] focus:ring-[#6A7861] sm:text-sm"
                  placeholder="Street address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">City</label>
                <input
                  type="text"
                  value={addressFormData.city}
                  onChange={(e) => setAddressFormData(prev => ({ ...prev, city: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6A7861] focus:ring-[#6A7861] sm:text-sm"
                  placeholder="City"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">State</label>
                <input
                  type="text"
                  value={addressFormData.state}
                  onChange={(e) => setAddressFormData(prev => ({ ...prev, state: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6A7861] focus:ring-[#6A7861] sm:text-sm"
                  placeholder="State/Province"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Country</label>
                <input
                  type="text"
                  value={addressFormData.country}
                  onChange={(e) => setAddressFormData(prev => ({ ...prev, country: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6A7861] focus:ring-[#6A7861] sm:text-sm"
                  placeholder="Country"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Postal Code</label>
                <input
                  type="text"
                  value={addressFormData.postalCode}
                  onChange={(e) => setAddressFormData(prev => ({ ...prev, postalCode: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6A7861] focus:ring-[#6A7861] sm:text-sm"
                  placeholder="Postal code"
                />
              </div>
            </div>
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={handleShippingUpdate}
              className="rounded-md bg-[#6A7861] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#5a6852]"
            >
              Update Shipping Info
            </button>
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Financial Summary</h3>
          
          {productsLoading ? (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Loading Products
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      Loading product information to calculate costs and profit margin...
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (() => {
            const { hasInvalidProducts } = calculateProductCost(order.items);
            return hasInvalidProducts;
          })() ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Product IDs Need Manual Update
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      Some products in this order have invalid IDs. Please manually update the product IDs 
                      to enable accurate financial calculations. The profit margin cannot be calculated 
                      until all product IDs are valid.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (() => {
            const financialData = calculateFinancialData(order);
            return (
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Total Order Amount</dt>
                  <dd className="mt-1 text-lg font-semibold text-gray-900">
                    {order.currency} {order.totalAmount.toFixed(2)}
                  </dd>
                  <dd className="text-sm text-gray-500">
                    (₦{financialData.totalAmountInNGN.toFixed(2)})
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Product Cost (NGN)</dt>
                  <dd className="mt-1 text-lg font-semibold text-red-600">
                    ₦{financialData.productCostInNGN.toFixed(2)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Shipping Cost (NGN)</dt>
                  <dd className="mt-1 text-lg font-semibold text-orange-600">
                    ₦{financialData.shippingCostInNGN.toFixed(2)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Extra Expenses</dt>
                  <dd className="mt-1 text-lg font-semibold text-red-600">
                    {order.currency} {(order.extraExpenses?.reduce((total, expense) => total + expense.amount, 0) || 0).toFixed(2)}
                  </dd>
                  <dd className="text-sm text-gray-500">
                    (₦{financialData.totalExtraExpensesInNGN.toFixed(2)})
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Additional Payments</dt>
                  <dd className="mt-1 text-lg font-semibold text-green-600">
                    {order.currency} {(order.additionalPayments?.reduce((total, payment) => total + payment.amount, 0) || 0).toFixed(2)}
                  </dd>
                  <dd className="text-sm text-gray-500">
                    (₦{financialData.totalAdditionalPaymentsInNGN.toFixed(2)})
                  </dd>
                </div>
                <div className="col-span-2 lg:col-span-4">
                  <dt className="text-sm font-medium text-gray-500">Profit Margin (NGN)</dt>
                  <dd className="mt-1 text-2xl font-bold text-blue-600">
                    ₦{financialData.profitMargin.toFixed(2)}
                  </dd>
                  <dd className="text-sm text-gray-500">
                    Formula: Order Amount (converted to NGN) - Product Cost - Shipping Cost - Extra Expenses + Additional Payments
                  </dd>
                </div>
              </dl>
            );
          })()}
        </div>
      </div>

      {/* Extra Expenses */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Extra Expenses</h3>
          
          {/* Add Extra Expense Form */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Add Extra Expense</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <input
                  type="text"
                  value={currentExtraExpense.description}
                  onChange={(e) => setCurrentExtraExpense(prev => ({ ...prev, description: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6A7861] focus:ring-[#6A7861] sm:text-sm"
                  placeholder="e.g., Extra shipping cost"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Amount</label>
                <input
                  type="number"
                  value={currentExtraExpense.amount}
                  onChange={(e) => setCurrentExtraExpense(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6A7861] focus:ring-[#6A7861] sm:text-sm"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <select
                  value={currentExtraExpense.category}
                  onChange={(e) => setCurrentExtraExpense(prev => ({ ...prev, category: e.target.value as any }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6A7861] focus:ring-[#6A7861] sm:text-sm"
                >
                  <option value="shipping">Shipping</option>
                  <option value="materials">Materials</option>
                  <option value="labor">Labor</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleAddExtraExpense}
                  className="w-full rounded-md bg-[#6A7861] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#5a6852]"
                >
                  Add Expense
                </button>
              </div>
            </div>
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
              <input
                type="text"
                value={currentExtraExpense.notes}
                onChange={(e) => setCurrentExtraExpense(prev => ({ ...prev, notes: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6A7861] focus:ring-[#6A7861] sm:text-sm"
                placeholder="Additional notes..."
              />
            </div>
          </div>

          {/* Extra Expenses List */}
          {order.extraExpenses && order.extraExpenses.length > 0 ? (
            <div className="space-y-3">
              {order.extraExpenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-900">{expense.description}</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {expense.category}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(expense.date).toLocaleDateString()} - {order.currency} {expense.amount.toFixed(2)}
                    </div>
                    {expense.notes && (
                      <div className="text-sm text-gray-600 mt-1">{expense.notes}</div>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveExtraExpense(expense.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500 italic">No extra expenses recorded.</div>
          )}
        </div>
      </div>

      {/* Additional Payments */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Additional Payments</h3>
          
          {/* Add Additional Payment Form */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Add Additional Payment</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <input
                  type="text"
                  value={currentAdditionalPayment.description}
                  onChange={(e) => setCurrentAdditionalPayment(prev => ({ ...prev, description: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6A7861] focus:ring-[#6A7861] sm:text-sm"
                  placeholder="e.g., Extra product payment"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Amount</label>
                <input
                  type="number"
                  value={currentAdditionalPayment.amount}
                  onChange={(e) => setCurrentAdditionalPayment(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6A7861] focus:ring-[#6A7861] sm:text-sm"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <select
                  value={currentAdditionalPayment.type}
                  onChange={(e) => setCurrentAdditionalPayment(prev => ({ ...prev, type: e.target.value as any }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6A7861] focus:ring-[#6A7861] sm:text-sm"
                >
                  <option value="shipping">Shipping</option>
                  <option value="product">Product</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleAddAdditionalPayment}
                  className="w-full rounded-md bg-[#6A7861] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#5a6852]"
                >
                  Add Payment
                </button>
              </div>
            </div>
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
              <input
                type="text"
                value={currentAdditionalPayment.notes}
                onChange={(e) => setCurrentAdditionalPayment(prev => ({ ...prev, notes: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6A7861] focus:ring-[#6A7861] sm:text-sm"
                placeholder="Additional notes..."
              />
            </div>
          </div>

          {/* Additional Payments List */}
          {order.additionalPayments && order.additionalPayments.length > 0 ? (
            <div className="space-y-3">
              {order.additionalPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-900">{payment.description}</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {payment.type}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(payment.date).toLocaleDateString()} - {order.currency} {payment.amount.toFixed(2)}
                    </div>
                    {payment.notes && (
                      <div className="text-sm text-gray-600 mt-1">{payment.notes}</div>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveAdditionalPayment(payment.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500 italic">No additional payments recorded.</div>
          )}
        </div>
      </div>
    </div>
  );
}   