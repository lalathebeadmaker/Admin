import { useAuth } from '../../contexts/AuthContext';

export default function Header() {
  const { user, signOut } = useAuth();

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4">
      <div className="flex items-center">
        <h2 className="text-lg font-medium text-gray-900">Welcome, {user?.email}</h2>
      </div>
      <div className="flex items-center">
        <button
          onClick={signOut}
          className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        >
          Sign out
        </button>
      </div>
    </header>
  );
} 