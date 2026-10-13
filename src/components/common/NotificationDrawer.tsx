import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell,
  X,
  ShoppingBag,
  ShieldCheck,
  CheckCheck,
  Trash2,
  Inbox,
  ArrowRight,
  Bike,
  UtensilsCrossed,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { NotificationItem, UserRole } from '../../types';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
}) => {
  const {
    notifications,
    currentUser,
    markAllNotificationsAsRead,
    clearAllNotifications,
  } = useApp();

  const activePortal = currentUser?.role || 'CUSTOMER';

  const isDemoUser =
    currentUser?.id === 'user-customer-1' ||
    currentUser?.id === 'user-restaurant-1' ||
    currentUser?.id === 'user-delivery-1' ||
    currentUser?.id === 'user-admin-1' ||
    currentUser?.email?.endsWith('@lastplate.demo');

  // Filter notifications strictly by active portal
  const portalNotifs = notifications.filter((n) => {
    if (!currentUser) return false;
    if (!isDemoUser) {
      return n.userId === currentUser.id;
    }
    if (n.role) return n.role === activePortal;
    // Fallback heuristic if role wasn't set
    if (activePortal === 'CUSTOMER') return n.type === 'ORDER' || n.type === 'SURPLUS';
    if (activePortal === 'RESTAURANT') return n.type === 'ORDER' || n.type === 'FORECAST';
    if (activePortal === 'DELIVERY') return n.type === 'ORDER';
    if (activePortal === 'ADMIN') return n.type === 'APPROVAL' || n.type === 'FORECAST';
    return true;
  });

  const unreadCount = portalNotifs.filter((n) => !n.read).length;

  const handleActionClick = (notif: NotificationItem) => {
    if (onNavigateTab) {
      if (notif.type === 'ORDER') {
        if (activePortal === 'CUSTOMER') onNavigateTab('orders');
        else if (activePortal === 'RESTAURANT') onNavigateTab('kitchen');
        else if (activePortal === 'DELIVERY') onNavigateTab('pool');
        else if (activePortal === 'ADMIN') onNavigateTab('orders');
      } else if (notif.type === 'APPROVAL') {
        if (activePortal === 'ADMIN') onNavigateTab('approvals');
      } else if (notif.type === 'SURPLUS') {
        if (activePortal === 'CUSTOMER') onNavigateTab('surplus');
        else if (activePortal === 'RESTAURANT') onNavigateTab('surplus_mgmt');
      } else if (notif.type === 'FORECAST') {
        if (activePortal === 'RESTAURANT') onNavigateTab('forecast');
        else if (activePortal === 'ADMIN') onNavigateTab('benchmarks');
      }
    }
    onClose();
  };

  const formatTimestamp = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
      if (diffSec < 60) return 'Just now';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return `${diffHr}h ago`;
      return date.toLocaleDateString();
    } catch {
      return 'Recently';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop with smooth fade */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/35 backdrop-blur-md cursor-pointer"
            onClick={onClose}
          />

          {/* Drawer with smooth slide from right */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 350 }}
            className="relative w-full max-w-md bg-white h-full flex flex-col justify-between z-10 shadow-2xl"
          >
        
        {/* Top Header - Minimalist Black & White */}
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-zinc-100 text-zinc-900 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-zinc-900 font-heading">Live Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-zinc-900 text-white text-[10px] font-bold">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-400 font-normal">
                Active alerts for {activePortal.toLowerCase()} portal
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-900 rounded-full hover:bg-zinc-100 transition-colors cursor-pointer"
            title="Close notifications"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notifications Body List - Minimalist Black & White, Separated by lines */}
        <div className="flex-1 overflow-y-auto px-6 divide-y divide-zinc-100">
          {portalNotifs.length === 0 ? (
            <div className="text-center py-24 space-y-2">
              <div className="w-12 h-12 rounded-full bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto mb-2">
                <Inbox className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-zinc-800 font-heading">No notifications</p>
              <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                No active notifications in {activePortal.toLowerCase()} portal feed right now.
              </p>
            </div>
          ) : (
            portalNotifs.map((n) => (
              <div
                key={n.id}
                className="py-4 space-y-1.5 transition-colors group hover:bg-zinc-50/50 -mx-6 px-6"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {!n.read && (
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-950 shrink-0" />
                    )}
                    <h4 className={`text-xs font-bold text-zinc-900 font-heading ${!n.read ? 'font-extrabold' : ''}`}>
                      {n.title}
                    </h4>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-medium whitespace-nowrap">
                    {formatTimestamp(n.createdAt)}
                  </span>
                </div>

                <p className="text-xs text-zinc-500 leading-relaxed font-normal pl-3.5">
                  {n.message}
                </p>

                <div className="flex items-center justify-between pt-1 pl-3.5 text-[11px]">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    {n.type}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleActionClick(n)}
                    className="text-zinc-900 hover:text-black font-bold flex items-center gap-1 cursor-pointer hover:underline text-xs"
                  >
                    View <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer with Actions */}
        <div className="p-6 border-t border-zinc-100 bg-white space-y-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={markAllNotificationsAsRead}
              disabled={unreadCount === 0}
              className="flex-1 py-2.5 px-4 rounded-full bg-[#18181B] text-white hover:bg-black text-xs font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-30 cursor-pointer"
            >
              <CheckCheck className="w-4 h-4" /> Mark All Read
            </button>

            <button
              type="button"
              onClick={clearAllNotifications}
              disabled={portalNotifs.length === 0}
              className="py-2.5 px-4 rounded-full text-zinc-500 hover:text-black hover:bg-zinc-100 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-30 cursor-pointer"
              title="Clear notifications"
            >
              <Trash2 className="w-4 h-4" /> Clear
            </button>
          </div>
        </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
