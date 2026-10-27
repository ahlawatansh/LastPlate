import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShoppingBag,
  Search,
  Clock,
  MapPin,
  Pencil,
  Plus,
  Minus,
  Check,
  CreditCard,
  QrCode,
  Banknote,
  Bike,
  ShieldCheck,
  ChevronRight,
  TrendingDown,
  Leaf,
  X,
  Phone,
  Timer,
  Sliders,
  CheckCircle2,
  Trash2,
  Award,
  TreePine,
  DollarSign,
  Share2,
  Calendar as CalendarIcon,
  Activity,
  Heart,
  Droplets,
  MessageSquare,
  ChevronDown,
  Flame,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MenuItem, SurplusListing, OrderStatus } from '../../types';
import { ScheduleCalendarView } from '../calendar/ScheduleCalendarView';
import { DishDetailModal } from '../dish/DishDetailModal';

interface CustomerPortalProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

export const CustomerPortal: React.FC<CustomerPortalProps> = ({
  activeTab,
  setActiveTab,
  isCartOpen,
  setIsCartOpen,
}) => {
  const {
    currentUser,
    menuItems,
    surplusListings,
    orders,
    cart,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    cartTotal,
    cartSavings,
    placeOrder,
    calculateLiveSurplusPrice,
    advanceOrderSimulation,
    searchQuery,
    setSearchQuery,
    addNotification,
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [vegOnly, setVegOnly] = useState(false);
  const [selectedDishForDetail, setSelectedDishForDetail] = useState<MenuItem | null>(null);

  const isDemoCustomer =
    currentUser?.id === 'user-customer-1' ||
    currentUser?.email?.endsWith('@lastplate.demo');

  const [deliveryAddress, setDeliveryAddress] = useState(
    currentUser?.customerProfile?.defaultAddress ||
      (isDemoCustomer
        ? 'Flat 402, Prestige Ferns Residency, HSR Layout Sector 2, Bengaluru, Karnataka - 560102'
        : '')
  );
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [tempAddress, setTempAddress] = useState(deliveryAddress);

  useEffect(() => {
    const defaultAddr =
      currentUser?.customerProfile?.defaultAddress ||
      (isDemoCustomer
        ? 'Flat 402, Prestige Ferns Residency, HSR Layout Sector 2, Bengaluru, Karnataka - 560102'
        : '');
    setDeliveryAddress(defaultAddr);
    setTempAddress(defaultAddr);
  }, [currentUser, isDemoCustomer]);

  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'UPI' | 'CARD' | 'COD'>('UPI');
  const [upiMethodType, setUpiMethodType] = useState<'APP' | 'ID' | 'QR'>('APP');
  const [selectedUpiApp, setSelectedUpiApp] = useState<'GPAY' | 'PHONEPE' | 'PAYTM' | 'CRED'>('GPAY');
  const [upiIdInput, setUpiIdInput] = useState(isDemoCustomer ? 'customer@oksbi' : '');
  const [cardNumber, setCardNumber] = useState(isDemoCustomer ? '4532 8901 2345 6789' : '');
  const [cardExpiry, setCardExpiry] = useState(isDemoCustomer ? '12/28' : '');
  const [cardCvv, setCardCvv] = useState(isDemoCustomer ? '424' : '');
  const [cardHolder, setCardHolder] = useState(currentUser?.name || '');
  const [selectedTip, setSelectedTip] = useState<number>(20);
  const [orderNotes, setOrderNotes] = useState('');

  const [paymentPhase, setPaymentPhase] = useState<'IDLE' | 'PROCESSING' | 'SUCCESS'>('IDLE');

  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null);
  const [isAutoSimulating, setIsAutoSimulating] = useState(false);

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const [isCartBumping, setIsCartBumping] = useState(false);
  const prevCountRef = useRef(cartItemCount);
  useEffect(() => {
    if (cartItemCount > prevCountRef.current) {
      setIsCartBumping(true);
      const timer = setTimeout(() => setIsCartBumping(false), 500);
      return () => clearTimeout(timer);
    }
    prevCountRef.current = cartItemCount;
  }, [cartItemCount]);

  const [simMinutesLeft, setSimMinutesLeft] = useState(30);
  const [simUnsoldPortions, setSimUnsoldPortions] = useState(6);
  const simOriginalPrice = 380;
  const simFloorPrice = 160;

  const simTimeProgress = Math.min(1, Math.max(0, (240 - simMinutesLeft) / 240));
  const simTimeDecay = Math.pow(simTimeProgress, 1.25);
  const simQtyRatio = simUnsoldPortions / 10;
  const simQtyMultiplier = 0.70 + 0.40 * simQtyRatio;
  const simDiscountFactor = Math.min(1.0, Math.max(0.15, simTimeDecay * simQtyMultiplier));
  const simCalculatedPrice = Math.max(
    simFloorPrice,
    Math.min(simOriginalPrice, Math.round(simOriginalPrice - (simOriginalPrice - simFloorPrice) * simDiscountFactor))
  );

  const trackingOrder = orders.find((o) => o.id === trackingOrderId) || null;
  const trackingOrderRef = useRef(trackingOrder);
  trackingOrderRef.current = trackingOrder;

  const advanceOrderSimulationRef = useRef(advanceOrderSimulation);
  advanceOrderSimulationRef.current = advanceOrderSimulation;

  const triggerNotification = (title: string, msg: string) => {
    addNotification({
      title,
      message: msg,
      type: 'ORDER',
      role: 'CUSTOMER',
    });
  };

  useEffect(() => {
    if (!isAutoSimulating || !trackingOrderId) return;

    if (trackingOrderRef.current?.orderStatus === 'DELIVERED') {
      setIsAutoSimulating(false);
      return;
    }

    const timer = setInterval(() => {
      const current = trackingOrderRef.current;
      if (!current || current.id !== trackingOrderId || current.orderStatus === 'DELIVERED') {
        setIsAutoSimulating(false);
        return;
      }

      const next = advanceOrderSimulationRef.current(current.id);
      if (next === 'DELIVERED') {
        setIsAutoSimulating(false);
      }
    }, 3500);

    return () => {
      clearInterval(timer);
    };
  }, [isAutoSimulating, trackingOrderId]);

  const categories: string[] = ['All', 'Rolls & Wraps', 'Bowls & Thalis', 'Chaat & Cafe Bites', 'Brews & Desserts'];

  const chefSpecialDish = useMemo(() => {
    return menuItems.find((m) => m.name.toLowerCase().includes('lababdar')) || menuItems[0];
  }, [menuItems]);

  const chefSpecialInCart = useMemo(() => {
    if (!chefSpecialDish) return null;
    return cart.find((c) => c.menuItemId === chefSpecialDish.id && !c.isSurplus) || null;
  }, [chefSpecialDish, cart]);

  const filteredMenuItems = menuItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesVeg = !vegOnly || item.isVeg;
    return matchesSearch && matchesCategory && matchesVeg;
  });

  const activeSurplusListings = surplusListings.filter((item) => {
    const isAvail = item.status === 'AVAILABLE' && item.quantityAvailable > 0;
    if (!isAvail) return false;
    if (!searchQuery) return true;
    return item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.prepTimeInfo && item.prepTimeInfo.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  const customerOrders = orders.filter((o) => {
    const isMine = isDemoCustomer
      ? (o.customerId === currentUser?.id || o.customerId === 'user-customer-1')
      : (o.customerId === currentUser?.id);
    if (!isMine) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return o.id.toLowerCase().includes(q) ||
      o.items.some((i) => i.name.toLowerCase().includes(q)) ||
      o.orderStatus.toLowerCase().includes(q);
  });

  const deliveryFee = 35;
  const payableGrandTotal = cartTotal + deliveryFee + selectedTip;

  const checkoutTimersRef = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      checkoutTimersRef.current.forEach((t) => clearTimeout(t));
      checkoutTimersRef.current = [];
    };
  }, []);

  const handleAddItemToCart = (item: MenuItem | SurplusListing, isSurplus = false) => {
    addToCart(item, isSurplus);
  };

  const handleExecuteCheckout = () => {
    setPaymentPhase('PROCESSING');

    const t1 = window.setTimeout(() => {
      setPaymentPhase('SUCCESS');
      const t2 = window.setTimeout(() => {
        const fullNotes = [orderNotes, selectedTip > 0 ? `Driver Tip Included: ₹${selectedTip}` : '']
          .filter(Boolean)
          .join(' | ');

        const created = placeOrder(selectedPaymentMethod, deliveryAddress, fullNotes);
        setShowCheckoutModal(false);
        setIsCartOpen(false);

        if (created) {
          setTrackingOrderId(created.id);
          triggerNotification('Order Placed', `Order #${created.id} confirmed! Dispatched to Kitchen.`);
        }

        const t3 = window.setTimeout(() => {
          setPaymentPhase('IDLE');
        }, 300);
        checkoutTimersRef.current.push(t3);
      }, 900);
      checkoutTimersRef.current.push(t2);
    }, 1200);
    checkoutTimersRef.current.push(t1);
  };

  const getStatusStepIndex = (status: OrderStatus): number => {
    const orderSteps: OrderStatus[] = [
      'ORDER_PLACED',
      'RESTAURANT_ACCEPTED',
      'PREPARING',
      'READY_FOR_PICKUP',
      'DELIVERY_ASSIGNED',
      'PICKED_UP',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
    ];
    return orderSteps.indexOf(status);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-5 pb-32 space-y-8">

      {activeTab === 'menu' && (
        <div className="space-y-8">

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
            <div className="relative h-48 sm:h-64 bg-slate-900">
              <img
                src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop&q=80"
                alt="Green Leaf Kitchen Interior"
                className="w-full h-full object-cover opacity-65"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />

              <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-white">
                <div>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="px-3 py-1 rounded-full bg-emerald-600/90 text-white text-[11px] font-bold uppercase tracking-wider backdrop-blur-xs">
                      Open Now · Closes 11:30 PM
                    </span>
                    <span className="px-3 py-1 rounded-full bg-white/20 text-white text-[11px] font-semibold backdrop-blur-xs flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" /> 4.8 (1,248 reviews)
                    </span>
                    <span className="px-3 py-1 rounded-full bg-white/20 text-white text-[11px] font-medium backdrop-blur-xs">
                      FSSAI Certified #10822005000142
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-heading">
                    Green Leaf Kitchen
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-200 max-w-xl mt-1 line-clamp-1 font-normal">
                    Artisanal North Indian kathi rolls, slow-cooked dal makhani, street chaat, and chef-curated surplus deals.
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl px-4 py-2 border border-white/15 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-300 block">Avg Prep Time</span>
                    <span className="text-base font-bold text-white flex items-center justify-center gap-1">
                      <Clock className="w-4 h-4 text-emerald-400" /> 15-20 min
                    </span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl px-4 py-2 border border-white/15 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-300 block">Delivery Zone</span>
                    <span className="text-base font-bold text-white flex items-center justify-center gap-1">
                      <Bike className="w-4 h-4 text-emerald-400" /> Bengaluru
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50/70 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#18181B] shrink-0" />
                <span className="font-semibold text-slate-900">Delivering To:</span>
                {isEditingAddress ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="text"
                      value={tempAddress}
                      onChange={(e) => setTempAddress(e.target.value)}
                      className="px-4 py-1.5 text-xs font-normal border border-slate-300 rounded-full bg-white outline-none focus:border-black w-72 placeholder:text-slate-400 placeholder:text-xs placeholder:font-light"
                      placeholder="Enter delivery address..."
                    />
                    <button
                      onClick={() => {
                        if (tempAddress.trim()) setDeliveryAddress(tempAddress.trim());
                        setIsEditingAddress(false);
                        triggerNotification('Address Updated', 'Delivery address updated successfully.');
                      }}
                      className="px-4 py-1.5 bg-[#18181B] text-white rounded-full font-bold hover:bg-black cursor-pointer text-xs"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setTempAddress(deliveryAddress);
                        setIsEditingAddress(false);
                      }}
                      className="px-3 py-1.5 text-slate-500 hover:text-slate-800 rounded-full cursor-pointer text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-700 font-medium truncate max-w-md">
                      {deliveryAddress || <span className="text-slate-400 italic font-normal">No address provided. Click pencil to set delivery location.</span>}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setTempAddress(deliveryAddress);
                        setIsEditingAddress(true);
                      }}
                      className="p-1.5 rounded-full hover:bg-slate-200/70 text-slate-900 transition-colors cursor-pointer flex items-center justify-center shrink-0"
                      title="Edit delivery address"
                    >
                      <Pencil className="w-3.5 h-3.5 text-black" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 text-slate-500">
                <span>Rescue Rate: <strong className="text-emerald-700">92% of surplus recovered</strong></span>
                <span>·</span>
                <span>Packaging: <strong className="text-slate-800">100% Biodegradable</strong></span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight font-heading">
                  Kitchen Menu & Dishes
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Prepared fresh to order using artisanal North Indian recipes and organic produce.
                </p>
              </div>

              <div className="flex items-center gap-3">

                <button
                  type="button"
                  onClick={() => setVegOnly(!vegOnly)}
                  className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 border transition-colors cursor-pointer ${
                    vegOnly
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-[3px] bg-white border flex items-center justify-center p-0.5 ${
                    vegOnly ? 'border-emerald-600' : 'border-slate-300'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${vegOnly ? 'bg-emerald-600' : 'bg-slate-300'}`} />
                  </span>
                  <span>Pure Veg</span>
                </button>
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat) => {
                const count = cat === 'All'
                  ? menuItems.length
                  : menuItems.filter(m => m.category === cat).length;
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors cursor-pointer flex items-center justify-between gap-3.5 ${
                      isSelected
                        ? 'bg-[#18181B] text-white font-extrabold'
                        : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50 hover:text-slate-950'
                    }`}
                  >
                    <span>{cat}</span>
                    <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ml-3 ${
                      isSelected ? 'bg-white/20 text-white font-extrabold' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {filteredMenuItems.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
                <Search className="w-8 h-8 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-800 font-heading">No dishes matched your filter</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Try clearing your search query or selecting a different category to view more specialties.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                    setVegOnly(false);
                  }}
                  className="px-5 py-2.5 rounded-full bg-[#18181B] text-white text-xs font-bold hover:bg-black cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMenuItems.map((item) => {
                  const inCart = cart.find((c) => c.menuItemId === item.id && !c.isSurplus);

                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-3xl border border-slate-200 overflow-hidden transition-colors flex flex-col justify-between group"
                    >
                      <div>
                        <div
                          onClick={() => setSelectedDishForDetail(item)}
                          className="relative h-48 bg-slate-100 overflow-hidden cursor-pointer"
                        >
                          <img
                            src={
                              item.imageUrl ||
                              'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80'
                            }
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute top-3 left-3 flex gap-1.5 items-center">
                            {item.isVeg ? (
                              <span className="w-4.5 h-4.5 rounded-[4px] bg-white border border-emerald-600 flex items-center justify-center p-0.5" title="Pure Veg">
                                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                              </span>
                            ) : (
                              <span className="w-4.5 h-4.5 rounded-[4px] bg-white border border-rose-600 flex items-center justify-center p-0.5" title="Non-Vegetarian">
                                <span className="w-2 h-2 rounded-full bg-rose-600" />
                              </span>
                            )}
                            <span className={`px-2.5 py-0.5 rounded-full bg-white/95 text-[10px] font-bold shadow-xs ${
                              item.isVeg ? 'text-emerald-700 border border-emerald-300' : 'text-rose-700 border border-rose-300'
                            }`}>
                              {item.category}
                            </span>
                          </div>

                          <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-black/60 text-white text-[10px] font-medium backdrop-blur-xs flex items-center gap-1">
                            <Clock className="w-3 h-3 text-emerald-400" /> {item.prepTimeMinutes} min
                          </div>
                        </div>

                        <div className="p-5 space-y-2">
                          <h3
                            onClick={() => setSelectedDishForDetail(item)}
                            className="text-base font-bold text-slate-900 leading-snug font-heading cursor-pointer hover:text-black transition-colors"
                          >
                            {item.name}
                          </h3>
                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      <div className="p-5 pt-0 flex items-center justify-between border-t border-slate-100/80 mt-2">
                        <div className="pt-3">
                          <span className="text-lg font-black text-slate-900">
                            ₹{item.price}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-medium">Standard portion</span>
                        </div>

                        <div className="pt-3 flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedDishForDetail(item)}
                            className="px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-800 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                            title="Nutrients, Ingredients & Health Profile"
                          >
                            Details
                          </button>
                          {inCart ? (
                            <div className="h-8 w-[88px] flex items-center justify-between bg-[#18181B] text-white rounded-full px-1.5 shrink-0 transition-transform">
                              <button
                                type="button"
                                onClick={() => updateCartQuantity(inCart.id, -1)}
                                className="w-6 h-6 rounded-full hover:bg-white/20 active:scale-90 flex items-center justify-center transition-colors cursor-pointer"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-xs font-bold px-1">{inCart.quantity}</span>
                              <button
                                type="button"
                                onClick={() => updateCartQuantity(inCart.id, 1)}
                                className="w-6 h-6 rounded-full hover:bg-white/20 active:scale-90 flex items-center justify-center transition-colors cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleAddItemToCart(item, false)}
                              className="h-8 w-[88px] rounded-full bg-[#18181B] hover:bg-black active:scale-95 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                            >
                              <Plus className="w-3.5 h-3.5" /> <span>Add</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'surplus' && (
        <div className="space-y-8">
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-[#1B4332] uppercase tracking-wider mb-1">
                  <Flame className="w-4 h-4 text-[#1B4332]" />
                  <span>End-of-Day Dynamic Surplus Rescue</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-heading">
                  Rescue Fresh Meals · Falling Dynamic Prices
                </h2>
                <p className="text-xs text-slate-600 mt-1 max-w-2xl">
                  High-quality restaurant portions prepared fresh this evening. Prices drop smoothly as the 11:30 PM closing deadline nears to ensure zero food waste.
                </p>
              </div>

              <div className="flex items-center gap-2.5 bg-white px-3.5 py-2 rounded-lg border border-slate-200 shrink-0">
                <Timer className="w-4 h-4 text-[#1B4332]" />
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block leading-tight">Closing Countdown</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 font-heading">
                    Closes at 11:30 PM (Real-Time Decay Active)
                  </span>
                </div>
              </div>
            </div>

            {activeSurplusListings.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-slate-200/60 text-slate-500 text-xs">
                All surplus rescue portions for this shift have been claimed! Check back at 08:30 PM.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {activeSurplusListings.map((listing) => {
                  const livePrice = listing.currentPrice ?? calculateLiveSurplusPrice(listing);
                  const discountPercent = Math.round(
                    ((listing.originalPrice - livePrice) / listing.originalPrice) * 100
                  );
                  const inCart = cart.find(
                    (c) => c.isSurplus && c.surplusListingId === listing.id
                  );

                  return (
                    <div
                      key={listing.id}
                      className="bg-white rounded-3xl border border-slate-200 overflow-hidden transition-colors flex flex-col justify-between group"
                    >
                      <div>
                        <div className="relative h-48 bg-slate-100 overflow-hidden">
                          <img
                            src={
                              listing.imageUrl ||
                              'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=600&auto=format&fit=crop&q=80'
                            }
                            alt={listing.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute top-3 left-3 flex gap-1.5 items-center">
                            {listing.isVeg && (
                              <span className="w-4.5 h-4.5 rounded-[4px] bg-white border border-emerald-600 flex items-center justify-center p-0.5" title="Pure Veg">
                                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                              </span>
                            )}
                            <span className="px-3 py-1 rounded-full bg-[#1B4332] text-white text-[10px] font-bold flex items-center gap-1 shadow-xs">
                              <TrendingDown className="w-3 h-3" /> {discountPercent}% OFF
                            </span>
                          </div>

                          <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-black/60 text-white text-[10px] font-medium backdrop-blur-xs flex items-center gap-1">
                            <Clock className="w-3 h-3 text-emerald-400" /> Only {listing.quantityAvailable} left
                          </div>
                        </div>

                        <div className="p-5 space-y-2">
                          <h3 className="text-base font-bold text-slate-900 leading-snug font-heading">
                            {listing.name}
                          </h3>
                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                            {listing.prepTimeInfo || 'Chef-packaged tamper-proof box ready for immediate rescue & dispatch.'}
                          </p>

                          <div className="mt-2 pt-1 p-2.5 rounded-xl bg-[#1B4332]/5 border border-[#1B4332]/15 text-[11px] text-[#1B4332] space-y-1">
                            <div className="flex justify-between font-medium">
                              <span className="text-zinc-700">Original: ₹{listing.originalPrice}</span>
                              <span className="font-bold text-[#1B4332]">Floor Min: ₹{listing.minPrice}</span>
                            </div>
                            <div className="w-full bg-[#1B4332]/15 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-[#1B4332] h-full transition-[width] duration-300 ease-out"
                                style={{
                                  width: `${Math.min(100, Math.max(15, 100 - discountPercent))}%`,
                                }}
                              />
                            </div>
                            <div className="text-[10px] text-[#1B4332] font-semibold text-right">
                              Dynamic price drops continuously toward floor
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-5 pt-0 flex items-center justify-between border-t border-slate-100/80 mt-2">
                        <div className="pt-3">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-lg font-black text-slate-900">
                              ₹{livePrice}
                            </span>
                            <span className="text-xs text-slate-400 line-through">
                              ₹{listing.originalPrice}
                            </span>
                          </div>
                          <span className="text-[10px] text-[#1B4332] font-bold block">
                            Save ₹{listing.originalPrice - livePrice} · Dynamic price
                          </span>
                        </div>

                        <div className="pt-3 flex items-center gap-1.5">
                          {inCart ? (
                            <div className="h-8 w-[88px] flex items-center justify-between bg-[#18181B] text-white rounded-full px-1.5 shrink-0 transition-transform">
                              <button
                                type="button"
                                onClick={() => updateCartQuantity(inCart.id, -1)}
                                className="w-6 h-6 rounded-full hover:bg-white/20 active:scale-90 flex items-center justify-center transition-colors cursor-pointer"
                                title="Decrease quantity"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-xs font-bold px-1">{inCart.quantity}</span>
                              <button
                                type="button"
                                disabled={inCart.quantity >= listing.quantityAvailable}
                                onClick={() => updateCartQuantity(inCart.id, 1)}
                                className="w-6 h-6 rounded-full hover:bg-white/20 active:scale-90 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                title={
                                  inCart.quantity >= listing.quantityAvailable
                                    ? 'Maximum available portions reached'
                                    : 'Increase quantity'
                                }
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleAddItemToCart(listing, true)}
                              className="h-8 px-4 rounded-full bg-[#18181B] hover:bg-black active:scale-95 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Rescue Meal</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight font-heading">
                My Orders & Live Tracking
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Track live preparation, dispatch, and delivery progress synchronized in real time.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('menu')}
                className="px-4 py-2 rounded-full bg-[#1B4332] text-white text-xs font-bold hover:bg-[#143326] transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Order New Meal</span>
              </button>
            </div>
          </div>

          {customerOrders.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-4">
              <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-lg font-bold text-slate-900 font-heading">No Orders Placed Yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Explore our fresh kitchen dishes or rescue discounted closing meals to place your first order.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('menu')}
                className="px-5 py-2.5 rounded-full bg-[#1B4332] text-white text-xs font-bold hover:bg-[#143326] cursor-pointer"
              >
                Browse Menu
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {customerOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 space-y-3.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-sm font-black text-slate-900 font-heading">
                        #{ord.id}
                      </span>
                      <span className="text-[10px] text-slate-400">·</span>
                      <span className="text-[11px] text-slate-500">
                        {new Date(ord.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[9px] tracking-wider ${
                          ord.orderStatus === 'DELIVERED'
                            ? 'bg-[#1B4332]/10 text-[#1B4332]'
                            : ord.orderStatus === 'REJECTED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-[#1B4332]/10 text-[#1B4332]'
                        }`}
                      >
                        {ord.orderStatus.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-base font-black text-slate-900">
                        ₹{ord.finalAmount}
                      </span>
                      <button
                        type="button"
                        onClick={() => setTrackingOrderId(ord.id)}
                        className="px-3.5 py-1.5 rounded-full bg-[#18181B] text-white hover:bg-black text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Clock className="w-3 h-3" />
                        <span>Track Live Progress</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-[11px]">
                    <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                      <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">Dishes Ordered</span>
                      <div className="space-y-0.5">
                        {ord.items.map((i, idx) => (
                          <div key={i.surplusListingId ? `surplus-${i.surplusListingId}` : `item-${i.menuItemId}-${idx}`} className="flex justify-between text-slate-700 leading-snug">
                            <span>{i.quantity}x {i.name}</span>
                            <span className="font-semibold text-slate-900">₹{i.price * i.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                      <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">Delivery Address</span>
                      <p className="text-slate-700 font-medium truncate leading-snug">{ord.deliveryAddress}</p>
                      <span className="text-[9px] text-slate-400 block mt-0.5">Payment: {ord.paymentMethod} ({ord.paymentStatus})</span>
                    </div>

                    <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                      <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">Sustainability Impact</span>
                      <p className="text-[#1B4332] font-bold leading-snug">
                        {ord.hasSurplusItems ? 'Rescued 1 Surplus Meal Portion' : 'Standard Eco Meal'}
                      </p>
                      {ord.savedAmount > 0 && (
                        <span className="text-[10px] text-[#1B4332] font-semibold block">
                          Saved ₹{ord.savedAmount} discount
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'impact' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#1B4332] uppercase tracking-wider">
              <Leaf className="w-4 h-4 text-[#1B4332]" />
              <span>Personal Environmental Ledger</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-heading">
              Your Food Rescue Impact
            </h2>
            <p className="text-xs text-slate-500 max-w-2xl">
              By rescuing surplus meals near closing time, you recover valuable nutrients, prevent landfill methane emissions, and save money.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-3xl p-5 border border-slate-200 space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-[#1B4332]/10 text-[#1B4332] flex items-center justify-center font-bold">
                <Award className="w-5 h-5 text-[#1B4332]" />
              </div>
              <span className="text-xs text-slate-500 font-medium block">Rescued Meals</span>
              <span className="text-2xl font-black text-slate-900 font-heading block">
                {currentUser?.customerProfile?.totalRescuedMeals ?? 0} Meals
              </span>
              <span className="text-[11px] text-[#1B4332] font-semibold block">100% Edible & Fresh</span>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200 space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-[#1B4332]/10 text-[#1B4332] flex items-center justify-center font-bold">
                <DollarSign className="w-5 h-5" />
              </div>
              <span className="text-xs text-slate-500 font-medium block">Total Money Saved</span>
              <span className="text-2xl font-black text-slate-900 font-heading block">
                ₹{currentUser?.customerProfile?.totalSavedAmount ?? 0}
              </span>
              <span className="text-[11px] text-[#1B4332] font-semibold block">Via dynamic surplus discounts</span>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200 space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                <TreePine className="w-5 h-5" />
              </div>
              <span className="text-xs text-slate-500 font-medium block">CO₂ Emissions Prevented</span>
              <span className="text-2xl font-black text-blue-900 font-heading block">
                {(((currentUser?.customerProfile?.totalRescuedMeals ?? 0)) * 2.5).toFixed(1)} kg CO₂e
              </span>
              <span className="text-[11px] text-blue-700 font-semibold block">
                {(currentUser?.customerProfile?.totalRescuedMeals ?? 0) > 0
                  ? `Equivalent to ${((currentUser?.customerProfile?.totalRescuedMeals ?? 0) * 4).toFixed(0)} km drive`
                  : 'Rescue surplus meals to reduce greenhouse gases'}
              </span>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200 space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                <Share2 className="w-5 h-5" />
              </div>
              <span className="text-xs text-slate-500 font-medium block">Rescue Rank</span>
              <span className="text-2xl font-black text-purple-900 font-heading block">
                {(currentUser?.customerProfile?.totalRescuedMeals ?? 0) > 10
                  ? 'Champion'
                  : (currentUser?.customerProfile?.totalRescuedMeals ?? 0) > 5
                  ? 'Top 5%'
                  : (currentUser?.customerProfile?.totalRescuedMeals ?? 0) > 0
                  ? 'Eco Hero'
                  : 'Starter'}
              </span>
              <span className="text-[11px] text-purple-700 font-semibold block">
                {(currentUser?.customerProfile?.totalRescuedMeals ?? 0) > 0
                  ? 'Bengaluru Foodie Community'
                  : 'Start rescuing to climb ranks'}
              </span>
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {cart.length > 0 && !isCartOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed bottom-16 sm:bottom-18 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-lg transition-transform duration-300"
          >
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="w-full bg-[#1B4332] hover:bg-[#143326] active:scale-[0.99] text-white p-3.5 sm:p-4 px-5 sm:px-6 rounded-full flex items-center justify-between border border-[#1B4332]/40 transition-all cursor-pointer shadow-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center font-bold text-white shrink-0">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold font-heading">
                    {cartItemCount} {cartItemCount === 1 ? 'dish' : 'dishes'} in Basket
                  </p>
                  <p className="text-[11px] font-semibold text-[#95D5B2]">
                    {cartSavings > 0 ? `Saved ₹${cartSavings} with surplus rescue` : 'Fresh kitchen order'}
                  </p>
                </div>
              </div>
              <span className="text-xl font-black font-heading pr-1">₹{cartTotal + 35}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCartOpen && (
          <motion.div
            key="cart-portal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 overflow-hidden flex justify-end"
          >
            <div
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-md cursor-pointer"
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 350 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md bg-white h-full flex flex-col justify-between shadow-2xl z-10 cursor-default"
            >

              <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-white">
                <div className="flex items-center gap-2.5">
                  <ShoppingBag className="w-5 h-5 text-black" />
                  <h2 className="text-lg font-extrabold text-black font-heading">Your Food Basket</h2>
                  <span className="text-xs bg-zinc-100 text-black px-2.5 py-0.5 rounded-full font-bold">
                    {cartItemCount}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="text-zinc-400 hover:text-black p-1.5 rounded-full hover:bg-zinc-100 transition-colors cursor-pointer"
                  title="Close basket"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4 bg-white">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-3 text-zinc-400 py-16">
                    <ShoppingBag className="w-12 h-12 stroke-[1.5] text-black" />
                    <p className="text-sm font-bold text-black font-heading">Your basket is empty</p>
                    <p className="text-xs max-w-xs text-zinc-500">
                      Add fresh specialties or rescue high-discount meals before closing!
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCartOpen(false);
                        setActiveTab('menu');
                      }}
                      className="mt-2 px-5 py-2.5 bg-[#18181B] text-white text-xs font-bold rounded-full hover:bg-black cursor-pointer"
                    >
                      Explore Menu
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-100">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="py-3.5 flex items-center justify-between text-xs"
                      >
                        <div className="flex-1 min-w-0 pr-3">
                          <div className="flex items-center gap-1.5">
                            {item.isSurplus && (
                              <span className="px-2 py-0.5 rounded-full bg-[#18181B] text-white text-[9px] font-bold">
                                RESCUE
                              </span>
                            )}
                            <span className="font-bold text-zinc-900 truncate block">
                              {item.name}
                            </span>
                          </div>
                          <span className="text-zinc-500 text-[11px] block mt-0.5">
                            ₹{item.price} each {item.originalPrice && `· (was ₹${item.originalPrice})`}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center border border-zinc-200 rounded-full bg-white px-1">
                            <button
                              type="button"
                              onClick={() => updateCartQuantity(item.id, -1)}
                              className="p-1 text-zinc-500 hover:text-black cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="px-2 font-bold text-zinc-900 text-xs">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateCartQuantity(item.id, 1)}
                              className="p-1 text-zinc-500 hover:text-black cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.id)}
                            className="text-zinc-400 hover:text-zinc-900 p-1 cursor-pointer"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    <div className="pt-4 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 text-zinc-800 font-semibold">
                        <MapPin className="w-3.5 h-3.5 text-zinc-900" />
                        <span>Deliver to:</span>
                      </div>
                      <p className="text-[11px] text-zinc-600 truncate">{deliveryAddress}</p>
                    </div>
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-6 border-t border-zinc-100 bg-white space-y-3">
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-zinc-600">
                      <span>Items Subtotal</span>
                      <span className="font-semibold text-zinc-900">₹{cartTotal}</span>
                    </div>
                    {cartSavings > 0 && (
                      <div className="flex justify-between text-zinc-900 font-semibold">
                        <span>Surplus Rescue Savings</span>
                        <span>-₹{cartSavings}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-zinc-600">
                      <span>Eco-Packaging & Delivery</span>
                      <span className="font-semibold text-zinc-900">₹35</span>
                    </div>
                    <div className="flex justify-between text-base font-black text-zinc-900 pt-2 border-t border-zinc-200">
                      <span>Total Payable</span>
                      <span className="font-black text-zinc-950">₹{cartTotal + 35}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowCheckoutModal(true)}
                    className="w-full py-3.5 px-4 rounded-full bg-[#18181B] hover:bg-black text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                  >
                    Proceed to Payment · ₹{cartTotal + 35}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCheckoutModal && (
          <motion.div
            key="checkout-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => {
              if (paymentPhase === 'IDLE') setShowCheckoutModal(false);
            }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto cursor-pointer"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ type: 'spring', damping: 28, stiffness: 350 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl w-full max-w-4xl border border-zinc-200 max-h-[84vh] flex flex-col overflow-hidden shadow-2xl cursor-default my-auto"
            >
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-white shrink-0">
              <div>
                <h3 className="text-base font-extrabold text-zinc-900 font-heading">Complete Payment & Order</h3>
                <p className="text-[11px] text-zinc-400 font-normal">Encrypted secure checkout · Real-time order dispatch</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (paymentPhase === 'IDLE') setShowCheckoutModal(false);
                }}
                disabled={paymentPhase !== 'IDLE'}
                className="text-zinc-400 hover:text-zinc-900 p-1.5 rounded-full hover:bg-zinc-100 transition-colors cursor-pointer disabled:opacity-40"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-6 flex-1">

              <div className="md:col-span-7 space-y-4">
                <label className="text-xs font-bold text-slate-700 block">
                  Select Payment Rail:
                </label>

                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod('UPI')}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                      selectedPaymentMethod === 'UPI'
                        ? 'border-[#1B4332] bg-[#1B4332]/10 text-[#1B4332] font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <QrCode className="w-5 h-5 mx-auto mb-1 text-[#1B4332]" />
                    <span className="text-xs block">UPI / QR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod('CARD')}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                      selectedPaymentMethod === 'CARD'
                        ? 'border-[#1B4332] bg-[#1B4332]/10 text-[#1B4332] font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 mx-auto mb-1 text-slate-800" />
                    <span className="text-xs block">Card</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod('COD')}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                      selectedPaymentMethod === 'COD'
                        ? 'border-[#1B4332] bg-[#1B4332]/10 text-[#1B4332] font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Banknote className="w-5 h-5 mx-auto mb-1 text-[#1B4332]" />
                    <span className="text-xs block">Pay on Delivery</span>
                  </button>
                </div>

                {selectedPaymentMethod === 'UPI' && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3.5">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setUpiMethodType('APP')}
                        className={`flex-1 py-1.5 text-xs rounded-full font-bold transition-all cursor-pointer ${
                          upiMethodType === 'APP'
                            ? 'bg-[#18181B] text-white'
                            : 'bg-white text-slate-600 border border-slate-200'
                        }`}
                      >
                        UPI Apps
                      </button>
                      <button
                        type="button"
                        onClick={() => setUpiMethodType('ID')}
                        className={`flex-1 py-1.5 text-xs rounded-full font-bold transition-all cursor-pointer ${
                          upiMethodType === 'ID'
                            ? 'bg-[#18181B] text-white'
                            : 'bg-white text-slate-600 border border-slate-200'
                        }`}
                      >
                        UPI ID
                      </button>
                      <button
                        type="button"
                        onClick={() => setUpiMethodType('QR')}
                        className={`flex-1 py-1.5 text-xs rounded-full font-bold transition-all cursor-pointer ${
                          upiMethodType === 'QR'
                            ? 'bg-[#18181B] text-white'
                            : 'bg-white text-slate-600 border border-slate-200'
                        }`}
                      >
                        Scan QR
                      </button>
                    </div>

                    {upiMethodType === 'APP' && (
                      <div className="space-y-2">
                        <span className="text-[11px] text-slate-500 block font-medium">Select Installed UPI Application:</span>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            {
                              id: 'GPAY',
                              name: 'Google Pay',
                              icon: (
                                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.67v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.16z"/>
                                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.4 7.33 24 12 24z"/>
                                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.15 0 9.99 0 12s.45 3.85 1.24 5.42l4.04-3.15z"/>
                                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.6 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                                </svg>
                              ),
                            },
                            {
                              id: 'PHONEPE',
                              name: 'PhonePe',
                              icon: (
                                <div className="w-5 h-5 rounded-full bg-[#5f259f] flex items-center justify-center text-white font-black text-[10px] shrink-0 leading-none">
                                  पे
                                </div>
                              ),
                            },
                            {
                              id: 'PAYTM',
                              name: 'Paytm UPI',
                              icon: (
                                <div className="h-5 px-2 rounded-md bg-[#002970] flex items-center justify-center shrink-0 shadow-xs">
                                  <span className="text-white font-black text-[11px] tracking-normal leading-none">Pay</span>
                                  <span className="text-[#00BAF2] font-black text-[11px] tracking-normal leading-none">tm</span>
                                </div>
                              ),
                            },
                            {
                              id: 'CRED',
                              name: 'CRED UPI',
                              icon: (
                                <div className="w-5 h-5 rounded-full bg-black flex items-center justify-center text-white font-bold text-[10px] shrink-0">
                                  C
                                </div>
                              ),
                            },
                          ].map((app) => (
                            <button
                              key={app.id}
                              type="button"
                              onClick={() => setSelectedUpiApp(app.id as any)}
                              className={`p-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between cursor-pointer ${
                                selectedUpiApp === app.id
                                  ? 'border-black bg-white text-black font-extrabold ring-1 ring-black'
                                  : 'border-slate-200 bg-white text-black hover:border-slate-400'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {app.icon}
                                <span className="text-black font-extrabold">{app.name}</span>
                              </div>
                              {selectedUpiApp === app.id && <Check className="w-3.5 h-3.5 text-black stroke-[3]" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {upiMethodType === 'ID' && (
                      <div className="space-y-1.5">
                        <label className="text-[11px] text-slate-600 font-medium block">Enter your Virtual Payment Address (VPA):</label>
                        <input
                          type="text"
                          value={upiIdInput}
                          onChange={(e) => setUpiIdInput(e.target.value)}
                          placeholder="e.g. mobile@okhdfcbank or name@paytm"
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white outline-none focus:ring-2 focus:ring-[#1B4332]"
                        />
                        <span className="text-[10px] text-[#1B4332] font-medium block">
                          Verified VPA · Instant mandate will be authorized
                        </span>
                      </div>
                    )}

                    {upiMethodType === 'QR' && (
                      <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-slate-200">
                        <div className="w-20 h-20 bg-slate-900 text-white rounded-xl flex items-center justify-center p-2 shrink-0">
                          <QrCode className="w-16 h-16 text-white" />
                        </div>
                        <div className="text-xs space-y-1">
                          <span className="font-bold text-slate-900 block font-heading">Scan with any UPI App</span>
                          <p className="text-[11px] text-slate-500">Scan using GPay, PhonePe, Paytm, or BHIM</p>
                          <span className="text-[11px] font-bold text-[#1B4332] block">
                            Amount: ₹{payableGrandTotal}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {selectedPaymentMethod === 'CARD' && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div>
                      <label className="text-[11px] text-slate-600 font-medium block mb-1">Card Number</label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="4532 8901 2345 6789"
                        maxLength={19}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white outline-none focus:ring-2 focus:ring-[#1B4332]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-slate-600 font-medium block mb-1">Expiry Date</label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          placeholder="MM/YY"
                          maxLength={5}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white outline-none focus:ring-2 focus:ring-[#1B4332]"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-600 font-medium block mb-1">CVV / CVC</label>
                        <input
                          type="password"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          placeholder="•••"
                          maxLength={4}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white outline-none focus:ring-2 focus:ring-[#1B4332]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-600 font-medium block mb-1">Cardholder Name</label>
                      <input
                        type="text"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        placeholder="Full Name as printed on card"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white outline-none focus:ring-2 focus:ring-[#1B4332]"
                      />
                    </div>
                  </div>
                )}

                {selectedPaymentMethod === 'COD' && (
                  <div className="p-4 rounded-2xl bg-[#1B4332]/5 border border-[#1B4332]/20 text-xs text-[#1B4332] space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-[#1B4332]">
                      <Banknote className="w-4 h-4 text-[#1B4332]" />
                      <span>Pay On Arrival</span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Pay ₹{payableGrandTotal} via cash or scan rider's dynamic UPI QR code on delivery handover.
                    </p>
                  </div>
                )}
              </div>

              <div className="md:col-span-5 space-y-4 flex flex-col justify-between">
                <div className="space-y-3.5">

                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-slate-700 block">
                      Tip Delivery Partner (100% to rider):
                    </span>
                    <div className="flex gap-1.5">
                      {[0, 20, 30, 50].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setSelectedTip(amt)}
                          className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                            selectedTip === amt
                              ? 'bg-[#18181B] text-white border-[#18181B]'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {amt === 0 ? 'No Tip' : `₹${amt}`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1 block">
                      Delivery Instructions:
                    </label>
                    <input
                      type="text"
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      placeholder="e.g. Leave with guard, ring bell"
                      className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-full focus:ring-2 focus:ring-black outline-none"
                    />
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1.5">
                    <div className="flex justify-between text-slate-600 text-[11px]">
                      <span>Dishes Subtotal</span>
                      <span className="font-semibold text-slate-800">₹{cartTotal}</span>
                    </div>
                    {cartSavings > 0 && (
                      <div className="flex justify-between text-zinc-900 font-semibold text-[11px]">
                        <span>Surplus Rescue Savings</span>
                        <span className="font-bold">-₹{cartSavings}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-600 text-[11px]">
                      <span>Eco-Delivery Fee</span>
                      <span className="font-semibold text-slate-800">₹{deliveryFee}</span>
                    </div>
                    {selectedTip > 0 && (
                      <div className="flex justify-between text-slate-600 text-[11px]">
                        <span>Rider Tip</span>
                        <span className="font-semibold text-slate-800">₹{selectedTip}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                      <span>Total Payable</span>
                      <span className="text-zinc-950 font-black">₹{payableGrandTotal}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleExecuteCheckout}
                  disabled={paymentPhase !== 'IDLE'}
                  className="w-full py-3.5 px-4 rounded-full bg-[#18181B] hover:bg-black text-white text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
                >
                  {paymentPhase === 'PROCESSING' ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Contacting Payment Rail & Authorizing...</span>
                    </div>
                  ) : paymentPhase === 'SUCCESS' ? (
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span>Payment Authorized! Placing Order...</span>
                    </div>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-emerald-300" />
                      <span>Authorize Payment · ₹{payableGrandTotal}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {trackingOrder && (
          <motion.div
            key="tracking-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => {
              setTrackingOrderId(null);
              setIsAutoSimulating(false);
            }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto cursor-pointer"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ type: 'spring', damping: 28, stiffness: 350 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl w-full max-w-4xl sm:max-w-5xl max-h-[82vh] overflow-hidden border border-slate-200 shadow-2xl flex flex-col cursor-default my-auto"
            >
            <div className="px-6 py-3.5 border-b border-slate-200 flex items-center justify-between bg-white text-black shrink-0">
              <div className="flex items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-black text-black uppercase tracking-wider">
                      Order #{trackingOrder.id}
                    </h2>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#1B4332] bg-[#1B4332]/10 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1B4332]" />
                      Real-Time Sync
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium">Live GPS status synchronized across kitchen & courier</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setTrackingOrderId(null);
                  setIsAutoSimulating(false);
                }}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-100">

              <div className="md:col-span-7 p-6 space-y-4">

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-2">
                    <span>Current Stage:</span>
                    <span className="text-[#1B4332] font-extrabold uppercase">
                      {trackingOrder.orderStatus.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#1B4332] h-full transition-[width] duration-500 ease-out"
                      style={{
                        width: `${Math.max(
                          12,
                          ((getStatusStepIndex(trackingOrder.orderStatus) + 1) / 8) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {trackingOrder.orderStatus !== 'DELIVERED' && trackingOrder.orderStatus !== 'REJECTED' && (
                  <div className="p-4 rounded-2xl bg-[#1B4332] text-white space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-[#74C69D]" /> Live Lifecycle Controls
                      </span>
                      <span className="text-[10px] text-white/70 font-medium">Stage Testing</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          advanceOrderSimulation(trackingOrder.id);
                        }}
                        className="flex-1 py-2 px-3 rounded-full bg-white hover:bg-zinc-100 text-[#1B4332] font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <ChevronRight className="w-3.5 h-3.5 text-[#1B4332]" /> Advance Next Stage
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsAutoSimulating(!isAutoSimulating)}
                        className={`px-3 py-2 rounded-full font-bold transition-all cursor-pointer ${
                          isAutoSimulating
                            ? 'bg-black text-white border border-white/20'
                            : 'bg-[#143326] text-white border border-white/20 hover:bg-[#0f281e]'
                        }`}
                      >
                        {isAutoSimulating ? 'Pause Auto-Run' : 'Auto-Run (3.5s)'}
                      </button>
                    </div>
                    <p className="text-[10px] text-white/80">
                      Switch to the <strong>Restaurant</strong> portal to manage kitchen prep or <strong>Delivery</strong> portal to accept the trip!
                    </p>
                  </div>
                )}

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#1B4332] text-white flex items-center justify-center font-bold text-sm">
                        <Bike className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <span className="font-extrabold text-slate-900 block font-heading text-xs">
                          {trackingOrder.deliveryPartnerName
                            ? `Partner: ${trackingOrder.deliveryPartnerName}`
                            : 'Delivery Partner Assigned'}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {trackingOrder.deliveryPartnerVehicle
                            ? `${trackingOrder.deliveryPartnerVehicle} · GPS Live Connected`
                            : 'Verified Eco-Fleet Courier · GPS Live Connected'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => triggerNotification('Delivery Support', 'Connecting to Delivery Partner Support desk...')}
                        className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                        title="Call Partner"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => triggerNotification('Partner Chat', 'Partner is en route with your fresh meal order.')}
                        className="w-8 h-8 rounded-full bg-black text-white hover:bg-zinc-800 flex items-center justify-center transition-colors cursor-pointer"
                        title="Chat with Partner"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="relative p-3 rounded-2xl bg-white border border-slate-200/80 text-xs text-slate-700 font-medium">
                    <p>
                      {trackingOrder.orderStatus === 'DELIVERED'
                        ? 'Order has been safely delivered to your doorstep. Thank you for choosing eco-friendly dining!'
                        : 'Your delivery partner has been assigned and will collect your freshly prepared meal as soon as kitchen prep completes.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200/80">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Courier Status</span>
                      <span className="font-extrabold text-slate-900 flex items-center gap-1 mt-0.5">
                        <Bike className="w-3.5 h-3.5 text-[#1B4332]" />
                        {trackingOrder.orderStatus === 'DELIVERED' ? 'Delivered' : 'On the way'}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200/80">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Estimated Time</span>
                      <span className="font-extrabold text-slate-900 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-zinc-700" />
                        {trackingOrder.orderStatus === 'DELIVERED' ? '0 min' : '10-15 min'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="md:col-span-5 p-6 bg-slate-50/50 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider font-heading">
                      Order Breakdown
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                      {trackingOrder.items.reduce((sum, item) => sum + item.quantity, 0)} Items
                    </span>
                  </div>

                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {trackingOrder.items.map((i, idx) => (
                      <div key={i.surplusListingId ? `surplus-${i.surplusListingId}` : `item-${i.menuItemId}-${idx}`} className="flex justify-between items-center p-2 rounded-xl bg-white border border-slate-200/80 text-xs">
                        <span className="font-medium text-slate-700">
                          <strong className="text-slate-900 font-extrabold mr-1">{i.quantity}x</strong>
                          {i.name}
                        </span>
                        <span className="font-bold text-slate-900">₹{i.price * i.quantity}</span>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 rounded-2xl bg-white border border-slate-200/80 text-xs space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Delivery Destination</span>
                    <p className="font-bold text-slate-800 line-clamp-2">{trackingOrder.deliveryAddress}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 space-y-2">
                  <div className="flex justify-between items-center text-xs text-slate-600">
                    <span>Payment Method:</span>
                    <span className="font-bold text-slate-900 px-2 py-0.5 rounded-full bg-slate-200/70 text-[11px]">
                      {trackingOrder.paymentMethod}
                    </span>
                  </div>
                  <div className="flex justify-between items-center font-extrabold text-slate-900 text-sm">
                    <span>Total Amount:</span>
                    <span className="text-[#1B4332] text-base">₹{trackingOrder.finalAmount}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

      <DishDetailModal
        dish={selectedDishForDetail}
        onClose={() => setSelectedDishForDetail(null)}
      />

    </div>
  );
};
