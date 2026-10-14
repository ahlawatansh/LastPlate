import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  ShoppingBag,
  UtensilsCrossed,
  Bike,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  ChevronDown,
  Loader2,
  Lock,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { signInWithGoogleFirebase, signInWithGoogleRedirectFirebase, signUpWithEmailFirebase } from '../../services/firebase';
import { FirebaseConfigModal } from './FirebaseConfigModal';

interface SignupViewProps {
  onSwitchToLogin: () => void;
  googlePrefillData?: {
    email: string;
    name: string;
    photoURL?: string;
    uid?: string;
  } | null;
}

export const SignupView: React.FC<SignupViewProps> = ({ onSwitchToLogin, googlePrefillData }) => {
  const { users, registerCustomer, registerRestaurant, registerDelivery, loginWithFirebaseUser } = useApp();

  const [selectedRole, setSelectedRole] = useState<'CUSTOMER' | 'RESTAURANT' | 'DELIVERY'>('CUSTOMER');

  const [activeGoogleUser, setActiveGoogleUser] = useState<{
    email: string;
    name: string;
    photoURL?: string;
    uid?: string;
  } | null>(googlePrefillData || null);

  useEffect(() => {
    if (googlePrefillData) {
      setActiveGoogleUser(googlePrefillData);
    }
  }, [googlePrefillData]);

  const isGoogleUser = Boolean(activeGoogleUser?.email);

  const [custName, setCustName] = useState(activeGoogleUser?.name || '');
  const [custEmail, setCustEmail] = useState(activeGoogleUser?.email || '');
  const [custPhone, setCustPhone] = useState('');
  const [custAddress, setCustAddress] = useState('');

  const [restOwner, setRestOwner] = useState(activeGoogleUser?.name || '');
  const [restName, setRestName] = useState('');
  const [restEmail, setRestEmail] = useState(activeGoogleUser?.email || '');
  const [restPhone, setRestPhone] = useState('');
  const [restCuisine, setRestCuisine] = useState('');
  const [restAddress, setRestAddress] = useState('');
  const [restKitchen, setRestKitchen] = useState('');

  const [delName, setDelName] = useState(activeGoogleUser?.name || '');
  const [delEmail, setDelEmail] = useState(activeGoogleUser?.email || '');
  const [delPhone, setDelPhone] = useState('');
  const [delVehicleType, setDelVehicleType] = useState<'EV_SCOOTER' | 'MOTORBIKE' | 'BICYCLE' | 'VAN'>('EV_SCOOTER');
  const [delVehicleNumber, setDelVehicleNumber] = useState('');
  const [delServiceArea, setDelServiceArea] = useState('');
  const [delLicenseNo, setDelLicenseNo] = useState('');

  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  useEffect(() => {
    if (activeGoogleUser) {
      if (activeGoogleUser.email) {
        setCustEmail(activeGoogleUser.email);
        setRestEmail(activeGoogleUser.email);
        setDelEmail(activeGoogleUser.email);
      }
      if (activeGoogleUser.name) {
        setCustName(activeGoogleUser.name);
        setRestOwner(activeGoogleUser.name);
        setDelName(activeGoogleUser.name);
      }
    }
  }, [activeGoogleUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (selectedRole === 'CUSTOMER') {
        if (!custName || !custEmail) {
          setError('Please provide your name and email');
          return;
        }

        if (!isGoogleUser && password) {
          const fbRes = await signUpWithEmailFirebase(custEmail, password, custName, {
            role: 'CUSTOMER',
            phone: custPhone,
            address: custAddress,
          });
          if (!fbRes.success && fbRes.error) {
            setError(fbRes.error);
            return;
          }
        }

        const ok = registerCustomer({
          name: custName,
          email: custEmail,
          phone: custPhone,
          address: custAddress,
        });
        if (!ok) {
          setError('An account with this email already exists.');
          return;
        }

        if (isGoogleUser && activeGoogleUser) {
          loginWithFirebaseUser({
            uid: activeGoogleUser.uid,
            email: activeGoogleUser.email,
            displayName: custName || activeGoogleUser.name,
            photoURL: activeGoogleUser.photoURL,
          });
        }
      } else if (selectedRole === 'RESTAURANT') {
        if (!restOwner || !restName || !restEmail) {
          setError('Please fill in restaurant and owner details');
          return;
        }

        if (!isGoogleUser && password) {
          const fbRes = await signUpWithEmailFirebase(restEmail, password, restOwner, {
            role: 'RESTAURANT',
            restaurantName: restName,
            phone: restPhone,
            cuisine: restCuisine,
            address: restAddress,
          });
          if (!fbRes.success && fbRes.error) {
            setError(fbRes.error);
            return;
          }
        }

        const ok = registerRestaurant({
          ownerName: restOwner,
          restaurantName: restName,
          email: restEmail,
          phone: restPhone,
          cuisine: restCuisine,
          address: restAddress,
          kitchenCapability: restKitchen,
        });
        if (!ok) {
          setError('An account with this email already exists.');
          return;
        }
      } else if (selectedRole === 'DELIVERY') {
        if (!delName || !delEmail || !delVehicleNumber) {
          setError('Please provide full name, email, and vehicle registration number');
          return;
        }

        if (!isGoogleUser && password) {
          const fbRes = await signUpWithEmailFirebase(delEmail, password, delName, {
            role: 'DELIVERY',
            phone: delPhone,
            vehicleType: delVehicleType,
            vehicleNumber: delVehicleNumber,
            serviceArea: delServiceArea,
          });
          if (!fbRes.success && fbRes.error) {
            setError(fbRes.error);
            return;
          }
        }

        const ok = registerDelivery({
          name: delName,
          email: delEmail,
          phone: delPhone,
          vehicleType: delVehicleType,
          vehicleNumber: delVehicleNumber,
          serviceArea: delServiceArea,
          licenseNo: delLicenseNo,
        });
        if (!ok) {
          setError('An account with this email already exists.');
          return;
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Registration error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError(null);
    setIsGoogleLoading(true);
    try {
      const result = await signInWithGoogleFirebase();
      if (result.isConfigurationMissing) {
        setIsConfigModalOpen(true);
        return;
      }

      if (result.success && result.user) {
        const gEmail = result.user.email || '';
        const gName = result.user.displayName || (gEmail ? gEmail.split('@')[0] : 'User');
        const existing = users.find((u) => u.email.toLowerCase() === gEmail.toLowerCase());
        if (existing) {

          loginWithFirebaseUser(result.user);
          return;
        }

        setActiveGoogleUser({
          uid: result.user.uid,
          email: gEmail,
          name: gName,
          photoURL: result.user.photoURL || undefined,
        });
      } else if (result.error) {
        setError(result.error);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to authenticate with Google.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleRedirectSignup = async () => {
    setError(null);
    setIsGoogleLoading(true);
    try {
      await signInWithGoogleRedirectFirebase();
    } catch (err: any) {
      setError(err?.message || 'Failed to redirect to Google.');
      setIsGoogleLoading(false);
    }
  };

  const roles = [
    {
      key: 'CUSTOMER' as const,
      name: 'Customer',
      icon: <ShoppingBag className="w-3.5 h-3.5" />,
    },
    {
      key: 'RESTAURANT' as const,
      name: 'Restaurant',
      icon: <UtensilsCrossed className="w-3.5 h-3.5" />,
    },
    {
      key: 'DELIVERY' as const,
      name: 'Delivery Partner',
      icon: <Bike className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-4 sm:p-6 pb-[60px] sm:pb-[60px] overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full my-auto border border-zinc-200 overflow-hidden flex flex-col">

        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-extrabold tracking-tight font-heading leading-none lowercase">
              <span className="text-slate-950 font-extrabold">last</span>
              <span className="text-[#1B4332] font-black">plate</span>
            </span>
            <span className="hidden sm:inline-block text-[11px] text-zinc-400 pl-2 border-l border-zinc-200">
              Account Registration
            </span>
          </div>
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-xs font-bold text-[#1B4332] hover:underline cursor-pointer flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 flex-1">

          <div className="md:col-span-5 p-6 sm:p-8 flex flex-col justify-between border-r border-zinc-800 bg-[#121214] text-white">
            <div className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-black font-heading leading-snug text-white">
                {selectedRole === 'CUSTOMER' && 'Fresh Food. Rescued Prices.'}
                {selectedRole === 'RESTAURANT' && 'Monetize Surplus. Predict Demand.'}
                {selectedRole === 'DELIVERY' && 'Green Fleet. Instant Payouts.'}
              </h2>
              <p className="text-xs leading-relaxed font-medium text-zinc-300">
                {selectedRole === 'CUSTOMER' &&
                  'Join thousands enjoying chef-crafted meals while cutting municipal food waste by over 40%.'}
                {selectedRole === 'RESTAURANT' &&
                  'Turn excess kitchen capacity and evening surplus into high-margin revenue with automated AI price markdown.'}
                {selectedRole === 'DELIVERY' &&
                  'Deliver hyper-local food packages on eco-friendly EV routes with guaranteed incentives and real-time tracking.'}
              </p>

              <div className="space-y-2.5 pt-4">
                <div className="flex items-center gap-2.5 text-xs font-medium text-zinc-200">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>
                    {selectedRole === 'CUSTOMER' && 'Daily 40%–70% surplus deal drops'}
                    {selectedRole === 'RESTAURANT' && 'Dynamic live surplus inventory auctions'}
                    {selectedRole === 'DELIVERY' && 'Optimized shortest EV routing algorithms'}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 text-xs font-medium text-zinc-200">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>
                    {selectedRole === 'CUSTOMER' && 'Live GPS electric bike order tracking'}
                    {selectedRole === 'RESTAURANT' && '3-year seasonal ML kitchen forecasting'}
                    {selectedRole === 'DELIVERY' && 'Daily transparent incentive settlements'}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 text-xs font-medium text-zinc-200">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>
                    {selectedRole === 'CUSTOMER' && 'Secure UPI, Cards, and Net Banking'}
                    {selectedRole === 'RESTAURANT' && 'Instant POS integrations and thermal tags'}
                    {selectedRole === 'DELIVERY' && '24/7 dedicated dispatch fleet support'}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-zinc-800 text-[11px] flex items-center gap-2 font-medium text-zinc-400">
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Welcome to LastPlate</span>
            </div>
          </div>

          <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-center bg-white space-y-4">

            <div className="flex items-center justify-center pb-2">
              <div className="bg-white rounded-full border border-slate-200/90 p-1 flex items-center justify-center gap-1 flex-nowrap whitespace-nowrap h-11 relative shadow-xs">
                {roles.map((r) => {
                  const isActive = selectedRole === r.key;
                  return (
                    <button
                      key={r.key}
                      type="button"
                      onClick={() => {
                        setSelectedRole(r.key);
                        setError(null);
                      }}
                      className={`relative flex items-center gap-1.5 text-xs font-bold transition-colors duration-200 border-0 cursor-pointer shrink-0 h-9 rounded-full px-4 z-10 ${
                        isActive
                          ? 'text-white'
                          : 'text-zinc-600 hover:text-black hover:bg-slate-100/70'
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeSignupRolePill"
                          className="absolute inset-0 bg-[#18181B] rounded-full ring-[5px] ring-[#18181B] -z-10"
                          transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                        />
                      )}
                      {r.icon}
                      <span>{r.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 leading-relaxed space-y-2">
                <div>{error}</div>
                {!isGoogleUser && (error.toLowerCase().includes('popup') || error.toLowerCase().includes('google')) && (
                  <button
                    type="button"
                    onClick={handleGoogleRedirectSignup}
                    className="font-bold text-[#1B4332] underline hover:text-black cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <span>Or authenticate via direct Google Page Redirect</span>
                    <span>↗</span>
                  </button>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">

              {selectedRole === 'CUSTOMER' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={custName}
                        onChange={(e) => setCustName(e.target.value)}
                        placeholder="e.g. Ananya Sharma"
                        className="block w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-full focus:ring-2 focus:ring-[#1B4332] outline-none text-slate-900 placeholder:text-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={custPhone}
                        onChange={(e) => setCustPhone(e.target.value)}
                        placeholder="+91 98112 34567"
                        className="block w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-full focus:ring-2 focus:ring-[#1B4332] outline-none text-slate-900 placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Address * {isGoogleUser && <span className="text-[10px] text-[#1B4332] font-semibold ml-1">✓ Google Verified</span>}
                    </label>
                    <input
                      type="email"
                      required
                      readOnly={isGoogleUser}
                      value={custEmail}
                      onChange={(e) => setCustEmail(e.target.value)}
                      placeholder="ananya@example.com"
                      className={`block w-full px-3.5 py-2.5 text-xs border rounded-full focus:ring-2 focus:ring-[#1B4332] outline-none ${
                        isGoogleUser
                          ? 'bg-slate-50 border-[#1B4332] text-slate-800 font-medium'
                          : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Delivery Address
                    </label>
                    <input
                      type="text"
                      value={custAddress}
                      onChange={(e) => setCustAddress(e.target.value)}
                      placeholder="e.g. Flat 302, Palm Heights, Indiranagar, Bengaluru"
                      className="block w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-full focus:ring-2 focus:ring-[#1B4332] outline-none text-slate-900 placeholder:text-slate-400"
                    />
                  </div>
                </>
              )}

              {selectedRole === 'RESTAURANT' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Restaurant Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={restName}
                        onChange={(e) => setRestName(e.target.value)}
                        placeholder="e.g. Spice Route Bistro"
                        className="block w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-full focus:ring-2 focus:ring-[#1B4332] outline-none text-slate-900 placeholder:text-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Owner / Chef Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={restOwner}
                        onChange={(e) => setRestOwner(e.target.value)}
                        placeholder="e.g. Chef Kabir Sen"
                        className="block w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-full focus:ring-2 focus:ring-[#1B4332] outline-none text-slate-900 placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Business Email * {isGoogleUser && <span className="text-[10px] text-[#1B4332] font-semibold ml-1">✓ Google Verified</span>}
                      </label>
                      <input
                        type="email"
                        required
                        readOnly={isGoogleUser}
                        value={restEmail}
                        onChange={(e) => setRestEmail(e.target.value)}
                        placeholder="partner@restaurant.com"
                        className={`block w-full px-3.5 py-2.5 text-xs border rounded-full focus:ring-2 focus:ring-[#1B4332] outline-none ${
                          isGoogleUser
                            ? 'bg-slate-50 border-[#1B4332] text-slate-800 font-medium'
                            : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Contact Phone
                      </label>
                      <input
                        type="tel"
                        value={restPhone}
                        onChange={(e) => setRestPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="block w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-full focus:ring-2 focus:ring-[#1B4332] outline-none text-slate-900 placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Cuisine Specialization
                      </label>
                      <input
                        type="text"
                        value={restCuisine}
                        onChange={(e) => setRestCuisine(e.target.value)}
                        placeholder="e.g. Contemporary Indian Cafe"
                        className="block w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-full focus:ring-2 focus:ring-[#1B4332] outline-none text-slate-900 placeholder:text-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Location / Address
                      </label>
                      <input
                        type="text"
                        value={restAddress}
                        onChange={(e) => setRestAddress(e.target.value)}
                        placeholder="e.g. 12th Main Road, HAL 2nd Stage, Indiranagar, Bengaluru"
                        className="block w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-full focus:ring-2 focus:ring-[#1B4332] outline-none text-slate-900 placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                </>
              )}

              {selectedRole === 'DELIVERY' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={delName}
                        onChange={(e) => setDelName(e.target.value)}
                        placeholder="e.g. Rahul Verma"
                        className="block w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-full focus:ring-2 focus:ring-[#1B4332] outline-none text-slate-900 placeholder:text-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={delPhone}
                        onChange={(e) => setDelPhone(e.target.value)}
                        placeholder="+91 99887 76655"
                        className="block w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-full focus:ring-2 focus:ring-[#1B4332] outline-none text-slate-900 placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Email Address * {isGoogleUser && <span className="text-[10px] text-[#1B4332] font-semibold ml-1">✓ Google Verified</span>}
                      </label>
                      <input
                        type="email"
                        required
                        readOnly={isGoogleUser}
                        value={delEmail}
                        onChange={(e) => setDelEmail(e.target.value)}
                        placeholder="rahul@delivery.com"
                        className={`block w-full px-3.5 py-2.5 text-xs border rounded-full focus:ring-2 focus:ring-[#1B4332] outline-none ${
                          isGoogleUser
                            ? 'bg-slate-50 border-[#1B4332] text-slate-800 font-medium'
                            : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Vehicle Type *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                          <ChevronDown className="w-3.5 h-3.5" />
                        </div>
                        <select
                          value={delVehicleType}
                          onChange={(e) => setDelVehicleType(e.target.value as any)}
                          className="block w-full pl-9 pr-3.5 py-2.5 text-xs border border-slate-200 rounded-full focus:ring-2 focus:ring-[#1B4332] outline-none bg-white text-slate-900 appearance-none truncate text-ellipsis overflow-hidden whitespace-nowrap cursor-pointer"
                        >
                          <option value="EV_SCOOTER">EV Electric Scooter (Eco-Friendly)</option>
                          <option value="MOTORBIKE">Motorcycle / Petrol Scooter</option>
                          <option value="BICYCLE">Bicycle</option>
                          <option value="VAN">Light Cargo Van</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Vehicle Reg Number *
                      </label>
                      <input
                        type="text"
                        required
                        value={delVehicleNumber}
                        onChange={(e) => setDelVehicleNumber(e.target.value)}
                        placeholder="e.g. KA-05-EQ-4421 (EV Scooter)"
                        className="block w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-full focus:ring-2 focus:ring-[#1B4332] outline-none text-slate-900 placeholder:text-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Preferred Service Cluster
                      </label>
                      <input
                        type="text"
                        value={delServiceArea}
                        onChange={(e) => setDelServiceArea(e.target.value)}
                        placeholder="e.g. Koramangala, Indiranagar, HSR Layout, Bengaluru"
                        className="block w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-full focus:ring-2 focus:ring-[#1B4332] outline-none text-slate-900 placeholder:text-slate-400 truncate text-ellipsis overflow-hidden whitespace-nowrap"
                      />
                    </div>
                  </div>
                </>
              )}

              {!isGoogleUser && (
                <div className="pt-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Account Password (min 6 characters)
                  </label>
                  <div className="relative rounded-full">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create your secure password"
                      className="block w-full pl-10 pr-3.5 py-2.5 text-xs border border-slate-200 rounded-full focus:ring-2 focus:ring-[#1B4332] outline-none text-slate-900 placeholder:text-slate-400"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-full bg-[#18181B] hover:bg-black text-white text-xs font-bold transition-colors mt-2 cursor-pointer shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Submitting registration...</span>
                  </>
                ) : (
                  <>
                    <span>{selectedRole === 'CUSTOMER' ? 'Complete Registration & Start' : 'Submit Registration'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {!isGoogleUser && (
              <>

                <div className="relative my-2 max-w-[180px] mx-auto w-full">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200/60" />
                  </div>
                  <div className="relative flex justify-center text-[10px]">
                    <span className="bg-white px-2.5 text-slate-400 font-normal">
                      Or continue with
                    </span>
                  </div>
                </div>

                {isGoogleLoading ? (
                  <div className="w-full flex items-center justify-between py-2.5 px-4 border border-slate-200 rounded-full bg-slate-50 text-xs">
                    <div className="flex items-center gap-2.5 text-slate-700 font-medium truncate">
                      <Loader2 className="w-4 h-4 animate-spin text-[#1B4332] shrink-0" />
                      <span className="truncate">Connecting to Firebase Google...</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsGoogleLoading(false);
                        setError('Sign-in cancelled. If the popup was blocked by your browser, you can allow popups in the URL bar or use Google Redirect below.');
                      }}
                      className="text-xs font-bold text-rose-600 hover:underline cursor-pointer shrink-0 ml-2"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleGoogleSignup}
                    className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-slate-200 rounded-full bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    <span>Continue with Google</span>
                  </button>
                )}
              </>
            )}

            <div className="pt-2 text-center text-xs flex items-center justify-center gap-1.5">
              <span className="text-slate-500">Already registered?</span>
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-xs text-[#1B4332] hover:underline font-bold cursor-pointer"
              >
                Sign in to your account
              </button>
            </div>

          </div>

        </div>

        <FirebaseConfigModal
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
          onConfigSaved={() => {
            setIsConfigModalOpen(false);
            handleGoogleSignup();
          }}
        />

      </div>
    </div>
  );
};
