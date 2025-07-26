import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '../hooks/useOrders';
import { useProducts } from '../hooks/useProducts';
import { useRawMaterials } from '../hooks/useRawMaterials';
import { useLaborCosts } from '../hooks/useLaborCosts';
import { OrderStatus, Currency, CurrencyRate } from '../types';

export default function Dashboard() {
  const navigate = useNavigate();
  const { orders, isLoading: ordersLoading } = useOrders();
  const { products, isLoading: productsLoading } = useProducts();
  const { materials, purchases } = useRawMaterials();
  const { laborCosts, calculateTotalMonthlyLaborCost, calculateDailyRate } = useLaborCosts();

  // Currency conversion rates (same as OrderDetails page)
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

  // Calculate dashboard metrics
  const dashboardData = useMemo(() => {
    if (ordersLoading || productsLoading) {
      return {
        totalRevenue: 0,
        totalOrders: 0,
        pendingOrders: 0,
        completedOrders: 0,
        overdueOrders: 0,
        lowInventoryProducts: [],
        topSellingProducts: [],
        monthlyExpenses: 0,
        profitMargin: 0,
        ordersNeedingAttention: []
      };
    }

    // Revenue and Orders (converted to NGN)
    const totalRevenue = orders.reduce((sum, order) => sum + convertToNGN(order.totalAmount, order.currency), 0);
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(order => 
      order.status === OrderStatus.PENDING || order.status === OrderStatus.PROCESSING
    ).length;
    const completedOrders = orders.filter(order => 
      order.status === OrderStatus.COMPLETED || order.status === OrderStatus.DELIVERED
    ).length;

    // Overdue Orders
    const overdueOrders = orders.filter(order => {
      if (!order.shipping.shippingInfo.estimatedDeliveryDate) return false;
      const expectedDate = order.shipping.shippingInfo.estimatedDeliveryDate instanceof Date 
        ? order.shipping.shippingInfo.estimatedDeliveryDate
        : new Date(order.shipping.shippingInfo.estimatedDeliveryDate);
      const today = new Date();
      return expectedDate < today && 
        (order.status === OrderStatus.PENDING || order.status === OrderStatus.PROCESSING);
    });

    // Top Selling Products
    const productSales = products.map(product => {
      const productOrders = orders.filter(order => 
        order.items.some(item => item.productId === product.id)
      );
      const totalQuantity = productOrders.reduce((sum, order) => 
        sum + order.items
          .filter(item => item.productId === product.id)
          .reduce((itemSum, item) => itemSum + item.quantity, 0), 0
      );
      const totalRevenue = productOrders.reduce((sum, order) => 
        sum + convertToNGN(order.items
          .filter(item => item.productId === product.id)
          .reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0), order.currency), 0
      );
      return {
        ...product,
        totalQuantity,
        totalRevenue,
        orderCount: productOrders.length
      };
    }).sort((a, b) => b.totalQuantity - a.totalQuantity);

    // Low Inventory Alert (products with materials running low)
    const lowInventoryProducts = products.filter(product => {
      return product.materials.some(material => {
        const rawMaterial = materials.find(rm => rm.id === material.materialId);
        if (!rawMaterial) return false;
        // Alert if current quantity is less than 2x the required quantity for this product
        return rawMaterial.currentQuantity < (material.quantity * 2);
      });
    });

    // Monthly Expenses
    const monthlyLaborCost = calculateTotalMonthlyLaborCost();
    const monthlyMaterialCost = purchases
      .filter(purchase => {
        const purchaseDate = new Date(purchase.purchaseDate);
        const currentDate = new Date();
        return purchaseDate.getMonth() === currentDate.getMonth() && 
               purchaseDate.getFullYear() === currentDate.getFullYear();
      })
      .reduce((sum, purchase) => sum + purchase.price, 0);
    const monthlyExpenses = monthlyLaborCost + monthlyMaterialCost;

    // Profit Calculation
    const totalCost = orders.reduce((sum, order) => {
      const orderCost = order.items.reduce((itemSum, item) => {
        const product = products.find(p => p.id === item.productId);
        if (!product) return itemSum;
        
        // Calculate material cost
        const materialCost = product.materials.reduce((matSum, material) => {
          const rawMaterial = materials.find(rm => rm.id === material.materialId);
          return matSum + (rawMaterial ? rawMaterial.lastPurchasePrice * material.quantity : 0);
        }, 0);
        
        // Calculate labor cost
        const dailyRate = calculateDailyRate();
        const laborCost = dailyRate * product.timeToMake;
        
        return itemSum + ((materialCost + laborCost) * item.quantity);
      }, 0);
      return sum + orderCost;
    }, 0);

    const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0;

    // Orders needing attention
    const ordersNeedingAttention = orders.filter(order => {
      // Overdue orders
      if (order.shipping.shippingInfo.estimatedDeliveryDate) {
        const expectedDate = order.shipping.shippingInfo.estimatedDeliveryDate instanceof Date 
          ? order.shipping.shippingInfo.estimatedDeliveryDate
          : new Date(order.shipping.shippingInfo.estimatedDeliveryDate);
        const today = new Date();
        if (expectedDate < today && 
            (order.status === OrderStatus.PENDING || order.status === OrderStatus.PROCESSING)) {
          return true;
        }
      }
      
      // Orders due within 3 days
      if (order.shipping.shippingInfo.estimatedDeliveryDate) {
        const expectedDate = order.shipping.shippingInfo.estimatedDeliveryDate instanceof Date 
          ? order.shipping.shippingInfo.estimatedDeliveryDate
          : new Date(order.shipping.shippingInfo.estimatedDeliveryDate);
        const today = new Date();
        const diffDays = Math.ceil((expectedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 3 && diffDays >= 0 && 
            (order.status === OrderStatus.PENDING || order.status === OrderStatus.PROCESSING)) {
          return true;
        }
      }
      
      return false;
    });

    // Currency breakdown
    const currencyBreakdown = orders.reduce((acc, order) => {
      const currency = order.currency;
      const amount = order.totalAmount;
      if (!acc[currency]) {
        acc[currency] = { count: 0, total: 0, totalInNGN: 0 };
      }
      acc[currency].count += 1;
      acc[currency].total += amount;
      acc[currency].totalInNGN += convertToNGN(amount, currency);
      return acc;
    }, {} as Record<Currency, { count: number; total: number; totalInNGN: number }>);

    return {
      totalRevenue,
      totalOrders,
      pendingOrders,
      completedOrders,
      overdueOrders: overdueOrders.length,
      lowInventoryProducts,
      topSellingProducts: productSales.slice(0, 5),
      monthlyExpenses,
      profitMargin,
      ordersNeedingAttention,
      currencyBreakdown
    };
  }, [orders, products, materials, purchases, laborCosts, ordersLoading, productsLoading, calculateTotalMonthlyLaborCost, calculateDailyRate, convertToNGN]);

  if (ordersLoading || productsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                  <dd className="text-lg font-medium text-gray-900">₦{dashboardData.totalRevenue.toLocaleString()}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Orders</dt>
                  <dd className="text-lg font-medium text-gray-900">{dashboardData.totalOrders}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending Orders</dt>
                  <dd className="text-lg font-medium text-gray-900">{dashboardData.pendingOrders}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Overdue Orders</dt>
                  <dd className="text-lg font-medium text-gray-900">{dashboardData.overdueOrders}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Financial Overview</h3>
            <div className="mt-5">
              <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="px-4 py-5 bg-gray-50 shadow rounded-lg overflow-hidden sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">Monthly Expenses</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">₦{dashboardData.monthlyExpenses.toLocaleString()}</dd>
                </div>
                <div className="px-4 py-5 bg-gray-50 shadow rounded-lg overflow-hidden sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">Profit Margin</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">{dashboardData.profitMargin.toFixed(1)}%</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Order Status</h3>
            <div className="mt-5">
              <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="px-4 py-5 bg-gray-50 shadow rounded-lg overflow-hidden sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">Completed Orders</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">{dashboardData.completedOrders}</dd>
                </div>
                <div className="px-4 py-5 bg-gray-50 shadow rounded-lg overflow-hidden sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">Completion Rate</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">
                    {dashboardData.totalOrders > 0 ? ((dashboardData.completedOrders / dashboardData.totalOrders) * 100).toFixed(1) : 0}%
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Currency Breakdown */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Revenue by Currency</h3>
            <div className="text-xs text-gray-500">
              Exchange rates: USD=₦1500, GBP=₦1900, EUR=₦1650, CAD=₦1100
            </div>
          </div>
          <div className="mt-5">
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Currency</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Original Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount in NGN</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(dashboardData.currencyBreakdown || {}).map(([currency, data]) => (
                    <tr key={currency}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{currency}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{data.count}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {currency} {data.total.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ₦{data.totalInNGN.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Needing Attention */}
      {dashboardData.ordersNeedingAttention.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Orders Needing Attention</h3>
              <button
                onClick={() => navigate('/orders')}
                className="text-sm text-[#6A7861] hover:text-[#5a6852] font-medium"
              >
                View All Orders →
              </button>
            </div>
            <div className="mt-5">
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expected Delivery</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days Left</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {dashboardData.ordersNeedingAttention.slice(0, 5).map((order) => {
                      const expectedDate = order.shipping.shippingInfo.estimatedDeliveryDate instanceof Date 
                        ? order.shipping.shippingInfo.estimatedDeliveryDate
                        : order.shipping.shippingInfo.estimatedDeliveryDate 
                          ? new Date(order.shipping.shippingInfo.estimatedDeliveryDate)
                          : new Date();
                      const today = new Date();
                      const diffDays = Math.ceil((expectedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                      
                      return (
                        <tr key={order.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/orders/${order.id}`)}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.customerName}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {expectedDate.toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              diffDays < 0 ? 'bg-red-100 text-red-800' :
                              diffDays <= 3 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {diffDays < 0 ? `${Math.abs(diffDays)} days overdue` : `${diffDays} days left`}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inventory Alerts */}
      {dashboardData.lowInventoryProducts.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Low Inventory Alerts</h3>
              <button
                onClick={() => navigate('/inventory/raw-materials')}
                className="text-sm text-[#6A7861] hover:text-[#5a6852] font-medium"
              >
                View Inventory →
              </button>
            </div>
            <div className="mt-5">
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Low Materials</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {dashboardData.lowInventoryProducts.slice(0, 5).map((product) => {
                      const lowMaterials = product.materials.filter(material => {
                        const rawMaterial = materials.find(rm => rm.id === material.materialId);
                        return rawMaterial && rawMaterial.currentQuantity < (material.quantity * 2);
                      });
                      
                      return (
                        <tr key={product.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/products/${product.id}`)}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {lowMaterials.map(material => {
                              const rawMaterial = materials.find(rm => rm.id === material.materialId);
                              return rawMaterial ? rawMaterial.name : 'Unknown';
                            }).join(', ')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                              Low Stock
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Selling Products */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Top Selling Products</h3>
            <button
              onClick={() => navigate('/products')}
              className="text-sm text-[#6A7861] hover:text-[#5a6852] font-medium"
            >
              View All Products →
            </button>
          </div>
          <div className="mt-5">
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Units Sold</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dashboardData.topSellingProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/products/${product.id}`)}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.totalQuantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₦{product.totalRevenue.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.orderCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 