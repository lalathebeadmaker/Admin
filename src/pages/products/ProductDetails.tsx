import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useProducts } from '../../hooks/useProducts';
import { useRawMaterials } from '../../hooks/useRawMaterials';
import { Product } from '../../types';

export default function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const { isAdmin } = useAuth();
  const { products, isLoading: isLoadingProducts, updateProduct, isUpdating } = useProducts();
  const { materials } = useRawMaterials();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    description: '',
    baseCost: 0,
    materials: [],
  });

  const product = products.find(p => p.id === id);
  const isLoading = isLoadingProducts;

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!product) {
    return <div>Product not found</div>;
  }

  const handleEdit = () => {
    setFormData(product);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (id) {
      await updateProduct({ id, product: formData });
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData(product);
  };

  const calculateTotalCost = () => {
    const materialsCost = product.materials.reduce((total, material) => {
      const materialData = materials.find(m => m.id === material.materialId);
      if (materialData) {
        return total + (materialData.lastPurchasePrice * material.quantity);
      }
      return total;
    }, 0);
    return materialsCost + product.baseCost;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Product Details</h1>
        {isAdmin && (
          <div className="flex space-x-3">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isUpdating}
                  className="rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:opacity-50"
                >
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            ) : (
              <button
                onClick={handleEdit}
                className="rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
              >
                Edit Product
              </button>
            )}
          </div>
        )}
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium leading-6 text-gray-900">Basic Information</h3>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Product Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{product.name}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="baseCost" className="block text-sm font-medium text-gray-700">
                    Base Cost
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      id="baseCost"
                      value={formData.baseCost}
                      onChange={(e) => setFormData({ ...formData, baseCost: Number(e.target.value) })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      min="0"
                      step="0.01"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">${product.baseCost.toFixed(2)}</p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              {isEditing ? (
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              ) : (
                <p className="mt-1 text-sm text-gray-900">{product.description}</p>
              )}
            </div>

            <div>
              <h3 className="text-lg font-medium leading-6 text-gray-900">Materials</h3>
              <div className="mt-4">
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
                        Unit Price
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Total Cost
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {product.materials.map((material) => {
                      const materialData = materials.find(m => m.id === material.materialId);
                      const unitPrice = materialData?.lastPurchasePrice || 0;
                      const totalCost = unitPrice * material.quantity;
                      return (
                        <tr key={material.materialId}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                            {materialData?.name || 'Unknown Material'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {material.quantity} {materialData?.unit}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            ${unitPrice.toFixed(2)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            ${totalCost.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Cost Summary</h3>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Materials Cost: ${(calculateTotalCost() - product.baseCost).toFixed(2)}</p>
                  <p className="text-sm text-gray-500">Base Cost: ${product.baseCost.toFixed(2)}</p>
                  <p className="text-lg font-semibold text-gray-900">Total Cost: ${calculateTotalCost().toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 