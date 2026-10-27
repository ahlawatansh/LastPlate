import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  UtensilsCrossed,
  Tag,
  ShoppingBag,
  Leaf,
  Flame,
  Layers,
  Bike,
  ShieldCheck,
  TrendingUp,
  Bell,
  Search,
  X,
  User,
  Building2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { NotificationDrawer } from './NotificationDrawer';

interface HeaderProps {
  onOpenCart?: () => void;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenCart, activeTab = 'menu', setActiveTab }) => {
  const {
    currentUser,
    authenticatedUser,
    activePortal,
    switchToPortal,
    cart,
    notifications,
    searchQuery,
    setSearchQuery,
    surplusListings,
  } = useApp();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const roleNotifs = notifications.filter((n) => {
    if (!currentUser) return false;
    const isDemoUser =
      currentUser.id === 'user-customer-1' ||
      currentUser.id === 'user-restaurant-1' ||
      currentUser.id === 'user-delivery-1' ||
      currentUser.id === 'user-admin-1' ||
      currentUser.email?.endsWith('@lastplate.demo');
    if (!isDemoUser) {
      return n.userId === currentUser.id;
    }
    if (currentUser.role === 'CUSTOMER') return n.role === 'CUSTOMER' || !n.role;
    if (currentUser.role === 'RESTAURANT') return n.role === 'RESTAURANT';
    if (currentUser.role === 'DELIVERY') return n.role === 'DELIVERY';
    if (currentUser.role === 'ADMIN') return n.role === 'ADMIN';
    return true;
  });
  const unreadCount = roleNotifs.filter((n) => !n.read).length;

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
  };

  const getFirstName = () => {
    if (currentUser?.name) return currentUser.name;
    if (currentUser?.email) return currentUser.email.split('@')[0];
    return 'Account Holder';
  };

  const getRoleIcon = () => {
    switch (currentUser?.role) {
      case 'CUSTOMER':
        return <User className="w-4 h-4 text-white" />;
      case 'RESTAURANT':
        return <UtensilsCrossed className="w-4 h-4 text-white" />;
      case 'DELIVERY':
        return <Bike className="w-4 h-4 text-white" />;
      case 'ADMIN':
        return <Building2 className="w-4 h-4 text-white" />;
      default:
        return <User className="w-4 h-4 text-white" />;
    }
  };

  const getSearchConfig = () => {
    switch (currentUser?.role) {
      case 'CUSTOMER':
        return {
          placeholder: 'Search dishes & deals...',
          subtitle: 'Discover fresh kitchen specials and dynamic closing surplus deals',
        };
      case 'RESTAURANT':
        return {
          placeholder: 'Search orders & catalog...',
          subtitle: 'Live kitchen orders, dynamic surplus inventory and AI demand forecasting',
        };
      case 'DELIVERY':
        return {
          placeholder: 'Search trips & orders...',
          subtitle: 'Active courier dispatch pool and route simulation',
        };
      case 'ADMIN':
        return {
          placeholder: 'Search partners & logs...',
          subtitle: 'Partner governance, platform compliance and audit trail',
        };
      default:
        return {
          placeholder: 'Search...',
          subtitle: 'Welcome to LastPlate',
        };
    }
  };

  const getPortalTabs = () => {
    if (!currentUser) return [];

    switch (currentUser.role) {
      case 'CUSTOMER':
        return [
          {
            id: 'menu',
            label: 'Menu & Order',
            icon: UtensilsCrossed,
          },
          {
            id: 'surplus',
            label: 'Surplus Rescue',
            icon: Tag,
            badge: surplusListings.filter((s) => s.status === 'AVAILABLE').length > 0 ? `${surplusListings.filter((s) => s.status === 'AVAILABLE').length}` : undefined,
          },
          {
            id: 'orders',
            label: 'My Orders',
            icon: ShoppingBag,
          },
          {
            id: 'impact',
            label: 'Rescue Impact',
            icon: Leaf,
          },
        ];

      case 'RESTAURANT':
        return [
          {
            id: 'kitchen',
            label: 'Live Kitchen',
            icon: Flame,
          },
          {
            id: 'surplus_mgmt',
            label: 'Surplus Inventory',
            icon: Layers,
          },
          {
            id: 'menu_mgmt',
            label: 'Menu Items',
            icon: UtensilsCrossed,
          },
          {
            id: 'forecast',
            label: 'AI Forecast Studio',
            icon: TrendingUp,
          },
        ];

      case 'DELIVERY':
        return [
          {
            id: 'pool',
            label: 'Available Pool',
            icon: Bike,
          },
          {
            id: 'active',
            label: 'Active Delivery',
            icon: UtensilsCrossed,
          },
          {
            id: 'history',
            label: 'Earnings & Trips',
            icon: TrendingUp,
          },
        ];

      case 'ADMIN':
        return [
          {
            id: 'approvals',
            label: 'Approvals Queue',
            icon: ShieldCheck,
          },
          {
            id: 'orders',
            label: 'All Orders',
            icon: ShoppingBag,
          },
          {
            id: 'forecast_benchmarks',
            label: '3-Yr ML Benchmarks',
            icon: TrendingUp,
          },
          {
            id: 'impact',
            label: 'Audit',
            icon: ShieldCheck,
          },
        ];

      default:
        return [];
    }
  };

  const portalTabs = getPortalTabs();

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="h-16 flex items-center justify-between gap-2 sm:gap-4">

            {/* Left: Brand Logo */}
            <div className="flex items-center shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (authenticatedUser) {
                    switchToPortal(authenticatedUser.role === 'DELIVERY' ? 'DELIVERY' : 'CUSTOMER');
                  } else {
                    switchToPortal('AUTH');
                  }
                }}
                className="flex items-center group select-none hover:opacity-90 transition-opacity cursor-pointer bg-transparent border-0 p-0"
              >
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight font-heading lowercase">
                  <span className="text-slate-950 font-extrabold">last</span>
                  <span className="text-[#1B4332] font-black">plate</span>
                </span>
              </button>
            </div>

            {/* Middle: Top Navbar between Logo and Notification Button */}
            {currentUser && setActiveTab && (
              <nav className="hidden lg:flex flex-1 items-center justify-center gap-4 sm:gap-5 lg:gap-6 py-1 px-2 min-w-0 scroll-smooth">
                {portalTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative px-2.5 py-1 pb-1.5 text-[11px] sm:text-xs transition-colors duration-150 cursor-pointer flex items-center gap-1.5 shrink-0 select-none ${
                        isActive
                          ? 'text-slate-950 font-bold border-b-2 border-slate-950'
                          : 'text-slate-500 font-normal hover:text-slate-900 border-b-2 border-transparent'
                      }`}
                    >
                      <Icon className={`w-3 h-3 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                      <span>{tab.label}</span>
                      {tab.badge && (
                        <span className={`text-[10px] ml-1 ${isActive ? 'text-slate-950 font-bold' : 'text-slate-400 font-normal'}`}>
                          ({tab.badge})
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            )}

            {/* Right: Notifications, Cart, Profile & Logout */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">

              {currentUser && (
                <button
                  type="button"
                  onClick={() => setShowNotifDrawer(true)}
                  className="w-9 h-9 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 flex items-center justify-center transition-colors cursor-pointer relative"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
                  )}
                </button>
              )}

              {currentUser?.role === 'CUSTOMER' && onOpenCart && (
                <button
                  type="button"
                  onClick={onOpenCart}
                  className="h-9 px-3.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer text-xs font-bold"
                  title="View Basket"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Basket</span>
                  {cartItemCount > 0 && (
                    <span className="text-xs font-black text-black ml-0.5">
                      ({cartItemCount})
                    </span>
                  )}
                </button>
              )}

              {currentUser && (
                <div className="flex items-center gap-2 sm:pr-1 rounded-full select-none cursor-default">
                  <div className="w-8 h-8 rounded-full bg-[#18181B] text-white flex items-center justify-center shrink-0 select-none shadow-xs border border-zinc-900/10">
                    {getRoleIcon()}
                  </div>
                  <div className="text-left hidden sm:block">
                    <div className="text-xs font-black text-slate-900 leading-tight truncate max-w-[140px]">
                      {currentUser.name || currentUser.email?.split('@')[0] || 'Account Holder'}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium leading-none truncate max-w-[140px] mt-0.5">
                      {currentUser.email}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {currentUser && setActiveTab && (
            <div className="lg:hidden py-2 border-t border-slate-100 overflow-x-auto scrollbar-none flex items-center gap-3.5 scroll-smooth">
              {portalTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-2.5 py-1 pb-1.5 text-[11px] transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
                      isActive
                        ? 'text-slate-950 font-bold border-b-2 border-slate-950'
                        : 'text-slate-500 font-normal hover:text-slate-900 border-b-2 border-transparent'
                    }`}
                  >
                    <Icon className={`w-3 h-3 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                    <span>{tab.label}</span>
                    {tab.badge && (
                      <span className={`text-[10px] ml-1 ${isActive ? 'text-slate-950 font-bold' : 'text-slate-400 font-normal'}`}>
                        ({tab.badge})
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </header>

      {currentUser && (
        <section className="bg-transparent border-b border-slate-100/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-7 sm:pt-9 pb-3.5 sm:pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">

            <div>
              <h1 className="text-2xl sm:text-3xl font-normal text-slate-800 tracking-tight font-heading">
                Hello, <span className="font-extrabold text-slate-950">{getFirstName()}</span>
              </h1>
              <p className="text-xs text-zinc-500 font-light mt-0.5">
                {getSearchConfig().subtitle}
              </p>
            </div>

            <div className="w-full md:w-auto md:min-w-[360px] lg:min-w-[420px] max-w-md md:ml-auto">
              <div className="relative w-full">
                <div className="flex items-center bg-white border border-zinc-200/90 hover:border-zinc-300 focus-within:border-black rounded-full pl-3.5 pr-2.5 py-1.5 transition-all">
                  <Search className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder={getSearchConfig().placeholder}
                    className="w-full text-xs font-normal text-slate-800 bg-transparent outline-none placeholder:text-slate-400 placeholder:text-xs placeholder:font-light"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer"
                      title="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <NotificationDrawer
        isOpen={showNotifDrawer}
        onClose={() => setShowNotifDrawer(false)}
        onNavigateTab={setActiveTab}
      />
    </>
  );
};
