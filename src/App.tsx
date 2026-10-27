import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { DemoAccountBar } from './components/common/DemoAccountBar';
import { LoginView } from './components/auth/LoginView';
import { SignupView } from './components/auth/SignupView';
import { PendingApprovalView } from './components/auth/PendingApprovalView';
import { CustomerPortal } from './components/customer/CustomerPortal';
import { RestaurantPortal } from './components/restaurant/RestaurantPortal';
import { DeliveryPortal } from './components/delivery/DeliveryPortal';
import { AdminPortal } from './components/admin/AdminPortal';
import { checkGoogleRedirectResult } from './services/firebase';
import { UserRole } from './types';

const AppContent: React.FC = () => {
  const {
    currentUser,
    authenticatedUser,
    activePortal,
    switchToPortal,
    users,
    loginWithFirebaseUser,
    logout,
  } = useApp();

  const [authView, setAuthView] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
  const [googlePrefillData, setGooglePrefillData] = useState<{
    uid: string;
    email: string;
    name: string;
    photoURL?: string;
  } | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [initialLoginRole, setInitialLoginRole] = useState<'CUSTOMER' | 'DELIVERY'>('CUSTOMER');

  const handleOpenLogin = (role?: UserRole) => {
    setGooglePrefillData(null);
    if (role === 'DELIVERY') {
      setInitialLoginRole('DELIVERY');
    } else {
      setInitialLoginRole('CUSTOMER');
    }
    setAuthView('LOGIN');
    switchToPortal('AUTH');
  };

  const usersRef = useRef(users);
  usersRef.current = users;
  const loginWithFirebaseUserRef = useRef(loginWithFirebaseUser);
  loginWithFirebaseUserRef.current = loginWithFirebaseUser;
  const hasCheckedRedirectRef = useRef(false);

  useEffect(() => {
    if (hasCheckedRedirectRef.current) return;
    hasCheckedRedirectRef.current = true;

    checkGoogleRedirectResult().then((res) => {
      if (res && res.success && res.user && res.user.email) {
        const targetEmail = res.user.email.toLowerCase();
        const existing = usersRef.current.find((u) => u.email.toLowerCase() === targetEmail);
        if (existing) {
          loginWithFirebaseUserRef.current(res.user);
        } else {
          setGooglePrefillData({
            uid: res.user.uid,
            email: res.user.email,
            name: res.user.displayName || res.user.email.split('@')[0],
            photoURL: res.user.photoURL || undefined,
          });
          setAuthView('SIGNUP');
          switchToPortal('AUTH');
        }
      }
    });
  }, [switchToPortal]);

  const [customerTab, setCustomerTab] = useState('menu');
  const [restaurantTab, setRestaurantTab] = useState('kitchen');
  const [deliveryTab, setDeliveryTab] = useState('pool');
  const [adminTab, setAdminTab] = useState('approvals');

  if (activePortal === 'AUTH') {
    return (
      <div className="relative">
        {authView === 'LOGIN' ? (
          <LoginView
            initialRole={initialLoginRole}
            onSwitchToSignup={() => {
              setGooglePrefillData(null);
              setAuthView('SIGNUP');
            }}
            onGoogleSignUpRequired={(gUser) => {
              setGooglePrefillData({
                uid: gUser.uid,
                email: gUser.email,
                name: gUser.displayName || (gUser.email ? gUser.email.split('@')[0] : 'User'),
                photoURL: gUser.photoURL,
              });
              setAuthView('SIGNUP');
            }}
          />
        ) : (
          <SignupView
            onSwitchToLogin={() => {
              setGooglePrefillData(null);
              setAuthView('LOGIN');
            }}
            googlePrefillData={googlePrefillData}
          />
        )}
        <DemoAccountBar
          onOpenAuth={handleOpenLogin}
          onLogout={logout}
        />
      </div>
    );
  }

  if (currentUser && currentUser.status === 'PENDING_APPROVAL' && (activePortal === 'CUSTOMER' || activePortal === 'DELIVERY')) {
    return (
      <div className="relative">
        <PendingApprovalView />
        <DemoAccountBar
          onOpenAuth={handleOpenLogin}
          onLogout={logout}
        />
      </div>
    );
  }

  const getCurrentTabAndSetter = () => {
    switch (activePortal) {
      case 'CUSTOMER':
        return { activeTab: customerTab, setActiveTab: setCustomerTab };
      case 'RESTAURANT':
        return { activeTab: restaurantTab, setActiveTab: setRestaurantTab };
      case 'DELIVERY':
        return { activeTab: deliveryTab, setActiveTab: setDeliveryTab };
      case 'ADMIN':
        return { activeTab: adminTab, setActiveTab: setAdminTab };
      default:
        return { activeTab: 'menu', setActiveTab: setCustomerTab };
    }
  };

  const { activeTab, setActiveTab } = getCurrentTabAndSetter();

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-slate-900 flex flex-col justify-between selection:bg-[#1B4332]/10 selection:text-[#1B4332]">
      <div>
        <Header
          onOpenCart={() => setIsCartOpen(true)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        <main className="pt-0">
          <motion.div
            key={activePortal}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            {activePortal === 'CUSTOMER' && (
              <CustomerPortal
                activeTab={customerTab}
                setActiveTab={setCustomerTab}
                isCartOpen={isCartOpen}
                setIsCartOpen={setIsCartOpen}
              />
            )}

            {activePortal === 'RESTAURANT' && (
              <RestaurantPortal
                activeTab={restaurantTab}
                setActiveTab={setRestaurantTab}
              />
            )}

            {activePortal === 'DELIVERY' && (
              <DeliveryPortal
                activeTab={deliveryTab}
                setActiveTab={setDeliveryTab}
              />
            )}

            {activePortal === 'ADMIN' && (
              <AdminPortal
                activeTab={adminTab}
                setActiveTab={setAdminTab}
              />
            )}
          </motion.div>
        </main>
      </div>

      <DemoAccountBar
        onOpenAuth={handleOpenLogin}
        onLogout={logout}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
