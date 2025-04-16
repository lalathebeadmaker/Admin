import { ReactNode, useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const isActive = (path: string) => location.pathname === path;

  const menuItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/products', label: 'Products' },
    { path: '/purchases', label: 'Purchases' },
    { path: '/raw-materials', label: 'Raw Materials' },
    { path: '/labor', label: 'Labor Costs' },
    { path: '/orders', label: 'Orders' },
    { path: '/shipping', label: 'Shipping' },
  ];

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center">
            <span className="text-lg font-bold text-primary">Lala The Beadmaker</span>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {menuItems.map((item) => (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        className={`group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 ${
                          isActive(item.path)
                            ? 'bg-primary-50 text-primary'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-primary'
                        }`}
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Mobile header and sidebar */}
      <div className="sticky top-0 z-40 flex items-center gap-x-6 bg-white px-4 py-4 shadow-sm sm:px-6 lg:hidden">
        <button
          type="button"
          className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
          onClick={toggleSidebar}
        >
          <span className="sr-only">Open sidebar</span>
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
          </svg>
        </button>
        <div className="flex-1">
          <span className="text-lg font-bold text-primary">Lala The Beadmaker</span>
        </div>
        <div ref={dropdownRef} className="relative">
          <button
            type="button"
            className="flex items-center gap-x-1 text-sm font-semibold leading-6 text-gray-900"
            onClick={toggleDropdown}
          >
            <span className="h-8 w-8 rounded-full bg-primary-50 flex items-center justify-center">
              <span className="text-primary font-medium text-sm">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </span>
            </span>
          </button>
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2.5 w-32 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
              <button
                onClick={() => {
                  signOut();
                  setIsDropdownOpen(false);
                }}
                className="block w-full px-3 py-1 text-left text-sm leading-6 text-gray-900 hover:bg-gray-50"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile sidebar */}
      <div
        className={`relative lg:hidden ${
          isSidebarOpen ? '' : 'pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div
          className={`fixed inset-0 bg-gray-900/80 backdrop-blur-sm transition-opacity duration-300 ${
            isSidebarOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={toggleSidebar}
        />

        {/* Sliding sidebar */}
        <div
          className={`fixed inset-y-0 left-0 z-50 w-72 bg-white transform transition duration-300 ease-in-out ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex h-16 shrink-0 items-center gap-x-6 px-6 border-b border-gray-200">
            <span className="text-lg font-bold text-primary">Menu</span>
            <button
              type="button"
              className="-m-2.5 p-2.5 text-gray-700"
              onClick={toggleSidebar}
            >
              <span className="sr-only">Close sidebar</span>
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <nav className="flex flex-1 flex-col px-6 pt-4">
            <ul role="list" className="flex flex-1 flex-col gap-y-4">
              {menuItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 ${
                      isActive(item.path)
                        ? 'bg-primary-50 text-primary'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-primary'
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
} 