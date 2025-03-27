import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRawMaterials } from '../../hooks/useRawMaterials';
import { RawMaterial } from '../../types';

export default function RawMaterialsList() {
  const { isAdmin } = useAuth();
  const { materials, isLoading, addMaterial, isAddingMaterial } = useRawMaterials();
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<Partial<RawMaterial>>({
    name: '',
    unit: '',
    currentQuantity: 0,
    lastPurchasePrice: 0,
    lastPurchaseDate: new Date(),
    purchaseHistory: [],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.unit && formData.currentQuantity && formData.lastPurchasePrice) {
      const newMaterial: Omit<RawMaterial, 'id'> = {
        name: formData.name,
        unit: formData.unit,
        currentQuantity: formData.currentQuantity,
        lastPurchasePrice: formData.lastPurchasePrice,
        lastPurchaseDate: formData.lastPurchaseDate || new Date(),
        purchaseHistory: [{
          id: crypto.randomUUID(),
          quantity: formData.currentQuantity,
          totalCost: formData.currentQuantity * (formData.lastPurchasePrice || 0),
          purchaseDate: formData.lastPurchaseDate || new Date(),
        }],
      };
      await addMaterial(newMaterial);
      setFormData({
        name: '',
        unit: '',
        currentQuantity: 0,
        lastPurchasePrice: 0,
        lastPurchaseDate: new Date(),
        purchaseHistory: [],
      });
      setShowAddForm(false);
    }
  };

  const calculateAverageUnitCost = (material: RawMaterial) => {
    if (material.purchaseHistory.length === 0) return 0;
    const totalCost = material.purchaseHistory.reduce((sum, purchase) => sum + purchase.totalCost, 0);
    const totalQuantity = material.purchaseHistory.reduce((sum, purchase) => sum + purchase.quantity, 0);
    return totalCost / totalQuantity;
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Raw Materials Inventory</h1>
        {isAdmin && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
          >
            {showAddForm ? 'Cancel' : 'Add Material'}
          </button>
        )}
      </div>

      {showAddForm && (
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Material Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="unit" className="block text-sm font-medium text-gray-700">
                    Unit of Measurement
                  </label>
                  <input
                    type="text"
                    id="unit"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                    Initial Quantity
                  </label>
                  <input
                    type="number"
                    id="quantity"
                    value={formData.currentQuantity}
                    onChange={(e) => setFormData({ ...formData, currentQuantity: Number(e.target.value) })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="totalCost" className="block text-sm font-medium text-gray-700">
                    Total Purchase Cost
                  </label>
                  <input
                    type="number"
                    id="totalCost"
                    value={(formData.lastPurchasePrice || 0) * (formData.currentQuantity || 0)}
                    onChange={(e) => {
                      const totalCost = Number(e.target.value);
                      const quantity = formData.currentQuantity || 1;
                      setFormData({
                        ...formData,
                        lastPurchasePrice: totalCost / quantity,
                      });
                    }}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    min="0"
                    step="0.01"
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
                    value={formData.lastPurchaseDate ? new Date(formData.lastPurchaseDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => setFormData({ ...formData, lastPurchaseDate: new Date(e.target.value) })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isAddingMaterial}
                  className="rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:opacity-50"
                >
                  {isAddingMaterial ? 'Adding...' : 'Add Material'}
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
                    Material
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Current Quantity
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Unit
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Last Purchase Price
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Average Unit Cost
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Last Purchase Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {materials.map((material) => (
                  <tr key={material.id}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                      {material.name}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {material.currentQuantity}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {material.unit}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      ${material.lastPurchasePrice.toFixed(2)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      ${calculateAverageUnitCost(material).toFixed(2)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {new Date(material.lastPurchaseDate).toLocaleDateString()}
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