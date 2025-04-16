import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useProducts } from '../../hooks/useProducts';
import { useRawMaterials } from '../../hooks/useRawMaterials';
import { useLaborCosts } from '../../hooks/useLaborCosts';
import { Product, ProductMaterial } from '../../types';

export default function Products() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const { products, isLoading: isLoadingProducts, addProduct, isAdding } = useProducts();
  const { materials } = useRawMaterials();
  const { calculateDailyRate } = useLaborCosts();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Omit<Product, 'id'>>({
    name: '',
    materials: [],
    costs: [],
    timeToMake: 0,
  });
  const [currentMaterial, setCurrentMaterial] = useState<{
    materialId: string;
    quantity: number;
  }>({
    materialId: '',
    quantity: 0,
  });

  const calculateMaterialCost = (productMaterials: ProductMaterial[]) => {
    return productMaterials.reduce((total, material) => {
      const rawMaterial = materials.find(rm => rm.id === material.materialId);
      if (rawMaterial) {
        return total + (rawMaterial.lastPurchasePrice * material.quantity);
      }
      return total;
    }, 0);
  };

  const calculateLaborCost = (timeToMake: number) => {
    const dailyRate = calculateDailyRate();
    return dailyRate * timeToMake;
  };

  const calculateTotalCost = (materials: ProductMaterial[], timeToMake: number) => {
    const materialCost = calculateMaterialCost(materials);
    const laborCost = calculateLaborCost(timeToMake);
    return {
      materialCost,
      laborCost,
      totalCost: materialCost + laborCost,
    };
  };

  const handleAddMaterial = () => {
    if (currentMaterial.quantity > 0 && currentMaterial.materialId) {
      setFormData({
        ...formData,
        materials: [...formData.materials, currentMaterial],
      });
      setCurrentMaterial({ materialId: '', quantity: 0 });
    }
  };

  const handleRemoveMaterial = (index: number) => {
    setFormData({
      ...formData,
      materials: formData.materials.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const costs = calculateTotalCost(formData.materials, formData.timeToMake);
    const productData = {
      ...formData,
      costs: [
        { categoryId: 'raw_material', value: costs.materialCost },
        { categoryId: 'labor', value: costs.laborCost },
      ],
    };
    await addProduct(productData);
    setShowForm(false);
    setFormData({
      name: '',
      materials: [],
      costs: [],
      timeToMake: 0,
    });
  };

  if (isLoadingProducts) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Products</h1>
        {isAdmin && (
          <button
            onClick={() => setShowForm(true)}
            className="btn lala-btn justify-center px-1 py-1"
          >
            Add Product
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white shadow sm:rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Add New Product</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Product Name
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
              <label htmlFor="timeToMake" className="block text-sm font-medium text-gray-700">
                Time to Make (days)
              </label>
              <input
                type="number"
                id="timeToMake"
                value={formData.timeToMake}
                onChange={(e) => setFormData({ ...formData, timeToMake: Number(e.target.value) })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                required
                min="1"
                step="0.5"
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700">Cost Breakdown</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Material Cost</p>
                  <p className="text-lg font-semibold text-gray-900">
                    ₦{calculateMaterialCost(formData.materials).toFixed(2)}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Labor Cost</p>
                  <p className="text-lg font-semibold text-gray-900">
                    ₦{calculateLaborCost(formData.timeToMake).toFixed(2)}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Total Cost</p>
                  <p className="text-lg font-semibold text-gray-900">
                    ₦{calculateTotalCost(formData.materials, formData.timeToMake).totalCost.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700">Materials</h3>
              <div className="flex space-x-4">
                <select
                  value={currentMaterial.materialId}
                  onChange={(e) => setCurrentMaterial({ ...currentMaterial, materialId: e.target.value })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                >
                  <option value="">Select a material</option>
                  {materials.map((material) => (
                    <option key={material.id} value={material.id}>
                      {material.name} ({material.unit})
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={currentMaterial.quantity}
                  onChange={(e) => setCurrentMaterial({ ...currentMaterial, quantity: Number(e.target.value) })}
                  className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  placeholder="Quantity"
                  min="0"
                  step="0.5"
                />
                <button
                  type="button"
                  onClick={handleAddMaterial}
                  className="btn lala-btn justify-center px-1 py-1"
                >
                  Add
                </button>
              </div>

              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Materials</h4>
                <ul className="space-y-2">
                  {formData.materials.map((material, index) => {
                    const materialData = materials.find((m) => m.id === material.materialId);
                    return (
                      <li key={index} className="flex items-center justify-between text-sm">
                        <span>
                          {materialData?.name} - {material.quantity} {materialData?.unit}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveMaterial(index)}
                          className="btn lala-btn-danger justify-center px-1 py-1"
                        >
                          Remove
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isAdding}
                className="btn lala-btn justify-center px-1 py-1"
              >
                {isAdding ? 'Adding...' : 'Add Product'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-base font-semibold leading-6 text-gray-900">Products List</h3>
          <div className="mt-6 flow-root">
            <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead>
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">
                        Name
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Days to Make
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Material Cost
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Labor Cost
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Total Cost
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {products.map((product) => {
                      const costs = calculateTotalCost(product.materials, product.timeToMake);
                      return (
                        <tr key={product.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                            {product.name}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {product.timeToMake} days
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            ₦{costs.materialCost.toFixed(2)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            ₦{costs.laborCost.toFixed(2)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            ₦{costs.totalCost.toFixed(2)}
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                            <button
                              onClick={() => navigate(`/products/${product.id}`)}
                              className="text-primary-600 hover:text-primary-900"
                            >
                              View
                            </button>
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
      </div>
    </div>
  );
} 