import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  TrendingUp,
  SlidersHorizontal,
  FileText,
  AlertTriangle,
  Bike,
  UtensilsCrossed,
  DollarSign,
  Activity,
  Layers,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { OnboardingApplication, Order } from '../../types';
import { ScheduleCalendarView } from '../calendar/ScheduleCalendarView';

interface AdminPortalProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  activeTab,
  setActiveTab,
}) => {
  const {
    applications,
    orders,
    auditLogs,
    accuracyEvaluation,
    approveApplication,
    rejectApplication,
    users,
    searchQuery,
  } = useApp();

  const [rejectingAppId, setRejectingAppId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('Incomplete FSSAI compliance documentation');
  const [showRejectModal, setShowRejectModal] = useState(false);

  const pendingApps = applications.filter((a) => {
    const isPending = a.status === 'PENDING_APPROVAL';
    if (!isPending) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return a.applicantName.toLowerCase().includes(q) ||
      (typeof a.details?.restaurantName === 'string' && a.details.restaurantName.toLowerCase().includes(q));
  });

  const filteredApplications = applications.filter((a) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const detailsStr = Object.values(a.details || {}).join(' ').toLowerCase();
    return (
      a.applicantName.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      a.phone.toLowerCase().includes(q) ||
      a.role.toLowerCase().includes(q) ||
      detailsStr.includes(q)
    );
  });

  const filteredAuditLogs = auditLogs.filter((log) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q) ||
      log.actorEmail.toLowerCase().includes(q)
    );
  });

  const displayOrders = orders.filter((o) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return o.id.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.restaurantName.toLowerCase().includes(q) ||
      o.orderStatus.toLowerCase().includes(q);
  });

  const handleOpenReject = (appId: string) => {
    setRejectingAppId(appId);
    setShowRejectModal(true);
  };

  const handleConfirmReject = () => {
    if (rejectingAppId) {
      rejectApplication(rejectingAppId, rejectReason);
      setShowRejectModal(false);
      setRejectingAppId(null);
    }
  };

  const totalGMV = orders.reduce((sum, o) => sum + o.finalAmount, 0) + 12840;
  const totalRescuedOrders = orders.filter((o) => o.hasSurplusItems).length;
  const totalRescuedSavings = orders.reduce((sum, o) => sum + o.savedAmount, 0);
  const restaurantsCount = users.filter((u) => u.role === 'RESTAURANT').length;
  const deliveryCount = users.filter((u) => u.role === 'DELIVERY').length;
  const customersCount = users.filter((u) => u.role === 'CUSTOMER').length;

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'DEMO_ROLE_SWITCH':
        return { label: 'Role Switched', bg: 'bg-zinc-900 text-white border-zinc-900' };
      case 'USER_LOGOUT':
        return { label: 'User Sign Out', bg: 'bg-amber-100 text-amber-900 border-amber-300' };
      case 'ORDER_STATUS_CHANGED':
      case 'ORDER_STATUS_CHANGE':
        return { label: 'Order Status Changed', bg: 'bg-blue-100 text-blue-900 border-blue-300' };
      case 'ORDER_PLACED':
        return { label: 'New Order Placed', bg: 'bg-[#1B4332]/10 text-[#1B4332] border-[#1B4332]/20' };
      case 'APPROVAL_DECISION':
      case 'USER_APPROVAL':
        return { label: 'Partner Approved', bg: 'bg-[#1B4332]/10 text-[#1B4332] border-[#1B4332]/20' };
      case 'APPROVAL_REJECTION':
        return { label: 'Partner Rejected', bg: 'bg-rose-100 text-rose-900 border-rose-300' };
      case 'SURPLUS_LISTING_CREATED':
      case 'SURPLUS_CREATED':
        return { label: 'Surplus Deal Live', bg: 'bg-purple-100 text-purple-900 border-purple-300' };
      default:
        return {
          label: action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
          bg: 'bg-slate-100 text-slate-800 border-slate-200',
        };
    }
  };

  const humanizeDetails = (details: string) => {
    if (details.includes('Switched active session to demo identity:')) {
      const match = details.match(/to demo identity:\s*([^\s]+)\s*\(([^)]+)\)/);
      if (match) {
        return `Switched session to ${match[2]} portal (${match[1]})`;
      }
    }
    return details;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-5 pb-28 space-y-8">

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-purple-700 font-bold uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4" />
            <span>Platform Governance & Command Hub</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight font-heading">
            Executive Admin Console
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit partner onboarding compliance, monitor live order liquidity, verify ML model benchmarks, and review platform sustainability.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-400 block uppercase">Restaurants</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            {restaurantsCount}
          </span>
          <span className="text-[10px] text-slate-400 mt-1 block">Active Kitchen Partners</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-400 block uppercase">Delivery Partners</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            {deliveryCount}
          </span>
          <span className="text-[10px] text-slate-400 mt-1 block">Verified Fleet Riders</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-400 block uppercase">Customers</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            {customersCount}
          </span>
          <span className="text-[10px] text-slate-400 mt-1 block">Registered Food Rescuers</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-400 block uppercase">Pending Verifications</span>
          <span className="text-2xl font-black text-amber-600 mt-1 block">
            {pendingApps.length}
          </span>
          <span className="text-[10px] text-slate-400 mt-1 block">Requires admin action</span>
        </div>
      </div>

      {activeTab === 'calendar' && (
        <div className="space-y-6">
          <ScheduleCalendarView mode="CUSTOMER" />
        </div>
      )}

      {activeTab === 'approvals' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 font-heading">Partner Approval Requests</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Enforcing FSSAI kitchen guidelines and rider vehicle verification before granting dashboard access.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {filteredApplications.map((app) => (
              <div
                key={app.id}
                className="bg-white rounded-3xl p-6 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    {app.role === 'RESTAURANT' ? (
                      <span className="p-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                        <UtensilsCrossed className="w-4 h-4" />
                      </span>
                    ) : (
                      <span className="p-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                        <Bike className="w-4 h-4" />
                      </span>
                    )}

                    <h3 className="text-sm font-bold text-slate-900 font-heading">
                      {app.applicantName} ({app.role === 'RESTAURANT' ? 'Restaurant Partner' : 'Delivery Rider'})
                    </h3>

                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                        app.status === 'PENDING_APPROVAL'
                          ? 'bg-[#1B4332]/10 text-[#1B4332]'
                          : app.status === 'APPROVED'
                          ? 'bg-[#1B4332] text-white'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {app.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 flex flex-wrap gap-4">
                    <span>Email: <strong className="text-slate-800 font-semibold">{app.email}</strong></span>
                    <span>Phone: <strong className="text-slate-800 font-semibold">{app.phone}</strong></span>
                    <span>Submitted: {new Date(app.submittedAt).toLocaleDateString()}</span>
                  </div>

                  {app.details && (
                    <div className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex flex-wrap gap-3">
                      {Object.entries(app.details).slice(0, 3).map(([k, v]) => (
                        <span key={k}>
                          <strong className="text-slate-700 capitalize">{k}:</strong> {String(v)}
                        </span>
                      ))}
                    </div>
                  )}

                  {app.rejectionReason && (
                    <p className="text-xs text-rose-700">
                      <strong>Rejection Reason:</strong> {app.rejectionReason}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {app.status === 'PENDING_APPROVAL' ? (
                    <>
                      <button
                        onClick={() => approveApplication(app.id)}
                        className="py-2 px-4 rounded-full bg-[#18181B] hover:bg-black text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Approve & Unlock
                      </button>
                      <button
                        onClick={() => handleOpenReject(app.id)}
                        className="py-2 px-3.5 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Reject
                      </button>
                    </>
                  ) : (
                    <span className="text-xs text-slate-400 font-medium">
                      Decision Recorded
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 font-heading">Platform Orders & Simulated Payments</h2>
            <span className="text-xs text-slate-500 font-medium">{displayOrders.length} orders shown</span>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Order ID</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Restaurant</th>
                    <th className="py-3 px-4">Payment Method</th>
                    <th className="py-3 px-4">Payment State</th>
                    <th className="py-3 px-4">Order Status</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {displayOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        #{ord.id}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {ord.customerName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {ord.restaurantName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        {ord.paymentMethod} {ord.paymentId ? `(${ord.paymentId})` : ''}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            ord.paymentStatus === 'PAID'
                              ? 'bg-[#1B4332]/10 text-[#1B4332]'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {ord.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {ord.orderStatus.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                        ₹{ord.finalAmount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'forecast_benchmarks' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-8 border border-slate-200 space-y-4">
            <h2 className="text-xl font-bold text-slate-900 font-heading">
              Machine Learning Model Validation & Chronological Holdout Split
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
              To verify prediction robustness, the demand forecaster is trained on 2 calendar years of synthetic daily kitchen records (2023–2024, 730 days) and tested strictly on future unseen chronological records from 2025 (365 days).
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
              <div className="p-5 rounded-2xl bg-[#1B4332]/5 border border-[#1B4332]/20 text-[#1B4332]">
                <span className="text-xs text-[#1B4332] font-semibold block">Mean Absolute Error (MAE)</span>
                <span className="text-2xl font-black mt-1 block">{accuracyEvaluation.meanAbsoluteError} meals</span>
                <span className="text-[10px] text-[#1B4332]/80 block mt-1">Average forecast deviation</span>
              </div>

              <div className="p-5 rounded-2xl bg-[#1B4332]/5 border border-[#1B4332]/20 text-[#1B4332]">
                <span className="text-xs text-[#1B4332] font-semibold block">Weighted Absolute Error (WAPE)</span>
                <span className="text-2xl font-black mt-1 block">{accuracyEvaluation.weightedAbsolutePercentageError}%</span>
                <span className="text-[10px] text-[#1B4332]/80 block mt-1">Normalized error metric</span>
              </div>

              <div className="p-5 rounded-2xl bg-[#1B4332]/5 border border-[#1B4332]/20 text-[#1B4332]">
                <span className="text-xs text-[#1B4332] font-semibold block">Overall Accuracy Score</span>
                <span className="text-2xl font-black mt-1 block">{accuracyEvaluation.accuracyPercent}%</span>
                <span className="text-[10px] text-[#1B4332]/80 block mt-1">Reliable kitchen planning</span>
              </div>

              <div className="p-5 rounded-2xl bg-[#1B4332]/5 border border-[#1B4332]/20 text-[#1B4332]">
                <span className="text-xs text-[#1B4332] font-semibold block">Gain vs Naive Baseline</span>
                <span className="text-2xl font-black mt-1 block">+{accuracyEvaluation.errorReductionVsBaseline}%</span>
                <span className="text-[10px] text-[#1B4332]/80 block mt-1">Outperforms static rolling avg</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'impact' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-8 border border-slate-200 space-y-4">
            <h2 className="text-xl font-bold text-slate-900 font-heading">Platform Audit Trail</h2>
            <p className="text-xs text-slate-500">
              Tamper-evident log of administrative approvals, order transitions, and system actions.
            </p>

            <div className="space-y-2.5 max-h-96 overflow-y-auto">
              {filteredAuditLogs.map((log) => {
                const badge = getActionBadge(log.action);
                return (
                  <div
                    key={log.id}
                    className="p-3.5 bg-slate-50/70 hover:bg-slate-50 rounded-2xl border border-slate-100 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider shrink-0 ${badge.bg}`}>
                        {badge.label}
                      </span>
                      <span className="text-slate-800 font-medium">
                        {humanizeDetails(log.details)}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 shrink-0 font-mono flex items-center gap-1.5 self-end sm:self-auto">
                      <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                      <span>·</span>
                      <span className="text-slate-600 font-medium">{log.actorEmail}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showRejectModal && (
          <motion.div
            key="reject-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => setShowRejectModal(false)}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto cursor-pointer"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ type: 'spring', damping: 28, stiffness: 350 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl w-full max-w-lg overflow-hidden border border-slate-200 shadow-2xl flex flex-col cursor-default my-auto"
            >
              <div className="px-6 py-3.5 border-b border-slate-200 flex items-center justify-between bg-white text-black shrink-0">
                <div className="flex items-center gap-3">
                  <div>
                    <h3 className="text-sm font-black text-black uppercase tracking-wider">Decline Partner Application</h3>
                    <p className="text-[10px] text-slate-500 font-medium">Specify verification rationale for the applicant</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="p-2 rounded-full hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    Rejection Reason & Feedback:
                  </label>
                  <input
                    type="text"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="e.g. Incomplete FSSAI license documentation"
                    className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-[#1B4332]"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setShowRejectModal(false)}
                    className="px-5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-full cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmReject}
                    className="px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-full cursor-pointer transition-all"
                  >
                    Confirm Rejection
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
