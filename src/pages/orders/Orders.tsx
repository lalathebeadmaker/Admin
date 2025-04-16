import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '../../hooks/useOrders';
import { useProducts } from '../../hooks/useProducts';
import { useRawMaterials } from '../../hooks/useRawMaterials';
import { OrderStatus, OrderItem, Currency } from '../../types';

export default function Orders() {
  const navigate = useNavigate();
  const { orders, isLoading, addOrder, isAdding } = useOrders();
  const { products } = useProducts();
  const { materials } = useRawMaterials();
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'all'>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    socialMedia: [] as { platform: string; handle: string; url: string; }[],
    items: [] as OrderItem[],
    shippingAddress: {
      street: '',
      city: '',
      state: '',
      country: '',
      postalCode: ''
    },
    shippingInfo: {
      customerPaid: 0
    },
    totalAmountPaid: 0,
    orderSource: 'website' // Default to website
  });

  const [currentItem, setCurrentItem] = useState<OrderItem>({
    productId: '',
    quantity: 1,
    price: 0,
    additionalMaterials: [],
    additionalCosts: []
  });

  const [currentSocialMedia, setCurrentSocialMedia] = useState({
    platform: '',
    handle: '',
    url: ''
  });

  const orderSources = [
    'website',
    'instagram',
    'facebook',
    'tiktok',
    'x',
    'pinterest',
    'reddit',
    'threads',
    'referral'
  ];

  const filteredOrders = selectedStatus === 'all'
    ? orders
    : orders.filter(order => order.status === selectedStatus);

  const calculateItemPrice = (item: OrderItem) => {
    const product = products.find(p => p.id === item.productId);
    if (!product) return 0;

    // Calculate base cost from materials
    const materialCost = product.materials.reduce((total, material) => {
      const rawMaterial = materials.find(m => m.id === material.materialId);
      if (!rawMaterial) return total;
      return total + (material.quantity * rawMaterial.lastPurchasePrice);
    }, 0);

    // Calculate labor cost
    const laborCost = product.costs.find(cost => cost.categoryId === 'labor')?.value || 0;

    // Calculate additional material costs
    const additionalMaterialCost = item.additionalMaterials?.reduce((total, material) => {
      const rawMaterial = materials.find(m => m.id === material.materialId);
      if (!rawMaterial) return total;
      return total + (material.quantity * rawMaterial.lastPurchasePrice);
    }, 0) || 0;

    // Calculate additional costs
    const additionalCosts = item.additionalCosts?.reduce((total, cost) => total + cost.amount, 0) || 0;

    return materialCost + laborCost + additionalMaterialCost + additionalCosts;
  };

  const handleAddItem = () => {
    if (!currentItem.productId) {
      alert('Please select a product');
      return;
    }

    const product = products.find(p => p.id === currentItem.productId);
    if (!product) {
      alert('Selected product not found');
      return;
    }

    const price = calculateItemPrice(currentItem);
    const newItem = {
      ...currentItem,
      price
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));

    // Reset current item
    setCurrentItem({
      productId: '',
      quantity: 1,
      price: 0,
      additionalMaterials: [],
      additionalCosts: []
    });
  };

  // const handleAddAdditionalMaterial = () => {
  //   setCurrentItem(prev => ({
  //     ...prev,
  //     additionalMaterials: [...(prev.additionalMaterials || []), { materialId: '', quantity: 1 }]
  //   }));
  // };

  // const handleAddAdditionalCost = () => {
  //   setCurrentItem(prev => ({
  //     ...prev,
  //     additionalCosts: [...(prev.additionalCosts || []), { name: '', amount: 0 }]
  //   }));
  // };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.items || formData.items.length === 0) {
      alert('Please add at least one product to the order');
      return;
    }

    // Validate all required fields
    if (!formData.customerName || !formData.customerEmail || !formData.customerPhone) {
      alert('Please fill in all required customer information');
      return;
    }

    if (!formData.shippingAddress.street || !formData.shippingAddress.city || 
        !formData.shippingAddress.state || !formData.shippingAddress.country || 
        !formData.shippingAddress.postalCode) {
      alert('Please fill in all required shipping address information');
      return;
    }

    if (formData.totalAmountPaid <= 0) {
      alert('Please enter the total amount paid for products');
      return;
    }

    try {
      const orderData = {
        ...formData,
        status: OrderStatus.PENDING,
        orderDate: new Date(),
        totalAmount: formData.items.reduce((total, item) => total + (item.price * item.quantity), 0),
        currency: Currency.NGN
      };

      await addOrder(orderData);
      setShowAddForm(false);
      setFormData({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        socialMedia: [],
        items: [],
        shippingAddress: {
          street: '',
          city: '',
          state: '',
          country: '',
          postalCode: ''
        },
        shippingInfo: {
          customerPaid: 0
        },
        totalAmountPaid: 0,
        orderSource: 'website'
      });
    } catch (error) {
      console.error('Failed to add order:', error);
      alert('Failed to create order. Please try again.');
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Orders</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowAddForm(true)}
            className="rounded-md bg-[#6A7861] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#5a6852]"
          >
            Add Order
          </button>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as OrderStatus | 'all')}
            className="rounded-md border-gray-300 shadow-sm focus:border-[#6A7861] focus:ring-[#6A7861] sm:text-sm"
          >
            <option value="all">All Orders</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {showAddForm && (
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Add New Order</h3>
            <form onSubmit={handleSubmit} className="mt-5 space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="customerName" className="block text-sm font-medium text-gray-700">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    id="customerName"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6A7861] focus:ring-[#6A7861] sm:text-sm"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700">
                    Customer Email
                  </label>
                  <input
                    type="email"
                    id="customerEmail"
                    value={formData.customerEmail}
                    onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6A7861] focus:ring-[#6A7861] sm:text-sm"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700">
                    Customer Phone
                  </label>
                  <input
                    type="tel"
                    id="customerPhone"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6A7861] focus:ring-[#6A7861] sm:text-sm"
                    required
                  />
                </div>

                <div className="col-span-2">
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
                        className="btn lala-btn justify-center px-1 py-1"
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
                              className="btn lala-btn-danger justify-center px-1 py-1"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700">Order Items</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Product</label>
                      <select
                        value={currentItem.productId}
                        onChange={(e) => {
                          const productId = e.target.value;
                          const product = products.find(p => p.id === productId);
                          setCurrentItem(prev => ({ 
                            ...prev, 
                            productId,
                            price: product ? calculateItemPrice({ ...prev, productId }) : 0
                          }));
                        }}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6A7861] focus:ring-[#6A7861] sm:text-sm"
                        required
                      >
                        <option value="">Select a product</option>
                        {products.map(product => (
                          <option key={product.id} value={product.id}>{product.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Quantity</label>
                      <input
                        type="number"
                        value={currentItem.quantity}
                        onChange={(e) => setCurrentItem(prev => ({ ...prev, quantity: parseInt(e.target.value) }))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6A7861] focus:ring-[#6A7861] sm:text-sm"
                        min="1"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <div className="text-sm text-gray-500">
                        Price: ₦{calculateItemPrice(currentItem).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="rounded-md bg-[#6A7861] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#5a6852]"
                  >
                    Add Item
                  </button>

                  {formData.items.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700">Added Items</h4>
                      <div className="mt-2 space-y-2">
                        {formData.items.map((item, index) => {
                          const product = products.find(p => p.id === item.productId);
                          return (
                            <div key={index} className="flex items-center justify-between text-sm">
                              <span>
                                {product?.name} x {item.quantity} - ₦{(item.price * item.quantity).toFixed(2)}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData(prev => ({
                                    ...prev,
                                    items: prev.items.filter((_, i) => i !== index)
                                  }));
                                }}
                                className="text-red-600 hover:text-red-800"
                              >
                                Remove
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700">Shipping Address</h3>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Street</label>
                    <input
                      type="text"
                      value={formData.shippingAddress.street}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        shippingAddress: { ...prev.shippingAddress, street: e.target.value }
                      }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6A7861] focus:ring-[#6A7861] sm:text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">City</label>
                    <input
                      type="text"
                      value={formData.shippingAddress.city}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        shippingAddress: { ...prev.shippingAddress, city: e.target.value }
                      }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6A7861] focus:ring-[#6A7861] sm:text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">State</label>
                    <input
                      type="text"
                      value={formData.shippingAddress.state}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        shippingAddress: { ...prev.shippingAddress, state: e.target.value }
                      }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6A7861] focus:ring-[#6A7861] sm:text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Country</label>
                    <input
                      type="text"
                      value={formData.shippingAddress.country}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        shippingAddress: { ...prev.shippingAddress, country: e.target.value }
                      }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6A7861] focus:ring-[#6A7861] sm:text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Postal Code</label>
                    <input
                      type="text"
                      value={formData.shippingAddress.postalCode}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        shippingAddress: { ...prev.shippingAddress, postalCode: e.target.value }
                      }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6A7861] focus:ring-[#6A7861] sm:text-sm"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700">Payment Information</h3>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Total Amount Paid for Products</label>
                    <input
                      type="number"
                      value={formData.totalAmountPaid}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        totalAmountPaid: parseFloat(e.target.value)
                      }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6A7861] focus:ring-[#6A7861] sm:text-sm"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Amount Paid for Shipping</label>
                    <input
                      type="number"
                      value={formData.shippingInfo.customerPaid}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        shippingInfo: { ...prev.shippingInfo, customerPaid: parseFloat(e.target.value) }
                      }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6A7861] focus:ring-[#6A7861] sm:text-sm"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700">Order Source</h3>
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Where did this order come from?</label>
                    <select
                      value={formData.orderSource}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        orderSource: e.target.value
                      }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6A7861] focus:ring-[#6A7861] sm:text-sm"
                      required
                    >
                      {orderSources.map(source => (
                        <option key={source} value={source}>
                          {source.charAt(0).toUpperCase() + source.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdding}
                  className="rounded-md bg-[#6A7861] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#5a6852] disabled:opacity-50"
                >
                  {isAdding ? 'Adding...' : 'Add Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-300">
              <thead>
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">
                    Order ID
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Customer
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Items
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Total
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Status
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Date
                  </th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                      {order.id}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {order.customerName}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {order.items.length} items
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      ₦{order.totalAmount.toFixed(2)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {order.status}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {new Date(order.orderDate).toLocaleDateString()}
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                      <button
                        onClick={() => navigate(`/orders/${order.id}`)}
                        className="text-[#6A7861] hover:text-[#5a6852]"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 