import React from 'react';
import { motion } from 'motion/react';
import { ShoppingBag, UtensilsCrossed, Bike, Building2, LogIn, LogOut } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';

interface DemoAccountBarProps {
  onOpenAuth?: (role?: UserRole) => void;
  onLogout?: () => void;
}

export const DemoAccountBar: React.FC<DemoAccountBarProps> = ({ onOpenAuth, onLogout }) => {
  const { authenticatedUser, activePortal, switchToPortal, logout } = useApp();

  const accounts: {
    role: UserRole;
    name: string;
    icon: React.ReactNode;
    title: string;
  }[] = [];

  // When logged in, add customer or delivery partner as first item
  if (authenticatedUser) {
    if (authenticatedUser.role === 'CUSTOMER') {
      accounts.push({
        role: 'CUSTOMER',
        name: authenticatedUser.name ? `Customer (${authenticatedUser.name.split(' ')[0]})` : 'Customer',
        icon: <ShoppingBag className="w-3.5 h-3.5" />,
        title: `Logged in as Customer: ${authenticatedUser.email}`,
      });
    } else if (authenticatedUser.role === 'DELIVERY') {
      accounts.push({
        role: 'DELIVERY',
        name: authenticatedUser.name ? `Delivery (${authenticatedUser.name.split(' ')[0]})` : 'Delivery Partner',
        icon: <Bike className="w-3.5 h-3.5" />,
        title: `Logged in as Delivery Partner: ${authenticatedUser.email}`,
      });
    }
  }

  // Restaurant and Admin show ALWAYS!
  accounts.push({
    role: 'RESTAURANT',
    name: 'Restaurant',
    icon: <UtensilsCrossed className="w-3.5 h-3.5" />,
    title: 'Restaurant Portal (Kitchen & Surplus Management)',
  });

  accounts.push({
    role: 'ADMIN',
    name: 'Admin',
    icon: <Building2 className="w-3.5 h-3.5" />,
    title: 'Admin Governance & Approvals Portal',
  });

  const handleAccountClick = (role: UserRole) => {
    switchToPortal(role);
  };

  const handleLoginClick = () => {
    if (onOpenAuth) {
      onOpenAuth();
    } else {
      switchToPortal('AUTH');
    }
  };

  const isAuthActive = activePortal === 'AUTH';

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-fit flex items-center gap-2">
      <div className="bg-white rounded-full border border-slate-200/90 p-1 flex items-center justify-center gap-1 flex-nowrap whitespace-nowrap h-11 relative">
        {accounts.map((acc) => {
          const isActive = activePortal === acc.role;
          return (
            <button
              key={acc.role}
              onClick={() => handleAccountClick(acc.role)}
              className={`relative flex items-center gap-1.5 text-xs font-bold transition-colors duration-200 border-0 cursor-pointer shrink-0 h-9 rounded-full px-4 z-10 ${
                isActive
                  ? 'text-white'
                  : 'text-zinc-600 hover:text-black hover:bg-slate-100/70'
              }`}
              title={acc.title}
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

      {authenticatedUser ? (
        <button
          onClick={() => {
            if (onLogout) {
              onLogout();
            } else {
              logout();
            }
          }}
          className="flex items-center gap-1.5 px-4 h-11 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap border border-slate-200/90 bg-white text-zinc-800 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200"
          title={`Log out of ${authenticatedUser.email}`}
        >
          <LogOut className="w-3.5 h-3.5 text-zinc-700" />
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
          title="Sign in to account"
        >
          <LogIn className={`w-3.5 h-3.5 ${isAuthActive ? 'text-white' : 'text-zinc-800'}`} />
          <span>Login</span>
        </button>
      )}
    </div>
  );
};
