import { useState } from 'react';
import { useRawMaterials } from '../../hooks/useRawMaterials';
import { RawMaterialPurchase } from '../../types';

export default function Purchases() {
  
  const { materials, purchases, isLoading, addPurchase, isAddingPurchase } = useRawMaterials();
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<Partial<RawMaterialPurchase>>({
    materialId: '',
    quantity: 0,
    price: 0,
    purchaseDate: new Date(),
    purchasedBy: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.materialId && formData.quantity && formData.price && formData.purchasedBy) {
      const purchase: Omit<RawMaterialPurchase, 'id'> = {
        materialId: formData.materialId,
        quantity: formData.quantity,
        price: formData.price,
        purchaseDate: formData.purchaseDate || new Date(),
        purchasedBy: formData.purchasedBy,
      };
      await addPurchase(purchase);
      setFormData({
        materialId: '',
        quantity: 0,
        price: 0,
        purchaseDate: new Date(),
        purchasedBy: '',
      });
      setShowAddForm(false);
    }
  };

  const getMaterialName = (id: string) => {
    const material = materials.find(m => m.id === id);
    return material ? material.name : 'Unknown Material';
  };

  if (isLoading) {
    return <div className="py-6 flex justify-center">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#6A7861] border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
        <p className="mt-2 text-sm text-gray-500">Loading purchases...</p>
      </div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Purchases</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn"
        >
          {showAddForm ? 'Cancel' : 'Record Purchase'}
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="materialId" className="block text-sm font-medium text-gray-700">
                    Material
                  </label>
                  <select
                    id="materialId"
                    value={formData.materialId}
                    onChange={(e) => setFormData({ ...formData, materialId: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6A7861] focus:ring-[#6A7861] sm:text-sm"
                    required
                  >
                    <option value="">Select a material</option>
                    {materials.map((material) => (
                      <option key={material.id} value={material.id}>{material.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                    Quantity
                  </label>
                  <input
                    type="number"
                    id="quantity"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6A7861] focus:ring-[#6A7861] sm:text-sm"
                    min="1"
                    step="1"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                    Price per Unit (Naira)
                  </label>
                  <input
                    type="number"
                    id="price"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6A7861] focus:ring-[#6A7861] sm:text-sm"
                    min="1"
                    step="1"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="purchaseDate" className="block text-sm font-medium text-gray-700">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    id="purchaseDate"
                    value={formData.purchaseDate ? new Date(formData.purchaseDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => setFormData({ ...formData, purchaseDate: new Date(e.target.value) })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6A7861] focus:ring-[#6A7861] sm:text-sm"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="purchasedBy" className="block text-sm font-medium text-gray-700">
                    Purchased By
                  </label>
                  <input
                    type="text"
                    id="purchasedBy"
                    value={formData.purchasedBy}
                    onChange={(e) => setFormData({ ...formData, purchasedBy: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6A7861] focus:ring-[#6A7861] sm:text-sm"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="totalCost" className="block text-sm font-medium text-gray-700">
                    Total Cost
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-gray-500 sm:text-sm">
                      ₦
                    </span>
                    <input
                      type="text"
                      id="totalCost"
                      value={((formData.price || 0) * (formData.quantity || 0)).toLocaleString()}
                      readOnly
                      className="block w-full rounded-none rounded-r-md border-gray-300 bg-gray-50 text-gray-500 shadow-sm focus:border-[#6A7861] focus:ring-[#6A7861] sm:text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isAddingPurchase}
                  className="btn"
                >
                  {isAddingPurchase ? 'Recording...' : 'Record Purchase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-base font-semibold leading-6 text-gray-900 mb-4">Purchase History</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-300">
              <thead>
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">
                    Material
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Quantity
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Price per Unit
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Total Cost
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Purchase Date
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Purchased By
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {purchases.map((purchase) => (
                  <tr key={purchase.id}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                      {getMaterialName(purchase.materialId)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {purchase.quantity}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {purchase.price.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {(purchase.price * purchase.quantity).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {new Date(purchase.purchaseDate).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {purchase.purchasedBy}
                    </td>
                  </tr>
                ))}
                {purchases.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-4 text-sm text-center text-gray-500">
                      No purchase history found. Record your first purchase using the "Record Purchase" button.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 