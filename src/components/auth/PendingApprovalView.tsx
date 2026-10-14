import React from 'react';
import { Clock, ShieldCheck, ArrowRight, LogOut, Building2, Bike, UtensilsCrossed } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const PendingApprovalView: React.FC = () => {
  const { currentUser, logout, quickLoginDemo, applications } = useApp();

  const userApp = applications.find((a) => a.userId === currentUser?.id);

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg text-center">

        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#1B4332]/10 text-[#1B4332] border border-[#1B4332]/20 mb-4">
          <Clock className="w-8 h-8" />
        </div>

        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Application Under Review
        </h1>

        <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
          Your <strong className="text-slate-900">{currentUser?.role === 'RESTAURANT' ? 'Restaurant Partner' : 'Delivery Partner'}</strong> onboarding request has been submitted and is currently waiting for Platform Administrator verification.
        </p>

        <div className="mt-8 bg-white p-6 rounded-3xl border border-slate-200 text-left space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              {currentUser?.role === 'RESTAURANT' ? (
                <UtensilsCrossed className="w-4 h-4 text-[#1B4332]" />
              ) : (
                <Bike className="w-4 h-4 text-blue-600" />
              )}
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Application Summary
              </span>
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1B4332] bg-[#1B4332]/10 px-2.5 py-1 rounded-full border border-[#1B4332]/20">
              PENDING APPROVAL
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Applicant Name</span>
              <span className="font-semibold text-slate-800">{currentUser?.name}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Email Address</span>
              <span className="font-semibold text-slate-800 truncate block">{currentUser?.email}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Submission Time</span>
              <span className="text-slate-700 text-[11px] font-medium">
                {currentUser?.createdAt ? new Date(currentUser.createdAt).toLocaleDateString() : 'Today'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Review Policy</span>
              <span className="text-slate-700">FSSAI / Safety Check</span>
            </div>
          </div>

          {userApp && userApp.details && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-1">
              <span className="font-semibold text-slate-800 block text-[11px]">Submitted Details:</span>
              {Object.entries(userApp.details).map(([key, val]) => (
                <div key={key} className="flex justify-between text-[11px]">
                  <span className="text-slate-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                  <span className="font-medium text-slate-800 truncate max-w-[200px]">{String(val)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2 text-xs text-slate-500 leading-relaxed">
            For trust, compliance, and food safety standards, access to the kitchen dashboard or delivery request pool is granted once an administrator verifies business credentials.
          </div>

          <div className="mt-4 p-4 rounded-2xl bg-purple-50 border border-purple-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-purple-900">
              <span className="font-bold flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-purple-700" />
                Want to test Admin Approval right now?
              </span>
              <p className="text-[11px] text-purple-700 mt-0.5">
                Switch to Admin Portal to review and approve this pending onboarding request in 1 click.
              </p>
            </div>
            <button
              onClick={() => quickLoginDemo('ADMIN')}
              className="shrink-0 px-4 py-2 rounded-full bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              Enter Admin Portal <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <button
            onClick={logout}
            className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 px-4 py-2 rounded-full border border-slate-200 bg-white cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Sign Out & Return to Login
          </button>
        </div>

      </div>
    </div>
  );
};
