import React, { useState, useEffect } from 'react';
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

const AppContent: React.FC = () => {
  const { currentUser, users, loginWithFirebaseUser } = useApp();

  const [authView, setAuthView] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
  const [googlePrefillData, setGooglePrefillData] = useState<{
    uid: string;
    email: string;
    name: string;
    photoURL?: string;
  } | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Check if returning from a Google Redirect authentication flow
  useEffect(() => {
    checkGoogleRedirectResult().then((res) => {
      if (res && res.success && res.user && res.user.email) {
        const targetEmail = res.user.email.toLowerCase();
        const existing = users.find((u) => u.email.toLowerCase() === targetEmail);
        if (existing) {
          loginWithFirebaseUser(res.user);
        } else {
          setGooglePrefillData({
            uid: res.user.uid,
            email: res.user.email,
            name: res.user.displayName || res.user.email.split('@')[0],
            photoURL: res.user.photoURL || undefined,
          });
          setAuthView('SIGNUP');
        }
      }
    });
  }, [users, loginWithFirebaseUser]);

  // Tab state per role
  const [customerTab, setCustomerTab] = useState('menu');
  const [restaurantTab, setRestaurantTab] = useState('kitchen');
  const [deliveryTab, setDeliveryTab] = useState('pool');
  const [adminTab, setAdminTab] = useState('approvals');

  // If user is not logged in, show Login or Signup
  if (!currentUser) {
    return (
      <div className="relative">
        {authView === 'LOGIN' ? (
          <LoginView
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
        <DemoAccountBar />
      </div>
    );
  }

  // If restaurant or delivery partner account is PENDING_APPROVAL, gate with PendingApprovalView
  if (currentUser.status === 'PENDING_APPROVAL') {
    return (
      <div className="relative">
        <PendingApprovalView />
        <DemoAccountBar />
      </div>
    );
  }

  // Get active tab and setter based on current role
  const getCurrentTabAndSetter = () => {
    switch (currentUser.role) {
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

        <main>
          <motion.div
            key={currentUser.role}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            {currentUser.role === 'CUSTOMER' && (
              <CustomerPortal
                activeTab={customerTab}
                setActiveTab={setCustomerTab}
                isCartOpen={isCartOpen}
                setIsCartOpen={setIsCartOpen}
              />
            )}

            {currentUser.role === 'RESTAURANT' && (
              <RestaurantPortal
                activeTab={restaurantTab}
                setActiveTab={setRestaurantTab}
              />
            )}

            {currentUser.role === 'DELIVERY' && (
              <DeliveryPortal
                activeTab={deliveryTab}
                setActiveTab={setDeliveryTab}
              />
            )}

            {currentUser.role === 'ADMIN' && (
              <AdminPortal
                activeTab={adminTab}
                setActiveTab={setAdminTab}
              />
            )}
          </motion.div>
        </main>
      </div>

      {/* Floating Demo Account Quick-Switcher Bar */}
      <DemoAccountBar />
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
