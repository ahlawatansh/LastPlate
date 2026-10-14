import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  UtensilsCrossed,
  Tag,
  ShoppingBag,
  Leaf,
  Flame,
  Calendar,
  Layers,
  Bike,
  ShieldCheck,
  TrendingUp,
  Bell,
  Search,
  X,
  SlidersHorizontal,
  LogOut,
  RotateCcw,
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
    logout,
    cart,
    notifications,
    searchQuery,
    setSearchQuery,
    resetDemoData,
    surplusListings,
  } = useApp();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const [filterVegOnly, setFilterVegOnly] = useState(false);
  const [filterSurplusOnly, setFilterSurplusOnly] = useState(false);

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

  const getMonogram = () => {
    if (currentUser?.name) {
      const parts = currentUser.name.trim().split(/\s+/).filter(Boolean);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return parts[0].slice(0, 2).toUpperCase();
    }
    if (currentUser?.email) {
      return currentUser.email.charAt(0).toUpperCase();
    }
    return 'LP';
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
            id: 'schedule',
            label: "Today's Schedule & Accuracy",
            icon: Calendar,
          },
          {
            id: 'forecast',
            label: 'AI Forecast Studio',
            icon: TrendingUp,
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
            label: 'Rescue Impact',
            icon: Leaf,
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

          <div className="h-16 flex items-center justify-between gap-3 sm:gap-6">

            <div className="flex items-center gap-6 sm:gap-8 min-w-0">

              <div className="flex items-center shrink-0">
                <a
                  href="/"
                  className="flex items-center group select-none hover:opacity-90 transition-opacity"
                >
                  <span className="text-2xl sm:text-3xl font-extrabold tracking-tight font-heading lowercase">
                    <span className="text-slate-950 font-extrabold">last</span>
                    <span className="text-[#1B4332] font-black">plate</span>
                  </span>
                </a>
              </div>

              {currentUser && setActiveTab && (
                <nav className="hidden lg:flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 relative">
                  {portalTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`relative px-4 py-2 text-xs font-semibold rounded-full transition-colors duration-200 cursor-pointer flex items-center gap-1.5 shrink-0 z-10 ${
                          isActive
                            ? 'text-white font-bold'
                            : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100/70'
                        }`}
                      >
                        {isActive && (
                          <motion.div
                            layoutId={`headerActiveTabPill-${currentUser?.role}`}
                            className="absolute inset-0 bg-[#18181B] rounded-full -z-10"
                            transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                          />
                        )}
                        <Icon className="w-3.5 h-3.5" />
                        <span>{tab.label}</span>
                        {tab.badge && (
                          <span className={`text-xs font-black ml-2 ${isActive ? 'text-white' : 'text-slate-900'}`}>
                            ({tab.badge})
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              )}
            </div>

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
                    <span className="absolute top-1.5 right-2.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
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

              {currentUser ? (
                <div className="flex items-center gap-2.5 p-1 sm:pr-2 rounded-full select-none cursor-default">
                  <div className="w-8 h-8 rounded-full bg-[#18181B] text-white font-black text-xs flex items-center justify-center shrink-0 tracking-wider select-none shadow-xs border border-zinc-900/10">
                    {getMonogram()}
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-black text-slate-900 leading-tight truncate max-w-[150px]">
                      {currentUser.name || currentUser.email?.split('@')[0] || 'Account Holder'}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium leading-none truncate max-w-[150px] mt-0.5">
                      {currentUser.email}
                    </div>
                  </div>
                </div>
              ) : (
                <a
                  href="/login"
                  className="px-4 py-1.5 text-xs font-bold rounded-full bg-[#18181B] text-white hover:bg-black transition-colors"
                >
                  Sign In
                </a>
              )}
            </div>
          </div>

          {currentUser && setActiveTab && (
            <div className="lg:hidden py-2 border-t border-slate-100 overflow-x-auto scrollbar-none flex items-center gap-1">
              {portalTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                      isActive
                        ? 'bg-[#18181B] text-white font-bold'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                    {tab.badge && (
                      <span className={`text-[11px] font-black ml-1.5 ${isActive ? 'text-white' : 'text-slate-900'}`}>
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">

            <div>
              <h1 className="text-2xl sm:text-3xl font-normal text-slate-800 tracking-tight font-heading">
                Hello, <span className="font-extrabold text-slate-950">{getFirstName()}</span>
              </h1>
              <p className="text-xs text-zinc-500 font-light mt-0.5">
                Welcome to LastPlate
              </p>
            </div>

            <div className="w-full md:w-auto md:min-w-[480px] lg:min-w-[560px] max-w-2xl">
              <div className="relative">
                <div className="flex items-center bg-white border border-zinc-200 hover:border-zinc-400 focus-within:border-black rounded-full pl-4 pr-1.5 py-1.5 transition-all">
                  <Search className="w-4 h-4 text-slate-400 shrink-0 mr-2.5 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Search dishes, orders, surplus deals..."
                    className="w-full text-xs sm:text-sm font-medium text-slate-900 bg-transparent outline-none placeholder:text-slate-400"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer mr-1"
                      title="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                    className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors cursor-pointer shrink-0"
                    title="Filters"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                  </button>
                </div>

                {showFilterDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-40 cursor-default"
                      onClick={() => setShowFilterDropdown(false)}
                    />
                    <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-2xl border border-slate-200 p-4 z-50 shadow-xl transition-all">
                    <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
                      <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider font-heading">
                        Filters
                      </h4>
                      <button
                        type="button"
                        onClick={() => setShowFilterDropdown(false)}
                        className="text-slate-400 hover:text-slate-600 p-1 rounded-full"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-3">
                      <label className="flex items-center justify-between text-xs font-semibold text-slate-700 cursor-pointer">
                        <span>Pure Vegetarian Only</span>
                        <input
                          type="checkbox"
                          checked={filterVegOnly}
                          onChange={(e) => setFilterVegOnly(e.target.checked)}
                          className="w-4 h-4 rounded text-emerald-600 accent-[#1B4332]"
                        />
                      </label>
                      <label className="flex items-center justify-between text-xs font-semibold text-slate-700 cursor-pointer">
                        <span>Surplus Deals Only</span>
                        <input
                          type="checkbox"
                          checked={filterSurplusOnly}
                          onChange={(e) => setFilterSurplusOnly(e.target.checked)}
                          className="w-4 h-4 rounded text-amber-600 accent-amber-500"
                        />
                      </label>
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => {
                            setFilterVegOnly(false);
                            setFilterSurplusOnly(false);
                            setShowFilterDropdown(false);
                          }}
                          className="text-[11px] font-bold text-slate-500 hover:text-slate-800 rounded-full px-2 py-1"
                        >
                          Reset
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowFilterDropdown(false)}
                          className="px-4 py-1.5 rounded-full bg-[#18181B] text-white text-xs font-bold hover:bg-black"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
              </div>
            </div>
          </div>
        </section>
      )}

      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 font-heading">Reset Demo Data?</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              This will restore fresh seed items, reset sample orders, and restore default accounts.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2.5 rounded-full border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  resetDemoData();
                  setShowResetConfirm(false);
                }}
                className="flex-1 py-2.5 rounded-full bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 cursor-pointer"
              >
                Reset Now
              </button>
            </div>
          </div>
        </div>
      )}

      <NotificationDrawer
        isOpen={showNotifDrawer}
        onClose={() => setShowNotifDrawer(false)}
        onNavigateTab={setActiveTab}
      />
    </>
  );
};
