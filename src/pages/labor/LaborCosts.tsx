import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLaborCosts } from '../../hooks/useLaborCosts';
import { LaborCost } from '../../types';

export default function LaborCosts() {
  const { isAdmin } = useAuth();
  const { laborCosts, isLoading, isAdding, addLaborCost, calculateTotalMonthlyLaborCost, calculateTotalLaborDays, calculateDailyRate } = useLaborCosts();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Omit<LaborCost, 'id'>>({
    employeeName: '',
    monthlySalary: 0,
    daysWorked: 0,
    hoursPerDay: 8,
    startDate: new Date(),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addLaborCost(formData);
    setShowForm(false);
    setFormData({
      employeeName: '',
      monthlySalary: 0,
      daysWorked: 0,
      hoursPerDay: 8,
      startDate: new Date(),
    });
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Labor Costs</h1>
        {isAdmin && (
          <button
            onClick={() => setShowForm(true)}
            className="btn lala-btn justify-center px-1 py-1"
          >
            Add Employee
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white shadow sm:rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Add New Employee</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="employeeName" className="block text-sm font-medium text-gray-700">
                Employee Name
              </label>
              <input
                type="text"
                id="employeeName"
                value={formData.employeeName}
                onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                required
              />
            </div>

            <div>
              <label htmlFor="monthlySalary" className="block text-sm font-medium text-gray-700">
                Monthly Salary
              </label>
              <input
                type="number"
                id="monthlySalary"
                value={formData.monthlySalary}
                onChange={(e) => setFormData({ ...formData, monthlySalary: Number(e.target.value) })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                required
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label htmlFor="daysWorked" className="block text-sm font-medium text-gray-700">
                Days Worked per Month
              </label>
              <input
                type="number"
                id="daysWorked"
                value={formData.daysWorked}
                onChange={(e) => setFormData({ ...formData, daysWorked: Number(e.target.value) })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                required
                min="0"
                max="31"
                step="1"
              />
            </div>

            <div>
              <label htmlFor="hoursPerDay" className="block text-sm font-medium text-gray-700">
                Hours per Day
              </label>
              <input
                type="number"
                id="hoursPerDay"
                value={formData.hoursPerDay}
                onChange={(e) => setFormData({ ...formData, hoursPerDay: Number(e.target.value) })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                required
                min="1"
                max="24"
                step="1"
              />
            </div>

            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                value={formData.startDate.toISOString().split('T')[0]}
                onChange={(e) => setFormData({ ...formData, startDate: new Date(e.target.value) })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                required
              />
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
                {isAdding ? 'Adding...' : 'Add Employee'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-base font-semibold leading-6 text-gray-900">Labor Costs List</h3>
          <div className="mt-6 flow-root">
            <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead>
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">
                        Employee
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Monthly Salary
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Days Worked
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Daily Rate
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {laborCosts.map((cost) => (
                      <tr key={cost.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                          {cost.employeeName}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          ₦{cost.monthlySalary.toFixed(2)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {cost.daysWorked}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          ₦{(cost.monthlySalary / cost.daysWorked).toFixed(2)}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                          <button
                            className="text-primary-600 hover:text-primary-900"
                          >
                            Edit
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
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-base font-semibold leading-6 text-gray-900">Summary</h3>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Total Monthly Labor Cost</p>
              <p className="text-lg font-semibold text-gray-900">
                ₦{calculateTotalMonthlyLaborCost().toFixed(2)}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Total Labor Days</p>
              <p className="text-lg font-semibold text-gray-900">
                {calculateTotalLaborDays()}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Average Daily Rate</p>
              <p className="text-lg font-semibold text-gray-900">
                ₦{calculateDailyRate().toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 