import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  CubeIcon,
  ClipboardDocumentListIcon,
  TruckIcon,
  ShoppingCartIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Raw Materials', href: '/raw-materials', icon: CubeIcon },
  { name: 'Products', href: '/products', icon: ClipboardDocumentListIcon },
  { name: 'Orders', href: '/orders', icon: ShoppingCartIcon },
  { name: 'Shipping', href: '/shipping', icon: TruckIcon },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <div className="flex h-full w-64 flex-col bg-white">
      <div className="flex h-16 items-center justify-center border-b border-gray-200">
        <h1 className="text-xl font-semibold text-gray-900">Admin Panel</h1>
      </div>
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`group flex items-center rounded-md px-2 py-2 text-sm font-medium ${
                isActive
                  ? 'bg-primary-100 text-primary-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon
                className={`mr-3 h-6 w-6 flex-shrink-0 ${
                  isActive
                    ? 'text-primary-900'
                    : 'text-gray-400 group-hover:text-gray-500'
                }`}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
} 