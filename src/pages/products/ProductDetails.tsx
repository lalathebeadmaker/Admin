import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useProducts } from '../../hooks/useProducts';
import { useRawMaterials } from '../../hooks/useRawMaterials';
import { useLaborCosts } from '../../hooks/useLaborCosts';
import { Product, ProductMaterial } from '../../types';

export default function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const { isAdmin } = useAuth();
  const { products, isLoading: isLoadingProducts, updateProduct, isUpdating } = useProducts();
  const { materials } = useRawMaterials();
  const { calculateDailyRate } = useLaborCosts();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Product>>({});
  const [currentMaterial, setCurrentMaterial] = useState<{
    materialId: string;
    quantity: number;
  }>({
    materialId: '',
    quantity: 0,
  });

  const product = products.find(p => p.id === id);
  const isLoading = isLoadingProducts;

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        materials: product.materials,
        timeToMake: product.timeToMake,
      });
    }
  }, [product]);

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
      const costs = calculateTotalCost(formData.materials || [], formData.timeToMake || 0);
      const updatedProduct = {
        ...formData,
        costs: [
          { categoryId: 'raw_material', value: costs.materialCost },
          { categoryId: 'labor', value: costs.laborCost },
        ],
      };
      await updateProduct({ id, product: updatedProduct });
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData(product);
  };

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
        materials: [...(formData.materials || []), currentMaterial],
      });
      setCurrentMaterial({ materialId: '', quantity: 0 });
    }
  };

  const handleRemoveMaterial = (index: number) => {
    setFormData({
      ...formData,
      materials: (formData.materials || []).filter((_, i) => i !== index),
    });
  };

  const handleUpdateMaterialQuantity = (index: number, quantity: number) => {
    const updatedMaterials = [...(formData.materials || [])];
    updatedMaterials[index] = {
      ...updatedMaterials[index],
      quantity,
    };
    setFormData({
      ...formData,
      materials: updatedMaterials,
    });
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
                  className="btn lala-btn-danger justify-center px-1 py-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isUpdating}
                  className="btn lala-btn justify-center px-1 py-1"
                >
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            ) : (
              <button
                onClick={handleEdit}
                className="btn lala-btn justify-center px-1 py-1"
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
                  <label htmlFor="timeToMake" className="block text-sm font-medium text-gray-700">
                    Time to Make (days)
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      id="timeToMake"
                      value={formData.timeToMake}
                      onChange={(e) => setFormData({ ...formData, timeToMake: Number(e.target.value) })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      min="0.5"
                      step="0.5"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{product.timeToMake} days</p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium leading-6 text-gray-900">Materials</h3>
              {isEditing && (
                <div className="mt-4 flex space-x-4">
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
              )}

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
                      {isEditing && (
                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                          <span className="sr-only">Actions</span>
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(isEditing ? formData.materials : product.materials)?.map((material, index) => {
                      const materialData = materials.find(m => m.id === material.materialId);
                      const unitPrice = materialData?.lastPurchasePrice || 0;
                      const totalCost = unitPrice * material.quantity;
                      return (
                        <tr key={material.materialId}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                            {materialData?.name || 'Unknown Material'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {isEditing ? (
                              <input
                                type="number"
                                value={material.quantity}
                                onChange={(e) => handleUpdateMaterialQuantity(index, Number(e.target.value))}
                                className="block w-24 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                min="0"
                                step="0.5"
                              />
                            ) : (
                              `${material.quantity} ${materialData?.unit}`
                            )}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            ₦{unitPrice.toFixed(2)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            ₦{totalCost.toFixed(2)}
                          </td>
                          {isEditing && (
                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                              <button
                                onClick={() => handleRemoveMaterial(index)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Remove
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium leading-6 text-gray-900">Cost Summary</h3>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Material Cost</p>
                  <p className="text-lg font-semibold text-gray-900">
                    ₦{calculateMaterialCost(isEditing ? formData.materials || [] : product.materials).toFixed(2)}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Labor Cost</p>
                  <p className="text-lg font-semibold text-gray-900">
                    ₦{calculateLaborCost(isEditing ? formData.timeToMake || 0 : product.timeToMake).toFixed(2)}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Total Cost</p>
                  <p className="text-lg font-semibold text-gray-900">
                    ₦{calculateTotalCost(
                      isEditing ? formData.materials || [] : product.materials,
                      isEditing ? formData.timeToMake || 0 : product.timeToMake
                    ).totalCost.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 