import React from 'react';

const ButtonExample: React.FC = () => {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Button Examples</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Standard Buttons */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Standard Buttons</h2>
          <p className="text-gray-600 mb-6">
            These are the standard buttons with the sage green theme color.
          </p>
          
          <div className="space-y-4">
            <div>
              <button className="btn">Standard Button</button>
              <p className="text-sm text-gray-500 mt-2">
                <code>className="btn"</code>
              </p>
            </div>
            
            <div>
              <button className="btn text-lg py-3 px-6">Large Button</button>
              <p className="text-sm text-gray-500 mt-2">
                <code>className="btn text-lg py-3 px-6"</code>
              </p>
            </div>
            
            <div>
              <button className="btn text-xs py-1 px-2">Small Button</button>
              <p className="text-sm text-gray-500 mt-2">
                <code>className="btn text-xs py-1 px-2"</code>
              </p>
            </div>
            
            <div>
              <button className="btn" disabled>Disabled Button</button>
              <p className="text-sm text-gray-500 mt-2">
                <code>className="btn" disabled</code>
              </p>
            </div>

            <div>
              <button type="submit" className="btn w-full">Submit Button</button>
              <p className="text-sm text-gray-500 mt-2">
                <code>className="btn w-full"</code>
              </p>
            </div>
          </div>
        </div>
        
        {/* Secondary Buttons */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Secondary Buttons</h2>
          <p className="text-gray-600 mb-6">
            Secondary buttons also use the sage green theme.
          </p>
          
          <div className="space-y-4">
            <div>
              <button className="btn-secondary">Secondary Button</button>
              <p className="text-sm text-gray-500 mt-2">
                <code>className="btn-secondary"</code>
              </p>
            </div>
            
            <div>
              <button className="btn-secondary text-lg py-3 px-6">Large Secondary</button>
              <p className="text-sm text-gray-500 mt-2">
                <code>className="btn-secondary text-lg py-3 px-6"</code>
              </p>
            </div>
            
            <div>
              <button className="btn-secondary text-xs py-1 px-2">Small Secondary</button>
              <p className="text-sm text-gray-500 mt-2">
                <code>className="btn-secondary text-xs py-1 px-2"</code>
              </p>
            </div>
            
            <div>
              <button className="btn-secondary" disabled>Disabled Secondary</button>
              <p className="text-sm text-gray-500 mt-2">
                <code>className="btn-secondary" disabled</code>
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Usage Guide */}
      <div className="mt-12 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Button Usage Guide</h2>
        
        <div className="prose max-w-none">
          <p>To use these buttons in your components:</p>
          
          <h3 className="text-lg font-medium mt-6 mb-2">Basic Usage</h3>
          <pre className="bg-gray-100 p-3 rounded-md overflow-x-auto">
            <code>{`// Primary button
<button className="btn">Click Me</button>

// Secondary button
<button className="btn-secondary">Click Me</button>`}</code>
          </pre>
          
          <h3 className="text-lg font-medium mt-6 mb-2">Using Theme Colors Directly</h3>
          <pre className="bg-gray-100 p-3 rounded-md overflow-x-auto">
            <code>{`// Using primary color
<div className="bg-primary text-white">Primary background</div>

// Using a shade of primary
<div className="bg-primary-100">Light primary background</div>
<div className="text-primary-800">Dark primary text</div>`}</code>
          </pre>
          
          <h3 className="text-lg font-medium mt-6 mb-2">Button Variations</h3>
          <pre className="bg-gray-100 p-3 rounded-md overflow-x-auto">
            <code>{`// Width variations
<button className="btn w-full">Full width button</button>
<button className="btn w-auto">Auto width button</button>

// Size variations
<button className="btn text-xs py-1 px-2">Small button</button>
<button className="btn text-lg py-3 px-6">Large button</button>`}</code>
          </pre>
        </div>
      </div>

      {/* Color Palette Reference */}
      <div className="mt-12 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Color Palette Reference</h2>
        <p className="text-gray-600 mb-6">
          Here are the available shades of our primary color.
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <div className="h-16 bg-primary-50 rounded-t-md"></div>
            <div className="bg-gray-100 py-2 px-3 rounded-b-md">
              <code className="text-xs">primary-50</code>
            </div>
          </div>
          <div>
            <div className="h-16 bg-primary-100 rounded-t-md"></div>
            <div className="bg-gray-100 py-2 px-3 rounded-b-md">
              <code className="text-xs">primary-100</code>
            </div>
          </div>
          <div>
            <div className="h-16 bg-primary-200 rounded-t-md"></div>
            <div className="bg-gray-100 py-2 px-3 rounded-b-md">
              <code className="text-xs">primary-200</code>
            </div>
          </div>
          <div>
            <div className="h-16 bg-primary-300 rounded-t-md"></div>
            <div className="bg-gray-100 py-2 px-3 rounded-b-md">
              <code className="text-xs">primary-300</code>
            </div>
          </div>
          <div>
            <div className="h-16 bg-primary-400 rounded-t-md"></div>
            <div className="bg-gray-100 py-2 px-3 rounded-b-md">
              <code className="text-xs">primary-400</code>
            </div>
          </div>
          <div>
            <div className="h-16 bg-primary rounded-t-md"></div>
            <div className="bg-gray-100 py-2 px-3 rounded-b-md">
              <code className="text-xs">primary</code>
            </div>
          </div>
          <div>
            <div className="h-16 bg-primary-600 rounded-t-md"></div>
            <div className="bg-gray-100 py-2 px-3 rounded-b-md">
              <code className="text-xs">primary-600</code>
            </div>
          </div>
          <div>
            <div className="h-16 bg-primary-700 rounded-t-md"></div>
            <div className="bg-gray-100 py-2 px-3 rounded-b-md">
              <code className="text-xs">primary-700</code>
            </div>
          </div>
          <div>
            <div className="h-16 bg-primary-800 rounded-t-md"></div>
            <div className="bg-gray-100 py-2 px-3 rounded-b-md">
              <code className="text-xs">primary-800</code>
            </div>
          </div>
          <div>
            <div className="h-16 bg-primary-900 rounded-t-md"></div>
            <div className="bg-gray-100 py-2 px-3 rounded-b-md">
              <code className="text-xs">primary-900</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ButtonExample; 