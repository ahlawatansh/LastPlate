import React, { useState, useEffect, useRef } from 'react';
import {
  Bike,
  Navigation,
  CheckCircle2,
  Clock,
  MapPin,
  TrendingUp,
  DollarSign,
  AlertCircle,
  Tag,
  Phone,
  ChevronRight,
  ShieldCheck,
  Play,
  Pause,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Order, OrderStatus } from '../../types';
import { ScheduleCalendarView } from '../calendar/ScheduleCalendarView';

interface DeliveryPortalProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const DeliveryPortal: React.FC<DeliveryPortalProps> = ({
  activeTab,
  setActiveTab,
}) => {
  const {
    currentUser,
    orders,
    deliveryAcceptOrder,
    deliveryDeclineOrder,
    deliveryUpdateStatus,
    searchQuery,
  } = useApp();

  const [isOnline, setIsOnline] = useState<boolean>(() => {
    const saved = localStorage.getItem('lastplate_delivery_online');
    return saved !== null ? saved === 'true' : true;
  });

  const toggleOnlineStatus = () => {
    setIsOnline((prev) => {
      const next = !prev;
      localStorage.setItem('lastplate_delivery_online', String(next));
      return next;
    });
  };

  const availablePoolOrders = orders.filter((o) => {
    const isAvailable = ['RESTAURANT_ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP'].includes(o.orderStatus) && !o.deliveryPartnerId;
    if (!isAvailable) return false;
    if (currentUser?.id && o.declinedByDeliveryPartnerIds?.includes(currentUser.id)) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return o.id.toLowerCase().includes(q) ||
      o.restaurantName.toLowerCase().includes(q) ||
      o.deliveryAddress.toLowerCase().includes(q);
  });

  const activeDelivery = orders.find(
    (o) =>
      o.deliveryPartnerId === currentUser?.id &&
      !['DELIVERED', 'REJECTED', 'CANCELLED'].includes(o.orderStatus)
  );

  const completedDeliveries = orders.filter(
    (o) =>
      o.deliveryPartnerId === currentUser?.id &&
      o.orderStatus === 'DELIVERED'
  );

  const totalEarnings = (completedDeliveries.length * 45) + (activeDelivery ? 45 : 0);

  const [claimError, setClaimError] = useState<string | null>(null);
  const [declinedNotice, setDeclinedNotice] = useState<string | null>(null);
  const [completedOrderSummary, setCompletedOrderSummary] = useState<Order | null>(null);
  const [isAutoSimulating, setIsAutoSimulating] = useState(false);

  const activeDeliveryRef = useRef(activeDelivery);
  activeDeliveryRef.current = activeDelivery;
  const deliveryUpdateStatusRef = useRef(deliveryUpdateStatus);
  deliveryUpdateStatusRef.current = deliveryUpdateStatus;

  useEffect(() => {
    if (!isAutoSimulating || !activeDelivery) {
      if (isAutoSimulating) setIsAutoSimulating(false);
      return;
    }

    const intervalId = setInterval(() => {
      const current = activeDeliveryRef.current;
      if (!current) {
        setIsAutoSimulating(false);
        return;
      }
      if (current.orderStatus === 'DELIVERY_ASSIGNED') {
        deliveryUpdateStatusRef.current(current.id, 'PICKED_UP');
      } else if (current.orderStatus === 'PICKED_UP') {
        deliveryUpdateStatusRef.current(current.id, 'OUT_FOR_DELIVERY');
      } else if (current.orderStatus === 'OUT_FOR_DELIVERY') {
        deliveryUpdateStatusRef.current(current.id, 'DELIVERED');
        setCompletedOrderSummary({ ...current, orderStatus: 'DELIVERED' });
        setIsAutoSimulating(false);
      } else {
        setIsAutoSimulating(false);
      }
    }, 3500);

    return () => clearInterval(intervalId);
  }, [isAutoSimulating, activeDelivery?.id]);

  const handleClaimOrder = (orderId: string) => {
    setClaimError(null);
    setDeclinedNotice(null);
    setCompletedOrderSummary(null);
    deliveryAcceptOrder(orderId);
    setActiveTab('active');
  };

  const handleDeclineOrder = (orderId: string) => {
    deliveryDeclineOrder(orderId);
    setDeclinedNotice(`Trip #${orderId} was declined and returned to dispatch pool.`);
    if (activeDelivery?.id === orderId) {
      setIsAutoSimulating(false);
      setActiveTab('pool');
    }
    setTimeout(() => setDeclinedNotice(null), 4000);
  };

  const handleHandoverAndComplete = (order: Order) => {
    setIsAutoSimulating(false);
    setCompletedOrderSummary({ ...order, orderStatus: 'DELIVERED' });
    deliveryUpdateStatus(order.id, 'DELIVERED');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-5 pb-28 space-y-8">

      {claimError && (
        <div className="p-4 rounded-2xl bg-[#1B4332]/10 border border-[#1B4332]/20 text-[#1B4332] text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#1B4332] shrink-0" />
            <span>{claimError}</span>
          </div>
          <button
            onClick={() => setClaimError(null)}
            className="text-[#1B4332] font-bold hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {declinedNotice && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{declinedNotice}</span>
          </div>
          <button
            onClick={() => setDeclinedNotice(null)}
            className="text-amber-800 font-bold hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#1B4332] font-bold uppercase tracking-wider mb-1">
            <Bike className="w-4 h-4" />
            <span>Delivery Fleet Console</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight font-heading">
            Live Dispatch & Route Navigator
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Accept pending restaurant dispatch trips, navigate routes, and complete deliveries with simulated proof.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">

          <button
            type="button"
            onClick={toggleOnlineStatus}
            className={`px-4 py-2 rounded-2xl min-w-[110px] h-[58px] sm:h-[62px] border flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
              isOnline
                ? 'bg-[#1B4332] text-white border-[#1B4332]'
                : 'bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-200'
            }`}
            title={isOnline ? 'Click to switch to Offline' : 'Click to switch to Online'}
          >
            <span className="text-[9px] uppercase font-bold tracking-wider opacity-75">
              Duty Mode
            </span>
            <span className="text-[11px] sm:text-xs font-black tracking-tight mt-0.5">
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </span>
          </button>

          <div className="px-4 py-2 rounded-2xl min-w-[110px] h-[58px] sm:h-[62px] border border-slate-200 bg-white flex flex-col items-center justify-center text-center">
            <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">
              Earnings
            </span>
            <span className="text-sm sm:text-base font-black text-slate-900 font-heading mt-0.5">
              ₹{totalEarnings}
            </span>
          </div>
        </div>
      </div>

      {activeTab === 'calendar' && (
        <div className="space-y-6">
          <ScheduleCalendarView mode="CUSTOMER" />
        </div>
      )}

      {activeTab === 'pool' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 font-heading">Available Dispatch Pool</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Orders confirmed by restaurants and open to all active riders. First to accept locks the dispatch.
              </p>
            </div>
            <span className="text-xs font-bold text-white bg-[#18181B] px-3.5 py-1.5 rounded-xl border border-zinc-800">
              {availablePoolOrders.length} Trips Available
            </span>
          </div>

          {!isOnline && (
            <div className="p-4 rounded-2xl bg-[#1B4332]/10 border border-[#1B4332]/20 text-xs text-[#1B4332] flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-[#1B4332] shrink-0" />
              <span>You are currently <strong className="text-[#1B4332]">Offline</strong>. Switch to Online mode above to accept new delivery orders.</span>
            </div>
          )}

          {availablePoolOrders.length === 0 ? (
            <div className="p-16 text-center bg-white rounded-3xl border border-slate-200">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Bike className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800 font-heading">No Orders in Dispatch Pool Right Now</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                When restaurants accept incoming customer orders, they will instantly appear here for pickup.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {availablePoolOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">
                          #{ord.id}
                        </span>
                        {ord.hasSurplusItems && (
                          <span className="text-[10px] font-bold text-[#1B4332] bg-[#1B4332]/10 px-2 py-0.5 rounded-full flex items-center gap-1 border border-[#1B4332]/20">
                            <Tag className="w-3 h-3" /> SURPLUS RESCUE
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Restaurant status: <strong className="text-slate-800 font-semibold">{ord.orderStatus.replace(/_/g, ' ')}</strong>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-[#1B4332] bg-[#1B4332]/10 px-2.5 py-1 rounded-full border border-[#1B4332]/20">
                        + ₹45 Payout
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-1 font-medium">Est. 25 min trip</span>
                    </div>
                  </div>

                  <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                    <div className="flex items-start gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Pickup:</span>
                        <span className="font-bold text-slate-900">{ord.restaurantName}</span>
                        <span className="text-slate-500 block text-[11px]">12th Main Road, Indiranagar, Bengaluru</span>
                      </div>
                    </div>

                    <div className="h-3 w-px bg-slate-300 ml-1" />

                    <div className="flex items-start gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-[#1B4332] mt-1.5 shrink-0" />
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Drop-off:</span>
                        <span className="font-bold text-slate-900">{ord.customerName}</span>
                        <span className="text-slate-500 block text-[11px] truncate max-w-xs">{ord.deliveryAddress}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                    <span className="flex items-center gap-1">
                      <Navigation className="w-3.5 h-3.5 text-blue-600" />
                      Distance: <strong className="text-slate-800">{ord.deliveryDistanceKm} km</strong>
                    </span>
                    <span>{ord.items.length} items packed</span>
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button
                      onClick={() => handleClaimOrder(ord.id)}
                      disabled={!isOnline}
                      className="flex-1 py-2.5 px-4 rounded-full bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Accept & Lock Delivery
                    </button>
                    <button
                      onClick={() => handleDeclineOrder(ord.id)}
                      className="py-2.5 px-4 rounded-full bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'active' && (
        <div className="space-y-6">
          {!activeDelivery ? (
            completedOrderSummary ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 text-center space-y-6 max-w-xl mx-auto shadow-xs">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#1B4332] flex items-center justify-center mx-auto ring-8 ring-emerald-50">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div className="space-y-2">
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold text-xs border border-emerald-200">
                    Delivery Completed Successfully
                  </span>
                  <h2 className="text-2xl font-black text-slate-900 font-heading">
                    Order #{completedOrderSummary.id} Handed Over
                  </h2>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Trip completed at {completedOrderSummary.deliveryAddress}. Payout of ₹45.00 has been credited to your balance.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-around">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Trip Payout</span>
                    <span className="text-xl font-black text-[#1B4332]">₹45.00</span>
                  </div>
                  <div className="h-8 w-px bg-slate-200" />
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Customer</span>
                    <span className="text-sm font-bold text-slate-800">{completedOrderSummary.customerName}</span>
                  </div>
                  <div className="h-8 w-px bg-slate-200" />
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Distance</span>
                    <span className="text-sm font-bold text-slate-800">{completedOrderSummary.deliveryDistanceKm} km</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      setCompletedOrderSummary(null);
                      setActiveTab('pool');
                    }}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-[#18181B] hover:bg-black text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                  >
                    Accept Next Order (Available Pool)
                  </button>
                  <button
                    onClick={() => {
                      setCompletedOrderSummary(null);
                      setActiveTab('history');
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    View Trip History & Earnings
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-16 text-center bg-white rounded-3xl border border-slate-200">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <Navigation className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-800 font-heading">No Active Delivery in Progress</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Head over to the Available Pool to accept a delivery order.
                </p>
                <button
                  onClick={() => setActiveTab('pool')}
                  className="mt-4 px-4 py-2 rounded-full bg-[#1B4332] text-white text-xs font-bold cursor-pointer"
                >
                  Go to Available Pool
                </button>
              </div>
            )
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6">

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                    IN PROGRESS · ORDER #{activeDelivery.id}
                  </span>
                  <h2 className="text-xl font-bold text-slate-900 mt-1 font-heading">
                    Live Route & Delivery Execution
                  </h2>
                </div>
                <div className="text-right">
                  <span className="text-sm font-extrabold text-emerald-700">
                    Payout: ₹45.00
                  </span>
                  <span className="text-[11px] text-slate-400 block font-medium">Distance: {activeDelivery.deliveryDistanceKm} km</span>
                </div>
              </div>

              <div className="relative h-64 bg-slate-950 rounded-2xl overflow-hidden border border-slate-200 flex flex-col justify-between p-6 text-white">

                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />

                <div className="relative z-10 flex justify-between items-start">
                  <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-xs">
                    <span className="text-slate-400 block text-[10px]">CURRENT TARGET</span>
                    <span className="font-bold text-white">
                      {activeDelivery.orderStatus === 'DELIVERY_ASSIGNED'
                        ? 'Navigating to Green Leaf Kitchen (Pickup)'
                        : 'Navigating to Customer Address (Drop-off)'}
                    </span>
                  </div>

                  <div className="bg-blue-600/80 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5" />
                    <span>GPS Simulation Live</span>
                  </div>
                </div>

                <div className="relative z-10 flex items-center justify-between max-w-md mx-auto w-full px-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs">
                      1
                    </div>
                    <span className="text-[10px] text-slate-300 mt-1 font-medium">Kitchen</span>
                  </div>

                  <div className="flex-1 h-1 bg-gradient-to-r from-amber-500 via-blue-500 to-emerald-500 mx-2 rounded-full relative">
                    <div
                      className="absolute -top-2 w-5 h-5 rounded-full bg-white text-blue-900 flex items-center justify-center text-[10px] transition-[left] duration-500 ease-out"
                      style={{
                        left:
                          activeDelivery.orderStatus === 'DELIVERY_ASSIGNED'
                            ? '10%'
                            : activeDelivery.orderStatus === 'PICKED_UP'
                            ? '50%'
                            : '85%',
                      }}
                    >
                      <Bike className="w-3 h-3 text-blue-700" />
                    </div>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-[#1B4332] text-white flex items-center justify-center font-bold text-xs">
                      2
                    </div>
                    <span className="text-[10px] text-slate-300 mt-1 font-medium">Customer</span>
                  </div>
                </div>

                <div className="relative z-10 text-xs text-slate-400">
                  <span>Simulated Route: Indiranagar 100ft Rd → Domlur Flyover → Koramangala 4th Block, Bengaluru</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Customer Details</span>
                  <p className="font-bold text-slate-900 text-sm font-heading">{activeDelivery.customerName}</p>
                  <p className="text-slate-600 leading-relaxed">{activeDelivery.deliveryAddress}</p>
                  <p className="text-slate-700 font-semibold">{activeDelivery.customerPhone}</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Special Instructions</span>
                  <p className="text-slate-700 italic">
                    {activeDelivery.notes || 'Handle hot bag with care, tamper proof sealed packaging.'}
                  </p>
                  <p className="text-slate-500 text-[11px] pt-1">
                    Payment Status: <strong className="text-slate-800">{activeDelivery.paymentStatus} ({activeDelivery.paymentMethod})</strong>
                  </p>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Advance Delivery Workflow Stage:
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAutoSimulating((prev) => !prev)}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        isAutoSimulating
                          ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-300'
                          : 'bg-[#18181B] text-white hover:bg-black'
                      }`}
                    >
                      {isAutoSimulating ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                          <span>Simulating Route (3.5s)...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Auto-Simulate Route</span>
                        </>
                      )}
                    </button>
                    {activeDelivery.orderStatus === 'DELIVERY_ASSIGNED' && (
                      <button
                        type="button"
                        onClick={() => handleDeclineOrder(activeDelivery.id)}
                        className="px-3 py-1.5 rounded-full border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold cursor-pointer transition-colors"
                      >
                        Decline Trip
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => deliveryUpdateStatus(activeDelivery.id, 'PICKED_UP')}
                    disabled={activeDelivery.orderStatus !== 'DELIVERY_ASSIGNED'}
                    className={`p-3 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      activeDelivery.orderStatus === 'DELIVERY_ASSIGNED'
                        ? 'bg-amber-600 hover:bg-amber-700 text-white'
                        : 'bg-slate-200 text-slate-400 opacity-60'
                    }`}
                  >
                    1. Arrived & Picked Up
                  </button>

                  <button
                    onClick={() => deliveryUpdateStatus(activeDelivery.id, 'OUT_FOR_DELIVERY')}
                    disabled={activeDelivery.orderStatus !== 'PICKED_UP'}
                    className={`p-3 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      activeDelivery.orderStatus === 'PICKED_UP'
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-slate-200 text-slate-400 opacity-60'
                    }`}
                  >
                    2. Out for Delivery
                  </button>

                  <button
                    onClick={() => handleHandoverAndComplete(activeDelivery)}
                    disabled={activeDelivery.orderStatus !== 'OUT_FOR_DELIVERY'}
                    className={`p-3 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      activeDelivery.orderStatus === 'OUT_FOR_DELIVERY'
                        ? 'bg-[#1B4332] hover:bg-[#2D6A4F] text-white'
                        : 'bg-slate-200 text-slate-400 opacity-60'
                    }`}
                  >
                    3. Handover & Complete (₹45)
                  </button>
                </div>
              </div>

            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 font-heading">Completed Trips & Earnings</h2>
            <span className="text-xs text-slate-500 font-medium">{completedDeliveries.length} completed</span>
          </div>

          {completedDeliveries.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs">
              No completed trips yet.
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-xs">
              {completedDeliveries.map((ord) => (
                <div
                  key={ord.id}
                  className="p-5 flex items-center justify-between text-xs hover:bg-slate-50/50 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span>Order #{ord.id}</span>
                      <span className="text-slate-300">·</span>
                      <span className="text-slate-500 font-normal">{ord.customerName}</span>
                    </div>
                    <p className="text-slate-400 text-[11px] mt-0.5 font-medium">
                      Completed at {ord.completedAt ? new Date(ord.completedAt).toLocaleTimeString() : 'Recently'}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="font-black text-[#1B4332] text-sm">
                      + ₹45.00
                    </span>
                    <span className="text-[10px] text-slate-400 block font-medium">
                      {ord.deliveryDistanceKm} km trip
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
