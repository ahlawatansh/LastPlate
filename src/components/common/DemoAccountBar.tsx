import React from 'react';
import { motion } from 'motion/react';
import { ShoppingBag, UtensilsCrossed, Bike, Building2, LogIn, LogOut } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';

interface DemoAccountBarProps {
  onOpenAuth?: () => void;
  onLogout?: () => void;
}

export const DemoAccountBar: React.FC<DemoAccountBarProps> = ({ onOpenAuth, onLogout }) => {
  const { currentUser, quickLoginDemo, logout } = useApp();

  const accounts: {
    role: UserRole;
    name: string;
    email: string;
    icon: React.ReactNode;
  }[] = [
    {
      role: 'CUSTOMER',
      name: 'Customer',
      email: 'customer@lastplate.demo',
      icon: <ShoppingBag className="w-3.5 h-3.5" />,
    },
    {
      role: 'RESTAURANT',
      name: 'Restaurant',
      email: 'restaurant@lastplate.demo',
      icon: <UtensilsCrossed className="w-3.5 h-3.5" />,
    },
    {
      role: 'DELIVERY',
      name: 'Delivery',
      email: 'delivery@lastplate.demo',
      icon: <Bike className="w-3.5 h-3.5" />,
    },
    {
      role: 'ADMIN',
      name: 'Admin',
      email: 'admin@lastplate.demo',
      icon: <Building2 className="w-3.5 h-3.5" />,
    },
  ];

  const isDemoAccount = Boolean(
    currentUser && (
      currentUser.id === 'user-customer-1' ||
      currentUser.id === 'user-restaurant-1' ||
      currentUser.id === 'user-delivery-1' ||
      currentUser.id === 'user-admin-1' ||
      currentUser.email?.endsWith('@lastplate.demo')
    )
  );

  const isRealUserLoggedIn = Boolean(currentUser && !isDemoAccount);

  const handleLoginClick = () => {
    if (onOpenAuth) {
      onOpenAuth();
    } else {
      logout();
    }
  };

  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout();
    } else if (onOpenAuth) {
      onOpenAuth();
    } else {
      logout();
    }
  };

  const isAuthActive = !currentUser;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-fit flex items-center gap-2">
      {/* 4 Portals Container: Clean border, no shadow drop */}
      <div className="bg-white rounded-full border border-slate-200/90 p-1 flex items-center justify-center gap-1 flex-nowrap whitespace-nowrap h-11 relative">
        {accounts.map((acc) => {
          const isActive = isDemoAccount && currentUser?.role === acc.role;
          return (
            <button
              key={acc.role}
              onClick={() => quickLoginDemo(acc.role)}
              className={`relative flex items-center gap-1.5 text-xs font-bold transition-colors duration-200 border-0 cursor-pointer shrink-0 h-9 rounded-full px-4 z-10 ${
                isActive
                  ? 'text-white'
                  : 'text-zinc-600 hover:text-black hover:bg-slate-100/70'
              }`}
              title={`Switch to ${acc.name} (${acc.email})`}
            >
              {isActive && (
                <motion.div
                  layoutId="activePortalPill"
                  className="absolute inset-0 bg-[#18181B] rounded-full ring-[5px] ring-[#18181B] -z-10"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}
              {acc.icon}
              <span>{acc.name}</span>
            </button>
          );
        })}
      </div>

      {/* Login or Logout Button */}
      {isRealUserLoggedIn ? (
        <button
          onClick={handleLogoutClick}
          className="flex items-center gap-1.5 px-4 h-11 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap border border-slate-200/90 bg-white text-zinc-900 hover:bg-slate-50 hover:text-black"
          title="Log out and return to login"
        >
          <LogOut className="w-3.5 h-3.5 text-zinc-800" />
          <span>Logout</span>
        </button>
      ) : (
        <button
          onClick={handleLoginClick}
          className={`flex items-center gap-1.5 px-4 h-11 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
            isAuthActive
              ? 'bg-[#18181B] text-white border border-[#18181B]'
              : 'border border-slate-200/90 bg-white text-zinc-900 hover:bg-slate-50'
          }`}
          title={currentUser ? 'Switch to login screen' : 'Sign in to account'}
        >
          <LogIn className={`w-3.5 h-3.5 ${isAuthActive ? 'text-white' : 'text-zinc-800'}`} />
          <span>Login</span>
        </button>
      )}
    </div>
  );
};
