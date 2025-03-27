import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRawMaterials } from '../../hooks/useRawMaterials';
import { RawMaterial } from '../../types';

export default function RawMaterials() {
  const { isAdmin } = useAuth();
  const { materials, isLoading, addMaterial, isAddingMaterial } = useRawMaterials();
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<Partial<RawMaterial>>({
    name: '',
    unit: '',
    currentQuantity: 0,
    lastPurchasePrice: 0,
    lastPurchaseDate: new Date()
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.unit) {
      const newMaterial: Omit<RawMaterial, 'id'> = {
        name: formData.name,
        unit: formData.unit,
        currentQuantity: formData.currentQuantity || 0,
        lastPurchasePrice: formData.lastPurchasePrice || 0,
        lastPurchaseDate: formData.lastPurchaseDate || new Date(),
        purchaseHistory: [],
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

  if (isLoading) {
    return <div className="py-6 flex justify-center">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#6A7861] border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
        <p className="mt-2 text-sm text-gray-500">Loading materials...</p>
      </div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Raw Materials</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn lala-btn justify-center px-1 py-1"
        >
          {showAddForm ? 'Cancel' : 'Add Material'}
        </button>
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
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6A7861] focus:ring-[#6A7861] sm:text-sm"
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
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6A7861] focus:ring-[#6A7861] sm:text-sm"
                    required
                    placeholder="e.g., pack, piece, meter"
                  />
                </div>

                <div>
                  <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                    Quantity Available
                  </label>
                  <input
                    type="number"
                    id="quantity"
                    value={formData.currentQuantity}
                    onChange={(e) => setFormData({ ...formData, currentQuantity: Number(e.target.value) })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6A7861] focus:ring-[#6A7861] sm:text-sm"
                    min="0"
                    step="1"
                  />
                </div>

                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                    Last Purchase Price (Naira)
                  </label>
                  <input
                    type="number"
                    id="price"
                    value={formData.lastPurchasePrice}
                    onChange={(e) => setFormData({ ...formData, lastPurchasePrice: Number(e.target.value) })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6A7861] focus:ring-[#6A7861] sm:text-sm"
                    min="0"
                    step="1"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isAddingMaterial}
                  className="btn lala-btn"
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
                    Material Name
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Unit
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Quantity Available
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Last Purchase Price (Naira)
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
                      {material.unit}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {material.currentQuantity}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {material.lastPurchasePrice.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}
                    </td>
                  </tr>
                ))}
                {materials.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-3 py-4 text-sm text-center text-gray-500">
                      No raw materials found. Add your first material using the "Add Material" button.
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