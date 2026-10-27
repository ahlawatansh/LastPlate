import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  UtensilsCrossed,
  TrendingUp,
  Clock,
  Calendar,
  Sliders,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Plus,
  Trash2,
  Edit2,
  DollarSign,
  Package,
  Layers,
  HelpCircle,
  ChevronRight,
  Flame,
  Check,
  Building2,
  Bike,
  X,
  ArrowDownLeft,
  Minus,
  Tag,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  MenuItem,
  OrderStatus,
  Order,
  WhatIfScenarioParameters,
} from '../../types';
import {
  calculateSuggestedForecast,
  INDIAN_FESTIVALS,
} from '../../services/historicalDataEngine';

interface RestaurantPortalProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const RestaurantPortal: React.FC<RestaurantPortalProps> = ({
  activeTab,
  setActiveTab,
}) => {
  const {
    currentUser,
    menuItems,
    orders,
    surplusListings,
    historyRecords,
    accuracyEvaluation,
    whatIfParams,
    setWhatIfParams,
    addRestaurantOrder,
    restaurantAcceptOrder,
    restaurantRejectOrder,
    restaurantStartPrep,
    restaurantMarkReady,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    createSurplusListing,
    updateSurplusListing,
    searchQuery,
    addNotification,
  } = useApp();

  const [showAddOrderModal, setShowAddOrderModal] = useState(false);
  const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKEAWAY' | 'DELIVERY'>('DELIVERY');
  const [orderCustomerName, setOrderCustomerName] = useState('Walk-in Guest');
  const [orderCustomerPhone, setOrderCustomerPhone] = useState('+91 98765 43210');
  const [orderTableOrAddress, setOrderTableOrAddress] = useState('Table 4');
  const [orderNotes, setOrderNotes] = useState('');
  const [orderPaymentMethod, setOrderPaymentMethod] = useState<'UPI' | 'CARD' | 'COD'>('UPI');
  const [selectedItemsMap, setSelectedItemsMap] = useState<Record<string, number>>({});
  const [orderError, setOrderError] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [selectedMealPeriod, setSelectedMealPeriod] = useState<'BREAKFAST' | 'LUNCH' | 'EVENING' | 'DINNER'>('DINNER');

  const [showAddMenuModal, setShowAddMenuModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<'Rolls & Wraps' | 'Bowls & Thalis' | 'Chaat & Cafe Bites' | 'Brews & Desserts'>('Rolls & Wraps');
  const [newItemPrice, setNewItemPrice] = useState(210);
  const [newItemDescription, setNewItemDescription] = useState('');
  const [newItemPrepTime, setNewItemPrepTime] = useState(15);

  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [editItemName, setEditItemName] = useState('');
  const [editItemCategory, setEditItemCategory] = useState<'Rolls & Wraps' | 'Bowls & Thalis' | 'Chaat & Cafe Bites' | 'Brews & Desserts'>('Rolls & Wraps');
  const [editItemPrice, setEditItemPrice] = useState(210);
  const [editItemDescription, setEditItemDescription] = useState('');
  const [editItemPrepTime, setEditItemPrepTime] = useState(15);

  const handleOpenEditMenuItem = (item: MenuItem) => {
    setEditingMenuItem(item);
    setEditItemName(item.name);
    setEditItemCategory(item.category as any);
    setEditItemPrice(item.price);
    setEditItemDescription(item.description || '');
    setEditItemPrepTime(item.prepTimeMinutes || 15);
  };

  const handleSaveEditMenuItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMenuItem) return;
    updateMenuItem(editingMenuItem.id, {
      name: editItemName,
      category: editItemCategory,
      price: editItemPrice,
      description: editItemDescription,
      prepTimeMinutes: editItemPrepTime,
    });
    setEditingMenuItem(null);
  };

  const [showAddSurplusModal, setShowAddSurplusModal] = useState(false);
  const [surplusMenuItemId, setSurplusMenuItemId] = useState<string>(menuItems[0]?.id || '');
  const [surplusQuantity, setSurplusQuantity] = useState(8);
  const [surplusMinPrice, setSurplusMinPrice] = useState(99);

  const [editingSurplusListing, setEditingSurplusListing] = useState<any | null>(null);
  const [editSurplusName, setEditSurplusName] = useState('');
  const [editSurplusMinPrice, setEditSurplusMinPrice] = useState(0);
  const [editSurplusOriginalPrice, setEditSurplusOriginalPrice] = useState(0);
  const [editSurplusQuantity, setEditSurplusQuantity] = useState(0);
  const [editSurplusStatus, setEditSurplusStatus] = useState<'AVAILABLE' | 'SOLD_OUT' | 'EXPIRED'>('AVAILABLE');

  const [rejectingOrderId, setRejectingOrderId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('Kitchen temporarily at peak capacity');

  const forecastList = useMemo(() => {
    return calculateSuggestedForecast(
      historyRecords,
      selectedDate,
      selectedMealPeriod,
      whatIfParams
    );
  }, [historyRecords, selectedDate, selectedMealPeriod, whatIfParams]);

  const totalForecastDemand = forecastList.reduce((sum, f) => sum + f.expectedDemand, 0);
  const totalSuggestedPrep = forecastList.reduce((sum, f) => sum + f.suggestedPrepQty, 0);
  const totalExpectedRevenue = forecastList.reduce((sum, f) => sum + f.expectedRevenueInr, 0);
  const avgConfidence = Math.round(
    forecastList.reduce((sum, f) => sum + f.confidenceScore, 0) / Math.max(1, forecastList.length)
  );

  const [yearStr, monthStr, dayStr] = selectedDate.split('-');
  const selYear = parseInt(yearStr);
  const selMonth = parseInt(monthStr);
  const selDay = parseInt(dayStr);
  const activeFestival =
    INDIAN_FESTIVALS.find((f) => f.year === selYear && f.month === selMonth && f.day === selDay) ||
    INDIAN_FESTIVALS.find((f) => f.month === selMonth && f.day === selDay);

  const isDemoRest = currentUser?.email === 'restaurant@lastplate.demo';
  const currentRestId = currentUser?.restaurantProfile?.restaurantId || (isDemoRest ? 'rest-green-leaf' : `rest-${currentUser?.id}`);
  const kitchenOrders = orders.filter((o) => {
    const matchesRest = isDemoRest
      ? (o.restaurantId === currentRestId || o.restaurantId === 'rest-green-leaf')
      : (o.restaurantId === currentRestId);
    if (!matchesRest) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return o.id.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.items.some((i) => i.name.toLowerCase().includes(q)) ||
      o.orderStatus.toLowerCase().includes(q);
  });

  const myMenuItems = useMemo(() => {
    if (isDemoRest) return menuItems;
    return menuItems.filter((m) => m.restaurantId === currentRestId);
  }, [isDemoRest, menuItems, currentRestId]);

  const mySurplusListings = useMemo(() => {
    if (isDemoRest) return surplusListings;
    return surplusListings.filter((s) => s.restaurantId === currentRestId);
  }, [isDemoRest, surplusListings, currentRestId]);
  const incomingOrders = kitchenOrders.filter((o) => o.orderStatus === 'ORDER_PLACED');
  const inPrepOrders = kitchenOrders.filter((o) =>
    ['RESTAURANT_ACCEPTED', 'PREPARING'].includes(o.orderStatus)
  );
  const readyOrders = kitchenOrders.filter((o) => o.orderStatus === 'READY_FOR_PICKUP');
  const outForDeliveryOrders = kitchenOrders.filter((o) =>
    ['DELIVERY_ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(o.orderStatus)
  );
  const completedOrders = kitchenOrders.filter((o) => o.orderStatus === 'DELIVERED');

  const handleCreateKitchenOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const itemsToOrder = Object.entries(selectedItemsMap)
      .filter(([_, qty]) => qty > 0)
      .map(([itemId, qty]) => {
        const item = menuItems.find((m) => m.id === itemId);
        return {
          menuItemId: itemId,
          name: item?.name || 'Special Dish',
          price: item?.price || 150,
          quantity: qty,
        };
      });

    if (itemsToOrder.length === 0) {
      setOrderError('Please select at least 1 menu item to dispatch.');
      return;
    }
    setOrderError(null);

    const created = addRestaurantOrder({
      customerName: orderCustomerName.trim() || 'Guest',
      customerPhone: orderCustomerPhone.trim(),
      deliveryAddress: orderTableOrAddress.trim(),
      orderType,
      items: itemsToOrder,
      paymentMethod: orderPaymentMethod,
      paymentStatus: 'PAID',
      notes: orderNotes.trim(),
    });

    setShowAddOrderModal(false);
    setSelectedItemsMap({});
    setOrderNotes('');
    addNotification({
      title: 'Kitchen Order Created',
      message: `Kitchen Order #${created.id} dispatched to live prep queue!`,
      type: 'ORDER',
      role: 'RESTAURANT',
    });
  };

  const handleCreateMenuItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName) return;
    addMenuItem({
      name: newItemName,
      category: newItemCategory,
      price: Number(newItemPrice),
      description: newItemDescription || 'Fresh chef-prepared specialty.',
      prepTimeMinutes: Number(newItemPrepTime),
      isVeg: true,
      inStock: true,
      currentStock: 25,
      expectedDailyPrep: 40,
      imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80',
    });
    setShowAddMenuModal(false);
    setNewItemName('');
    setNewItemDescription('');
  };

  const handlePublishSurplus = (e: React.FormEvent) => {
    e.preventDefault();
    const item = menuItems.find((m) => m.id === surplusMenuItemId);
    if (!item) return;

    const now = new Date();
    const closing = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString();

    createSurplusListing({
      menuItemId: item.id,
      name: `Fresh ${item.name} (Closing Rescue Deal)`,
      category: item.category,
      originalPrice: item.price,
      minPrice: Number(surplusMinPrice),
      quantityAvailable: Number(surplusQuantity),
      initialQuantity: Number(surplusQuantity),
      isVeg: item.isVeg,
      closingTime: closing,
      prepTimeInfo: 'Prepared fresh this evening · Tamper proof sealed packaging',
      imageUrl: item.imageUrl,
    });

    setShowAddSurplusModal(false);
  };

  const handleOpenEditSurplus = (listing: any) => {
    setEditingSurplusListing(listing);
    setEditSurplusName(listing.name);
    setEditSurplusMinPrice(listing.minPrice);
    setEditSurplusOriginalPrice(listing.originalPrice);
    setEditSurplusQuantity(listing.quantityAvailable);
    setEditSurplusStatus(listing.status);
  };

  const handleSaveEditSurplus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSurplusListing) return;
    updateSurplusListing(editingSurplusListing.id, {
      name: editSurplusName.trim() || editingSurplusListing.name,
      minPrice: Number(editSurplusMinPrice),
      originalPrice: Number(editSurplusOriginalPrice),
      quantityAvailable: Number(editSurplusQuantity),
      status: editSurplusStatus,
    });
    setEditingSurplusListing(null);
    addNotification({
      title: 'Surplus Deal Updated',
      message: `Surplus rescue pricing and portions updated for "${editingSurplusListing.name}".`,
      type: 'SURPLUS',
      role: 'RESTAURANT',
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-5 pb-28 space-y-8">

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#1B4332] font-bold uppercase tracking-wider mb-1">
            <UtensilsCrossed className="w-4 h-4" />
            <span>Green Leaf Kitchen · Operations Console</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight font-heading">
            Kitchen Dashboard & AI Forecast Studio
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage incoming live orders, publish surplus rescue batches, and plan optimal production with 3-year historical intelligence.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs shrink-0">
          <div className="p-3 rounded-2xl bg-[#1B4332]/10 border border-[#1B4332]/20 text-center min-w-[95px]">
            <span className="text-[10px] text-[#1B4332] block uppercase font-bold">Live Orders</span>
            <span className="text-base font-extrabold text-[#1B4332]">
              {incomingOrders.length + inPrepOrders.length + readyOrders.length}
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-[#1B4332]/10 border border-[#1B4332]/20 text-center min-w-[95px]">
            <span className="text-[10px] text-[#1B4332] block uppercase font-bold">Surplus Active</span>
            <span className="text-base font-extrabold text-[#1B4332]">
              {mySurplusListings.filter((s) => s.status === 'AVAILABLE').length} deals
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-[#1B4332]/10 border border-[#1B4332]/20 text-center min-w-[95px]">
            <span className="text-[10px] text-[#1B4332] block uppercase font-bold">Today Revenue</span>
            <span className="text-base font-extrabold text-[#1B4332]">
              ₹{completedOrders.reduce((sum, o) => sum + o.finalAmount, 0) + (isDemoRest ? 1420 : 0)}
            </span>
          </div>
        </div>
      </div>

      {activeTab === 'kitchen' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 font-heading">Live Kitchen Orders</h2>
                {incomingOrders.length > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-[#1B4332]/10 text-[#1B4332] text-[11px] font-bold">
                    {incomingOrders.length} New Incoming
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-500 font-medium">
                Orders dispatch to the shared delivery pool once packed and ready
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                if (menuItems.length > 0 && Object.keys(selectedItemsMap).length === 0) {
                  setSelectedItemsMap({ [menuItems[0].id]: 1 });
                }
                setShowAddOrderModal(true);
              }}
              className="px-4 py-2.5 rounded-full bg-[#18181B] hover:bg-black text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add Kitchen Order</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">

            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
                  <ArrowDownLeft className="w-4 h-4 text-zinc-900" />
                  1. Incoming ({incomingOrders.length})
                </span>
                <span className="text-[11px] text-slate-400">Needs Action</span>
              </div>

              {incomingOrders.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200/60 text-xs text-slate-400">
                  No new orders waiting.
                </div>
              ) : (
                incomingOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-bold text-slate-900">#{ord.id}</span>
                        <p className="text-[11px] text-slate-500 font-medium">{ord.customerName}</p>
                      </div>
                      <span className="text-xs font-bold text-[#1B4332]">
                        ₹{ord.finalAmount}
                      </span>
                    </div>

                    <div className="text-xs text-slate-700 space-y-1">
                      {ord.items.map((i, idx) => (
                        <div key={i.surplusListingId ? `surplus-${i.surplusListingId}` : `item-${i.menuItemId}-${idx}`} className="flex justify-between">
                          <span>{i.quantity}x {i.name}</span>
                          <span className="text-slate-400 font-medium">₹{i.price * i.quantity}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex gap-2">
                      <button
                        onClick={() => restaurantAcceptOrder(ord.id)}
                        className="flex-1 py-2 px-3 rounded-full bg-[#18181B] hover:bg-black text-white text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" /> Accept Order
                      </button>
                      <button
                        onClick={() => setRejectingOrderId(ord.id)}
                        className="py-2 px-3 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-zinc-700" />
                  2. In Kitchen Prep ({inPrepOrders.length})
                </span>
                <span className="text-[11px] text-slate-400">Cooking</span>
              </div>

              {inPrepOrders.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200/60 text-xs text-slate-400">
                  Kitchen queue clear.
                </div>
              ) : (
                inPrepOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-bold text-slate-900">#{ord.id}</span>
                        <p className="text-[11px] text-slate-500">{ord.customerName} · {ord.deliveryAddress.slice(0, 25)}...</p>
                      </div>
                      <span className="text-[9px] font-bold text-[#1B4332] bg-[#1B4332]/10 px-2 py-0.5 rounded-full">
                        {ord.orderStatus === 'RESTAURANT_ACCEPTED' ? 'Accepted' : ord.orderStatus === 'PREPARING' ? 'Cooking' : ord.orderStatus.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="text-xs text-slate-700 space-y-1">
                      {ord.items.map((i, idx) => (
                        <div key={i.surplusListingId ? `surplus-${i.surplusListingId}` : `item-${i.menuItemId}-${idx}`} className="flex justify-between">
                          <span>{i.quantity}x {i.name}</span>
                          <span className="text-slate-400 font-medium">₹{i.price * i.quantity}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      {ord.orderStatus === 'RESTAURANT_ACCEPTED' ? (
                        <button
                          onClick={() => restaurantStartPrep(ord.id)}
                          className="w-full py-2 px-3 rounded-full bg-[#18181B] hover:bg-black text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Flame className="w-3.5 h-3.5" /> Start Cooking
                        </button>
                      ) : (
                        <button
                          onClick={() => restaurantMarkReady(ord.id)}
                          className="w-full py-2 px-3 rounded-full bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Mark Ready for Pickup
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
                  <Bike className="w-4 h-4 text-zinc-700" />
                  3. Ready / Dispatched ({readyOrders.length + outForDeliveryOrders.length})
                </span>
                <span className="text-[11px] text-slate-400">Handover</span>
              </div>

              {[...readyOrders, ...outForDeliveryOrders].length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200/60 text-xs text-slate-400">
                  No orders waiting for handover.
                </div>
              ) : (
                [...readyOrders, ...outForDeliveryOrders].map((ord) => (
                  <div
                    key={ord.id}
                    className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-bold text-slate-900">#{ord.id}</span>
                        <p className="text-[11px] text-slate-500">{ord.customerName}</p>
                      </div>
                      <span className="text-[10px] uppercase font-bold text-[#1B4332] bg-[#1B4332]/10 px-2.5 py-0.5 rounded-full">
                        {ord.orderStatus.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600">
                      {ord.deliveryPartnerName ? (
                        <div className="flex items-center gap-2 text-zinc-900 bg-slate-100 p-2.5 rounded-2xl">
                          <Bike className="w-4 h-4 text-zinc-700" />
                          <span>Rider: <strong>{ord.deliveryPartnerName}</strong> ({ord.deliveryPartnerVehicle})</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center text-center text-[#1B4332] bg-[#1B4332]/10 p-2.5 rounded-2xl text-[11px] font-medium w-full">
                          Available in Delivery Pool · Waiting for partner acceptance
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        </div>
      )}

      {activeTab === 'forecast' && (
        <div className="space-y-6">

          <div className="bg-gradient-to-br from-[#1B4332] via-[#2D6A4F] to-[#1B4332] text-white rounded-3xl p-8">
            <div className="max-w-3xl">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight font-heading">
                Demand Forecasting & Batch Size Optimization
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-white/80 leading-relaxed">
                Trained over 1,095 days of daily sales, kitchen preparation, and surplus rescue data (2023–2026). Analyzes festival surges, meal periods, and weekend elasticity to prescribe exact batch quantities that maximize revenue while avoiding unsold waste.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-6">

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">

              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">
                    Target Date:
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-full focus:ring-2 focus:ring-[#1B4332] outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">
                    Meal Period:
                  </label>
                  <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-full border border-slate-200/60">
                    {(['BREAKFAST', 'LUNCH', 'EVENING', 'DINNER'] as const).map((meal) => (
                      <button
                        key={meal}
                        onClick={() => setSelectedMealPeriod(meal)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                          selectedMealPeriod === meal
                            ? 'bg-[#1B4332] text-white'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {meal}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 font-bold uppercase">Jump to:</span>
                <button
                  onClick={() => {
                    const d = new Date();
                    const year = d.getFullYear();
                    const month = String(d.getMonth() + 1).padStart(2, '0');
                    const day = String(d.getDate()).padStart(2, '0');
                    setSelectedDate(`${year}-${month}-${day}`);
                  }}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-[#18181B] hover:bg-black text-white rounded-lg transition-colors cursor-pointer"
                >
                  Today
                </button>
                <button
                  onClick={() => setSelectedDate('2026-11-08')}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-[#1B4332]/10 hover:bg-[#1B4332]/20 text-[#1B4332] border border-[#1B4332]/30 rounded-lg transition-colors cursor-pointer"
                >
                  Diwali Rush (Nov 8)
                </button>
                <button
                  onClick={() => setSelectedDate('2026-03-04')}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-[#1B4332]/10 hover:bg-[#1B4332]/20 text-[#1B4332] border border-[#1B4332]/30 rounded-lg transition-colors cursor-pointer"
                >
                  Holi Snacks (Mar 4)
                </button>
                <button
                  onClick={() => setSelectedDate('2026-10-11')}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-[#1B4332]/10 hover:bg-[#1B4332]/20 text-[#1B4332] border border-[#1B4332]/30 rounded-lg transition-colors cursor-pointer"
                >
                  Navratri Satvik (Oct 11)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-white border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 block">Total Expected Demand</span>
                <span className="text-2xl font-black text-slate-900 mt-1 block font-heading">
                  {totalForecastDemand} meals
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Across {selectedMealPeriod.toLowerCase()}</span>
              </div>

              <div className="p-4 rounded-2xl bg-[#1B4332]/10 border border-[#1B4332]/20">
                <span className="text-[11px] font-semibold text-[#1B4332] block">Suggested Prep Batch</span>
                <span className="text-2xl font-black text-[#1B4332] mt-1 block font-heading">
                  {totalSuggestedPrep} units
                </span>
                <span className="text-[10px] text-[#1B4332]/80 mt-0.5 block">Includes {whatIfParams.safetyBufferPercent}% buffer</span>
              </div>

              <div className="p-4 rounded-2xl bg-[#18181B] border border-black text-white">
                <span className="text-[11px] font-semibold text-zinc-300 block">Projected Revenue</span>
                <span className="text-2xl font-black text-white mt-1 block font-heading">
                  ₹{totalExpectedRevenue.toLocaleString()}
                </span>
                <span className="text-[10px] text-zinc-400 mt-0.5 block">For {selectedMealPeriod}</span>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 block">Model Confidence</span>
                <span className="text-2xl font-black text-slate-900 mt-1 block font-heading">
                  {avgConfidence}%
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">High historical volume</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#1B4332]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Interactive What-If Scenario Laboratory
                  </span>
                </div>
                <button
                  onClick={() =>
                    setWhatIfParams({
                      demandMultiplier: 1.0,
                      safetyBufferPercent: 12,
                      priceAdjustmentPercent: 0,
                      productionCostUnit: 60,
                      wastePenaltyCostUnit: 45,
                      missedSalePenaltyUnit: 90,
                      festivalImpactFactor: 1.0,
                    })
                  }
                  className="text-[11px] text-[#1B4332] hover:underline font-bold cursor-pointer"
                >
                  Reset Defaults
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-xs">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-600">Demand Multiplier:</span>
                    <span className="font-bold text-slate-900">
                      {Math.round((whatIfParams.demandMultiplier - 1) * 100) > 0 ? '+' : ''}
                      {Math.round((whatIfParams.demandMultiplier - 1) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.7"
                    max="1.4"
                    step="0.05"
                    value={whatIfParams.demandMultiplier}
                    onChange={(e) =>
                      setWhatIfParams((prev) => ({ ...prev, demandMultiplier: parseFloat(e.target.value) }))
                    }
                    className="w-full minimal-range-slider cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-400">Simulate footfall surge or rain slowdown</span>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-600">Safety Prep Buffer:</span>
                    <span className="font-bold text-slate-900">
                      {whatIfParams.safetyBufferPercent}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="30"
                    step="1"
                    value={whatIfParams.safetyBufferPercent}
                    onChange={(e) =>
                      setWhatIfParams((prev) => ({ ...prev, safetyBufferPercent: parseInt(e.target.value) }))
                    }
                    className="w-full minimal-range-slider cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-400">Trades off stockouts vs waste risk</span>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-600">Price Adjustment:</span>
                    <span className="font-bold text-slate-900">
                      {whatIfParams.priceAdjustmentPercent > 0 ? '+' : ''}
                      {whatIfParams.priceAdjustmentPercent}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-20"
                    max="20"
                    step="5"
                    value={whatIfParams.priceAdjustmentPercent}
                    onChange={(e) =>
                      setWhatIfParams((prev) => ({ ...prev, priceAdjustmentPercent: parseInt(e.target.value) }))
                    }
                    className="w-full minimal-range-slider cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-400">Elasticity model shifts expected demand</span>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-600">Festival Sensitivity:</span>
                    <span className="font-bold text-slate-900">
                      {whatIfParams.festivalImpactFactor}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={whatIfParams.festivalImpactFactor}
                    onChange={(e) =>
                      setWhatIfParams((prev) => ({ ...prev, festivalImpactFactor: parseFloat(e.target.value) }))
                    }
                    className="w-full minimal-range-slider cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-400">Scale traditional holiday surge</span>
                </div>
              </div>
            </div>

          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-heading">
                  Item-Level Production Recommendations
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Calculated specifically for {selectedDate} ({selectedMealPeriod})
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Menu Item</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-right">Expected Demand</th>
                    <th className="py-3 px-4 text-right">Suggested Prep</th>
                    <th className="py-3 px-4 text-right">Buffer</th>
                    <th className="py-3 px-4 text-center">Surplus Risk</th>
                    <th className="py-3 px-4 text-right">Confidence</th>
                    <th className="py-3 px-6">Transparent Drivers & Attribution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {forecastList.map((f) => (
                    <tr key={f.menuItemId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                        {f.itemName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {f.category}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                        {f.expectedDemand}
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-[#1B4332] bg-[#1B4332]/5">
                        {f.suggestedPrepQty}
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-500">
                        +{f.safetyBufferQty}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            f.surplusRisk === 'LOW'
                              ? 'bg-[#1B4332]/10 text-[#1B4332]'
                              : f.surplusRisk === 'MEDIUM'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {f.surplusRisk}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-600 font-medium">
                        {f.confidenceScore}%
                      </td>
                      <td className="py-3 px-6 text-slate-600 text-[11px] max-w-md">
                        <ul className="space-y-1 my-1">
                          {f.keyDrivers.map((driver, dIdx) => (
                            <li key={dIdx} className="flex items-start gap-1.5 leading-snug">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#1B4332] mt-1 shrink-0" />
                              <span>{driver}</span>
                            </li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-[#1B4332]/5 border border-[#1B4332]/20 text-slate-900 rounded-3xl p-6 sm:p-8 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1B4332]/15 pb-4">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#1B4332] font-black">
                  SYNTHETIC 3-YEAR DEMO DATASET VALIDATION
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5 font-heading">
                  Chronological Holdout Model Benchmarks (2025 Test Split)
                </h3>
              </div>
              <span className="text-xs text-slate-600 font-medium">
                1,095 Daily Records Evaluated
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-white border border-[#1B4332]/20 text-[#1B4332] shadow-xs">
                <span className="text-[#1B4332] text-[11px] font-semibold block">Mean Absolute Error (MAE)</span>
                <span className="text-2xl font-black mt-1 block font-heading">
                  {accuracyEvaluation.meanAbsoluteError} meals
                </span>
                <span className="text-[10px] text-slate-500 mt-1 block">Average forecast deviation</span>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#1B4332]/20 text-[#1B4332] shadow-xs">
                <span className="text-[#1B4332] text-[11px] font-semibold block">Weighted Absolute Error (WAPE)</span>
                <span className="text-2xl font-black mt-1 block font-heading">
                  {accuracyEvaluation.weightedAbsolutePercentageError}%
                </span>
                <span className="text-[10px] text-slate-500 mt-1 block">Normalized error metric</span>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#1B4332]/20 text-[#1B4332] shadow-xs">
                <span className="text-[#1B4332] text-[11px] font-semibold block">Overall Accuracy Score</span>
                <span className="text-2xl font-black mt-1 block font-heading">
                  {accuracyEvaluation.accuracyPercent}%
                </span>
                <span className="text-[10px] text-slate-500 mt-1 block">Reliable kitchen planning</span>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#1B4332]/20 text-[#1B4332] shadow-xs">
                <span className="text-[#1B4332] text-[11px] font-semibold block">Gain vs Naive Baseline</span>
                <span className="text-2xl font-black mt-1 block font-heading">
                  +{accuracyEvaluation.errorReductionVsBaseline}%
                </span>
                <span className="text-[10px] text-slate-500 mt-1 block">Outperforms static rolling avg</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed pt-2">
              The forecasting pipeline combines multi-year seasonal decomposition, day-of-week clustering, and festival demand elasticity. Recommendations explicitly balance marginal revenue per meal against food waste disposal penalties.
            </p>
          </div>

        </div>
      )}

      {activeTab === 'surplus_mgmt' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 font-heading">Closing Surplus Deals</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                List unsold batches for discount rescue to recover ingredient cost and avoid waste.
              </p>
            </div>
            <button
              onClick={() => setShowAddSurplusModal(true)}
              className="py-2.5 px-4 rounded-full bg-[#1B4332] hover:bg-[#143326] text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Publish New Surplus Deal
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {mySurplusListings.length === 0 ? (
              <div className="col-span-full py-12 px-6 text-center bg-white rounded-3xl border border-slate-200">
                <Tag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-700">No Active Surplus Deals</h3>
                <p className="text-xs text-slate-400 mt-1">Publish unsold kitchen inventory to rescue food and recover ingredient costs.</p>
              </div>
            ) : (
              mySurplusListings.map((listing) => (
              <div
                key={listing.id}
                className="bg-white rounded-3xl border border-slate-200 p-5 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#1B4332]">
                        {listing.category}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 mt-0.5 font-heading">
                        {listing.name}
                      </h3>
                    </div>
                    <span
                      className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                        listing.status === 'AVAILABLE'
                          ? 'bg-[#1B4332]/10 text-[#1B4332]'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {listing.status}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 text-xs space-y-1">
                    <div className="flex justify-between text-slate-600">
                      <span>Quantity Remaining:</span>
                      <span className="font-bold text-slate-900">
                        {listing.quantityAvailable} of {listing.initialQuantity}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Floor Min Price:</span>
                      <span className="text-slate-900 font-semibold">₹{listing.minPrice}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Live Decay Price:</span>
                      <span className="font-bold text-[#1B4332]">
                        ₹{listing.currentPrice}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => handleOpenEditSurplus(listing)}
                    className="px-3.5 py-1.5 rounded-full bg-[#18181B] hover:bg-black text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Edit2 className="w-3 h-3" /> Edit Deal
                  </button>
                </div>
              </div>
            )))}
          </div>
        </div>
      )}

      {activeTab === 'menu_mgmt' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 font-heading">Menu Catalog</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage regular restaurant dishes, stock availability, and base pricing.
              </p>
            </div>
            <button
              onClick={() => setShowAddMenuModal(true)}
              className="py-2.5 px-4 rounded-full bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Menu Item
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {myMenuItems.length === 0 ? (
              <div className="col-span-full py-12 px-6 text-center bg-white rounded-3xl border border-slate-200">
                <UtensilsCrossed className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-700">No Menu Items Listed</h3>
                <p className="text-xs text-slate-400 mt-1">Click "Add Menu Item" above to publish your restaurant's first culinary dish.</p>
              </div>
            ) : (
              myMenuItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-3xl border border-slate-200 p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {item.category}
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      ₹{item.price}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 font-heading">{item.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        updateMenuItem(item.id, { inStock: !item.inStock })
                      }
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                        item.inStock
                          ? 'bg-[#1B4332]/10 text-[#1B4332]'
                          : 'bg-rose-50 text-rose-800'
                      }`}
                    >
                      {item.inStock ? 'In Stock' : 'Sold Out'}
                    </button>
                    <button
                      onClick={() => handleOpenEditMenuItem(item)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
                      title="Edit dish details"
                    >
                      <Edit2 className="w-3 h-3" /> Edit
                    </button>
                  </div>

                  <button
                    onClick={() => deleteMenuItem(item.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )))}
          </div>
        </div>
      )}

      <AnimatePresence>
        {showAddMenuModal && (
          <motion.div
            key="add-menu-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => setShowAddMenuModal(false)}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto cursor-pointer"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ type: 'spring', damping: 28, stiffness: 350 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl w-full max-w-2xl max-h-[82vh] overflow-hidden border border-slate-200 shadow-2xl flex flex-col cursor-default my-auto"
            >
                <div className="px-6 py-3.5 border-b border-slate-200 flex items-center justify-between bg-white text-black shrink-0">
                <div className="flex items-center gap-3">
                  <div>
                    <h3 className="text-sm font-black text-black uppercase tracking-wider">Add New Menu Dish</h3>
                    <p className="text-[10px] text-slate-500 font-medium">Add fresh signature dishes or specials to live customer ordering</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddMenuModal(false)}
                  className="p-2 rounded-full hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateMenuItem} className="p-6 overflow-y-auto space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Dish Name</label>
                    <input
                      type="text"
                      required
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      placeholder="e.g. Malai Kofta Curry Bowl"
                      className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-[#1B4332]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Category</label>
                    <select
                      value={newItemCategory}
                      onChange={(e) => setNewItemCategory(e.target.value as any)}
                      className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl outline-none bg-white focus:border-[#1B4332]"
                    >
                      <option value="Rolls & Wraps">Rolls & Wraps</option>
                      <option value="Bowls & Thalis">Bowls & Thalis</option>
                      <option value="Chaat & Cafe Bites">Chaat & Cafe Bites</option>
                      <option value="Brews & Desserts">Brews & Desserts</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Price (₹)</label>
                    <input
                      type="number"
                      required
                      value={newItemPrice}
                      onChange={(e) => setNewItemPrice(Number(e.target.value))}
                      className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-[#1B4332]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Prep Time (mins)</label>
                    <input
                      type="number"
                      required
                      value={newItemPrepTime}
                      onChange={(e) => setNewItemPrepTime(Number(e.target.value))}
                      className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-[#1B4332]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={newItemDescription}
                    onChange={(e) => setNewItemDescription(e.target.value)}
                    placeholder="Ingredients and culinary notes..."
                    className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-[#1B4332]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddMenuModal(false)}
                    className="px-5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-full cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold bg-[#18181B] text-white hover:bg-black rounded-full cursor-pointer"
                  >
                    Save Item
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {editingMenuItem && (
        <div
          onClick={() => setEditingMenuItem(null)}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl w-full max-w-2xl max-h-[82vh] overflow-hidden border border-slate-200 shadow-2xl flex flex-col cursor-default my-auto"
          >
            <div className="px-6 py-3.5 border-b border-slate-200 flex items-center justify-between bg-white text-black shrink-0">
                <div>
                  <h3 className="text-sm font-black text-black uppercase tracking-wider">Edit Menu Item</h3>
                  <p className="text-[10px] text-slate-500 font-medium">Update pricing, description, and preparation details</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingMenuItem(null)}
                  className="p-2 rounded-full hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveEditMenuItem} className="p-6 overflow-y-auto space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Dish Name</label>
                    <input
                      type="text"
                      required
                      value={editItemName}
                      onChange={(e) => setEditItemName(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-[#1B4332]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Category</label>
                    <select
                      value={editItemCategory}
                      onChange={(e) => setEditItemCategory(e.target.value as any)}
                      className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl outline-none bg-white focus:border-[#1B4332]"
                    >
                      <option value="Rolls & Wraps">Rolls & Wraps</option>
                      <option value="Bowls & Thalis">Bowls & Thalis</option>
                      <option value="Chaat & Cafe Bites">Chaat & Cafe Bites</option>
                      <option value="Brews & Desserts">Brews & Desserts</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Price (₹)</label>
                    <input
                      type="number"
                      required
                      value={editItemPrice}
                      onChange={(e) => setEditItemPrice(Number(e.target.value))}
                      className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-[#1B4332]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Prep Time (mins)</label>
                    <input
                      type="number"
                      required
                      value={editItemPrepTime}
                      onChange={(e) => setEditItemPrepTime(Number(e.target.value))}
                      className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-[#1B4332]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={editItemDescription}
                    onChange={(e) => setEditItemDescription(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-[#1B4332]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingMenuItem(null)}
                    className="px-5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-full cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold bg-[#18181B] text-white hover:bg-black rounded-full cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showAddSurplusModal && (
          <motion.div
            key="add-surplus-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => setShowAddSurplusModal(false)}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto cursor-pointer"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ type: 'spring', damping: 28, stiffness: 350 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl w-full max-w-2xl max-h-[82vh] overflow-hidden border border-slate-200 shadow-2xl flex flex-col cursor-default my-auto"
            >
                <div className="px-6 py-3.5 border-b border-slate-200 flex items-center justify-between bg-white text-black shrink-0">
                <div className="flex items-center gap-3">
                  <div>
                    <h3 className="text-sm font-black text-black uppercase tracking-wider">Publish Closing Surplus Deal</h3>
                    <p className="text-[10px] text-slate-500 font-medium">Rescue unsold portions before shift close with dynamic continuous pricing</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddSurplusModal(false)}
                  className="p-2 rounded-full hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handlePublishSurplus} className="p-6 overflow-y-auto space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Select Menu Item</label>
                  <select
                    value={surplusMenuItemId}
                    onChange={(e) => setSurplusMenuItemId(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl outline-none bg-white focus:border-[#1B4332]"
                  >
                    {menuItems.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} (Original: ₹{m.price})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Portions to Rescue</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={surplusQuantity}
                      onChange={(e) => setSurplusQuantity(Number(e.target.value))}
                      className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-[#1B4332]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Floor Min Price (₹)</label>
                    <input
                      type="number"
                      min="40"
                      required
                      value={surplusMinPrice}
                      onChange={(e) => setSurplusMinPrice(Number(e.target.value))}
                      className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-[#1B4332]"
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#1B4332]/5 border border-[#1B4332]/15 text-xs text-[#1B4332]">
                  The listing will smoothly decay from original price down to ₹{surplusMinPrice} leading into closing time.
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddSurplusModal(false)}
                    className="px-5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-full cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold bg-[#18181B] text-white hover:bg-black rounded-full cursor-pointer"
                  >
                    Publish Rescue Deal
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {editingSurplusListing && (
        <div onClick={() => setEditingSurplusListing(null)} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto cursor-pointer">
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-3xl w-full max-w-2xl max-h-[82vh] overflow-hidden border border-slate-200 shadow-2xl flex flex-col cursor-default my-auto">
            <div className="px-6 py-3.5 border-b border-slate-200 flex items-center justify-between bg-white text-black shrink-0">
              <div className="flex items-center gap-3">
                <div>
                  <h3 className="text-sm font-black text-black uppercase tracking-wider">Edit Surplus Rescue Deal</h3>
                  <p className="text-[10px] text-slate-500 font-medium">Update pricing floor, portions, and visibility status</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingSurplusListing(null)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditSurplus} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Deal Title</label>
                <input
                  type="text"
                  required
                  value={editSurplusName}
                  onChange={(e) => setEditSurplusName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-[#1B4332]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Original Price (₹)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editSurplusOriginalPrice}
                    onChange={(e) => setEditSurplusOriginalPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-[#1B4332]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Floor Min Price (₹)</label>
                  <input
                    type="number"
                    min="10"
                    required
                    value={editSurplusMinPrice}
                    onChange={(e) => setEditSurplusMinPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-[#1B4332]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Quantity Available</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editSurplusQuantity}
                    onChange={(e) => setEditSurplusQuantity(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-[#1B4332]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Listing Status</label>
                  <select
                    value={editSurplusStatus}
                    onChange={(e) => setEditSurplusStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl outline-none bg-white focus:border-[#1B4332]"
                  >
                    <option value="AVAILABLE">AVAILABLE</option>
                    <option value="SOLD_OUT">SOLD_OUT</option>
                    <option value="EXPIRED">EXPIRED</option>
                  </select>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#1B4332]/5 border border-[#1B4332]/15 text-xs text-[#1B4332]">
                Dynamic decay price automatically recalculates between ₹{editSurplusOriginalPrice} and ₹{editSurplusMinPrice}.
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingSurplusListing(null)}
                  className="px-5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-full cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-[#18181B] hover:bg-black text-white rounded-full cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {rejectingOrderId && (
        <div onClick={() => setRejectingOrderId(null)} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer">
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-3xl w-full max-w-sm p-6 border border-slate-200 shadow-2xl cursor-default my-auto">
            <h3 className="text-base font-bold text-slate-900 mb-2 font-heading">Decline Order</h3>
            <p className="text-xs text-slate-500 mb-3">
              Please provide a reason for rejecting order #{rejectingOrderId}:
            </p>
            <input
              type="text"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRejectingOrderId(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-full cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={() => {
                  restaurantRejectOrder(rejectingOrderId, rejectionReason);
                  setRejectingOrderId(null);
                }}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-full cursor-pointer"
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showAddOrderModal && (
          <motion.div
            key="add-order-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => setShowAddOrderModal(false)}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto cursor-pointer"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ type: 'spring', damping: 28, stiffness: 350 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl w-full max-w-4xl max-h-[82vh] overflow-hidden border border-slate-200 shadow-2xl flex flex-col cursor-default my-auto"
            >
              <div className="px-6 py-3.5 border-b border-slate-200 flex items-center justify-between bg-white text-black shrink-0">
              <div className="flex items-center gap-3">
                <div>
                  <h3 className="text-sm font-black text-black uppercase tracking-wider">Create New Kitchen Order</h3>
                  <p className="text-[10px] text-slate-500 font-medium">Add walk-in, phone, or counter orders directly into live prep queue</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddOrderModal(false)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateKitchenOrder} className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-100">

              <div className="md:col-span-6 p-6 space-y-4">
                {orderError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                    {orderError}
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Order Channel:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'DINE_IN', label: 'Dine-In' },
                      { id: 'TAKEAWAY', label: 'Takeaway' },
                      { id: 'DELIVERY', label: 'Direct' },
                    ].map((ch) => (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => {
                          setOrderType(ch.id as any);
                          if (ch.id === 'DINE_IN') setOrderTableOrAddress('Table 4');
                          else if (ch.id === 'TAKEAWAY') setOrderTableOrAddress('Counter Pickup');
                          else setOrderTableOrAddress('100 Feet Road, Indiranagar, Bengaluru');
                        }}
                        className={`p-2 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                          orderType === ch.id
                            ? 'border-[#1B4332] bg-[#1B4332]/10 text-[#1B4332]'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {ch.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Customer / Guest Name</label>
                    <input
                      type="text"
                      required
                      value={orderCustomerName}
                      onChange={(e) => setOrderCustomerName(e.target.value)}
                      placeholder="e.g. Rahul Verma"
                      className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-[#1B4332]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={orderCustomerPhone}
                      onChange={(e) => setOrderCustomerPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-[#1B4332]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    {orderType === 'DINE_IN' ? 'Table Number / Section' : orderType === 'TAKEAWAY' ? 'Pickup Note / Token' : 'Delivery Address'}
                  </label>
                  <input
                    type="text"
                    required
                    value={orderTableOrAddress}
                    onChange={(e) => setOrderTableOrAddress(e.target.value)}
                    placeholder="e.g. Table 4 / Token #12"
                    className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-[#1B4332]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Kitchen Prep Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="e.g. Less oil, extra green chutney"
                    className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-[#1B4332]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Payment Method:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'UPI', label: 'UPI / QR' },
                      { id: 'CARD', label: 'Card Swiped' },
                      { id: 'COD', label: 'Cash Paid' },
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setOrderPaymentMethod(p.id as any)}
                        className={`p-2 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                          orderPaymentMethod === p.id
                            ? 'border-[#1B4332] bg-[#1B4332]/10 text-[#1B4332]'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="md:col-span-6 p-6 bg-slate-50/50 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between pb-1">
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider font-heading">
                      Select Dishes:
                    </label>
                    <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                      {Object.values(selectedItemsMap).reduce((a, b) => a + b, 0)} items
                    </span>
                  </div>

                  <div className="max-h-[260px] overflow-y-auto space-y-2 pr-1">
                    {menuItems.map((item) => {
                      const qty = selectedItemsMap[item.id] || 0;
                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-2.5 bg-white rounded-2xl border border-slate-200/80 text-xs"
                        >
                          <div className="flex-1 min-w-0 pr-2">
                            <span className="font-extrabold text-slate-900 block truncate">{item.name}</span>
                            <span className="text-[11px] text-slate-500 font-medium">₹{item.price} · {item.category}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {qty > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedItemsMap((prev) => {
                                    const next = { ...prev };
                                    if (next[item.id] > 1) next[item.id] -= 1;
                                    else delete next[item.id];
                                    return next;
                                  });
                                }}
                                className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <span className="w-5 text-center font-bold text-xs">
                              {qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedItemsMap((prev) => ({
                                  ...prev,
                                  [item.id]: (prev[item.id] || 0) + 1,
                                }));
                              }}
                              className="w-6 h-6 rounded-full bg-[#18181B] text-white hover:bg-black flex items-center justify-center cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-500 block">Total Due:</span>
                    <span className="text-lg font-black text-slate-900 font-heading">
                      ₹{Object.entries(selectedItemsMap).reduce((sum, [id, qty]) => {
                        const item = menuItems.find((m) => m.id === id);
                        return sum + (item?.price || 0) * qty;
                      }, 0)}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddOrderModal(false)}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-full cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 text-xs font-bold bg-[#18181B] text-white hover:bg-black rounded-full transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Send to Kitchen</span>
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    </div>
  );
};
