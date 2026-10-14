import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  User,
  UserRole,
  AccountStatus,
  MenuItem,
  SurplusListing,
  Order,
  OrderStatus,
  OnboardingApplication,
  AuditLog,
  NotificationItem,
  HistoricalDailyRecord,
  ModelAccuracyEvaluation,
  WhatIfScenarioParameters,
} from '../types';
import {
  SEED_USERS,
  SEED_MENU_ITEMS,
  SEED_SURPLUS_LISTINGS,
  SEED_ONBOARDING_APPLICATIONS,
  SEED_ORDERS,
  SEED_AUDIT_LOGS,
  SEED_NOTIFICATIONS,
} from '../data/seedData';
import {
  generate3YearHistoricalDataset,
  evaluateForecastAccuracy,
} from '../services/historicalDataEngine';
import { signOutFirebase, saveOrderToFirestore, saveSurplusToFirestore } from '../services/firebase';

export interface CartItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  isSurplus?: boolean;
  surplusListingId?: string;
  imageUrl?: string;
  isVeg: boolean;
}

interface AppContextType {
  currentUser: User | null;
  users: User[];
  menuItems: MenuItem[];
  surplusListings: SurplusListing[];
  orders: Order[];
  applications: OnboardingApplication[];
  auditLogs: AuditLog[];
  notifications: NotificationItem[];
  cart: CartItem[];
  historyRecords: HistoricalDailyRecord[];
  accuracyEvaluation: ModelAccuracyEvaluation;
  whatIfParams: WhatIfScenarioParameters;
  setWhatIfParams: React.Dispatch<React.SetStateAction<WhatIfScenarioParameters>>;

  login: (email: string) => boolean;
  loginWithGoogle: (email?: string, name?: string) => boolean;
  loginWithFirebaseUser: (data: { uid?: string; email: string | null; displayName: string | null; photoURL?: string | null }) => boolean;
  quickLoginDemo: (role: UserRole) => void;
  logout: () => void;
  registerCustomer: (data: { name: string; email: string; phone: string; address: string }) => boolean;
  registerRestaurant: (data: {
    ownerName: string;
    restaurantName: string;
    email: string;
    phone: string;
    cuisine: string;
    address: string;
    kitchenCapability: string;
  }) => boolean;
  registerDelivery: (data: {
    name: string;
    email: string;
    phone: string;
    vehicleType: 'EV_SCOOTER' | 'MOTORBIKE' | 'BICYCLE' | 'VAN';
    vehicleNumber: string;
    serviceArea: string;
    licenseNo: string;
  }) => boolean;

  searchQuery: string;
  setSearchQuery: (query: string) => void;

  addToCart: (item: MenuItem | SurplusListing, isSurplus?: boolean) => void;
  removeFromCart: (cartItemId: string) => void;
  updateCartQuantity: (cartItemId: string, delta: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartOriginalTotal: number;
  cartSavings: number;

  placeOrder: (paymentMethod: 'UPI' | 'CARD' | 'COD', deliveryAddress: string, notes?: string) => Order | null;
  addRestaurantOrder: (orderData: {
    customerName: string;
    customerPhone?: string;
    deliveryAddress?: string;
    orderType?: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
    items: { menuItemId: string; name: string; price: number; quantity: number }[];
    paymentMethod: 'UPI' | 'CARD' | 'COD';
    paymentStatus?: 'PAID' | 'PENDING';
    notes?: string;
  }) => Order;
  restaurantAcceptOrder: (orderId: string) => void;
  restaurantRejectOrder: (orderId: string, reason: string) => void;
  restaurantStartPrep: (orderId: string) => void;
  restaurantMarkReady: (orderId: string) => void;
  deliveryAcceptOrder: (orderId: string) => boolean;
  deliveryDeclineOrder: (orderId: string) => void;
  deliveryUpdateStatus: (orderId: string, status: 'PICKED_UP' | 'OUT_FOR_DELIVERY' | 'DELIVERED') => void;

  addMenuItem: (item: Omit<MenuItem, 'id' | 'restaurantId'>) => void;
  updateMenuItem: (id: string, updates: Partial<MenuItem>) => void;
  deleteMenuItem: (id: string) => void;
  createSurplusListing: (listing: Omit<SurplusListing, 'id' | 'restaurantId' | 'currentPrice' | 'listedAt' | 'status'>) => void;
  updateSurplusListing: (id: string, updates: Partial<SurplusListing>) => void;

  approveApplication: (appId: string) => void;
  rejectApplication: (appId: string, reason: string) => void;
  resetDemoData: () => void;

  advanceOrderSimulation: (orderId: string) => OrderStatus | null;

  calculateLiveSurplusPrice: (listing: SurplusListing) => number;
  getSurplusPricingBreakdown: (listing: SurplusListing) => {
    timeLeftMinutes: number;
    timeProgressPercent: number;
    quantityRatioPercent: number;
    livePrice: number;
    discountPercent: number;
    urgencyLevel: 'PEAK_CLEARANCE' | 'HIGH_PRESSURE' | 'MODERATE' | 'FINAL_CALL';
    urgencyLabel: string;
  };

  addNotification: (notif: {
    title: string;
    message: string;
    type?: 'ORDER' | 'APPROVAL' | 'SURPLUS' | 'FORECAST';
    role?: UserRole;
    actionLink?: string;
  }) => void;
  markAllNotificationsAsRead: () => void;
  clearAllNotifications: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEYS = {
  USERS: 'lastplate_users_v2',
  CURRENT_USER_ID: 'lastplate_current_user_id_v2',
  MENU: 'lastplate_menu_v2',
  SURPLUS: 'lastplate_surplus_v3',
  ORDERS: 'lastplate_orders_v3',
  APPS: 'lastplate_apps_v2',
  LOGS: 'lastplate_logs_v2',
  NOTIFS: 'lastplate_notifs_v2',
  CART: 'lastplate_cart_v2',
};

const sanitizeBangaloreAddress = (addr: string): string => {
  if (!addr) return addr;
  if (/haryana|gurugram|dlf phase 5|122002/i.test(addr)) {
    return 'Flat 402, Prestige Ferns Residency, HSR Layout Sector 2, Bengaluru, Karnataka - 560102';
  }
  return addr;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USERS);
    const parsed: User[] = saved ? JSON.parse(saved) : SEED_USERS;
    return parsed.map((u) => {
      if (u.customerProfile) {
        return {
          ...u,
          customerProfile: {
            ...u.customerProfile,
            defaultAddress: sanitizeBangaloreAddress(u.customerProfile.defaultAddress),
            savedAddresses: (u.customerProfile.savedAddresses || []).map(sanitizeBangaloreAddress),
          },
        };
      }
      return u;
    });
  });

  const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID) || 'user-customer-1';
  });

  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MENU);
    return saved ? JSON.parse(saved) : SEED_MENU_ITEMS;
  });

  const [surplusListings, setSurplusListings] = useState<SurplusListing[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SURPLUS);
    return saved ? JSON.parse(saved) : SEED_SURPLUS_LISTINGS;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
    const parsed: Order[] = saved ? JSON.parse(saved) : SEED_ORDERS;
    return parsed.map((o) => ({
      ...o,
      deliveryAddress: sanitizeBangaloreAddress(o.deliveryAddress),
    }));
  });

  const [applications, setApplications] = useState<OnboardingApplication[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.APPS);
    return saved ? JSON.parse(saved) : SEED_ONBOARDING_APPLICATIONS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LOGS);
    return saved ? JSON.parse(saved) : SEED_AUDIT_LOGS;
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.NOTIFS);
    return saved ? JSON.parse(saved) : SEED_NOTIFICATIONS;
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CART);
    return saved ? JSON.parse(saved) : [];
  });

  const [searchQuery, setSearchQuery] = useState('');

  const [whatIfParams, setWhatIfParams] = useState<WhatIfScenarioParameters>({
    demandMultiplier: 1.0,
    safetyBufferPercent: 12,
    priceAdjustmentPercent: 0,
    productionCostUnit: 60,
    wastePenaltyCostUnit: 45,
    missedSalePenaltyUnit: 90,
    festivalImpactFactor: 1.0,
  });

  const historyRecords = useMemo(() => {
    return generate3YearHistoricalDataset();
  }, []);

  const accuracyEvaluation = useMemo(() => {
    return evaluateForecastAccuracy(historyRecords);
  }, [historyRecords]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUserId) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, currentUserId);
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
    }
  }, [currentUserId]);

  const broadcastSync = useCallback((payload: Record<string, any>) => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const bc = new BroadcastChannel('lastplate_realtime_sync');
        bc.postMessage({ type: 'SYNC_STATE', ...payload });
        bc.close();
      } catch (err) {

      }
    }
  }, []);

  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      bc = new BroadcastChannel('lastplate_realtime_sync');
      bc.onmessage = (event) => {
        if (event.data?.type === 'SYNC_STATE') {
          const { orders: o, apps: a, users: u, surplus: s, notifs: n, menu: m } = event.data;
          if (o) setOrders(o);
          if (a) setApplications(a);
          if (u) setUsers(u);
          if (s) setSurplusListings(s);
          if (n) setNotifications(n);
          if (m) setMenuItems(m);
        }
      };
    }

    const handleStorage = (e: StorageEvent) => {
      if (!e.newValue) return;
      try {
        if (e.key === STORAGE_KEYS.ORDERS) setOrders(JSON.parse(e.newValue));
        if (e.key === STORAGE_KEYS.APPS) setApplications(JSON.parse(e.newValue));
        if (e.key === STORAGE_KEYS.USERS) setUsers(JSON.parse(e.newValue));
        if (e.key === STORAGE_KEYS.SURPLUS) setSurplusListings(JSON.parse(e.newValue));
        if (e.key === STORAGE_KEYS.NOTIFS) setNotifications(JSON.parse(e.newValue));
        if (e.key === STORAGE_KEYS.MENU) setMenuItems(JSON.parse(e.newValue));
      } catch (err) {

      }
    };

    window.addEventListener('storage', handleStorage);
    return () => {
      if (bc) bc.close();
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(menuItems));
    broadcastSync({ menu: menuItems });
  }, [menuItems, broadcastSync]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SURPLUS, JSON.stringify(surplusListings));
    broadcastSync({ surplus: surplusListings });
  }, [surplusListings, broadcastSync]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    broadcastSync({ orders });
  }, [orders, broadcastSync]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.APPS, JSON.stringify(applications));
    broadcastSync({ apps: applications });
  }, [applications, broadcastSync]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    broadcastSync({ users });
  }, [users, broadcastSync]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTIFS, JSON.stringify(notifications));
    broadcastSync({ notifs: notifications });
  }, [notifications, broadcastSync]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
  }, [cart]);

  const currentUser = useMemo(() => {
    return users.find((u) => u.id === currentUserId) || null;
  }, [users, currentUserId]);

  const addAuditLog = useCallback(
    (action: string, details: string, targetId?: string) => {
      const newLog: AuditLog = {
        id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
        actorEmail: currentUser ? currentUser.email : 'system@lastplate.demo',
        actorRole: currentUser ? currentUser.role : 'ADMIN',
        action,
        targetId,
        details,
      };
      setAuditLogs((prev) => [newLog, ...prev]);
    },
    [currentUser]
  );

  const calculateLiveSurplusPrice = useCallback((listing: SurplusListing): number => {
    const now = Date.now();
    const listed = new Date(listing.listedAt).getTime();
    let close = new Date(listing.closingTime).getTime();

    if (close <= now) {
      close = now + 48 * 60 * 1000;
    }

    const totalDuration = Math.max(1, close - listed);
    const elapsed = Math.max(0, now - listed);
    const timeProgress = Math.min(1, Math.max(0, elapsed / totalDuration));

    const initialQty = Math.max(1, listing.initialQuantity);
    const qtyRatio = Math.min(1, Math.max(0, listing.quantityAvailable / initialQty));

    const timeDecayFactor = Math.pow(timeProgress, 1.25);

    const quantityClearanceFactor = 0.70 + 0.40 * qtyRatio;

    const combinedDiscountFactor = Math.min(1.0, Math.max(0.15, timeDecayFactor * quantityClearanceFactor));

    const priceDrop = (listing.originalPrice - listing.minPrice) * combinedDiscountFactor;
    const calculatedPrice = listing.originalPrice - priceDrop;

    return Math.max(listing.minPrice, Math.min(listing.originalPrice, Math.round(calculatedPrice)));
  }, []);

  const getSurplusPricingBreakdown = useCallback(
    (listing: SurplusListing) => {
      const now = Date.now();
      let close = new Date(listing.closingTime).getTime();
      const listed = new Date(listing.listedAt).getTime();
      if (close <= now) {
        close = now + 48 * 60 * 1000;
      }

      const timeLeftMs = Math.max(0, close - now);
      const timeLeftMinutes = Math.max(0, Math.round(timeLeftMs / (60 * 1000)));

      const totalDuration = Math.max(1, close - listed);
      const elapsed = Math.max(0, now - listed);
      const timeProgressPercent = Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)));

      const initialQty = Math.max(1, listing.initialQuantity);
      const quantityRatioPercent = Math.min(100, Math.max(0, Math.round((listing.quantityAvailable / initialQty) * 100)));

      const livePrice = calculateLiveSurplusPrice(listing);
      const discountPercent = Math.round(((listing.originalPrice - livePrice) / listing.originalPrice) * 100);

      let urgencyLevel: 'PEAK_CLEARANCE' | 'HIGH_PRESSURE' | 'MODERATE' | 'FINAL_CALL' = 'MODERATE';
      let urgencyLabel = `${timeLeftMinutes}m left · ${listing.quantityAvailable} unsold portions`;

      if (timeLeftMinutes <= 45 && listing.quantityAvailable >= 4) {
        urgencyLevel = 'PEAK_CLEARANCE';
        urgencyLabel = `Peak Clearance: ${timeLeftMinutes}m to close with ${listing.quantityAvailable} unsold portions (maximum dynamic markdown)`;
      } else if (listing.quantityAvailable <= 2) {
        urgencyLevel = 'FINAL_CALL';
        urgencyLabel = `Final ${listing.quantityAvailable} portions remaining (scarcity buffer active)`;
      } else if (timeLeftMinutes <= 90) {
        urgencyLevel = 'HIGH_PRESSURE';
        urgencyLabel = `Closing soon (${timeLeftMinutes}m): dynamic discount boosted for ${listing.quantityAvailable} portions`;
      }

      return {
        timeLeftMinutes,
        timeProgressPercent,
        quantityRatioPercent,
        livePrice,
        discountPercent,
        urgencyLevel,
        urgencyLabel,
      };
    },
    [calculateLiveSurplusPrice]
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setSurplusListings((prev) => {
        let changed = false;
        const updated = prev.map((item) => {
          const newPrice = calculateLiveSurplusPrice(item);
          if (newPrice !== item.currentPrice) {
            changed = true;
            return {
              ...item,
              currentPrice: newPrice,
            };
          }
          return item;
        });
        return changed ? updated : prev;
      });
    }, 5000);
    return () => clearInterval(timer);
  }, [calculateLiveSurplusPrice]);

  const login = useCallback(
    (email: string): boolean => {
      const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (user) {
        setCurrentUserId(user.id);
        const isDemo = user.id === 'user-customer-1' || user.id === 'user-restaurant-1' || user.id === 'user-delivery-1' || user.id === 'user-admin-1' || user.email.endsWith('@lastplate.demo');
        if (!isDemo) {
          setCart([]);
          localStorage.removeItem(STORAGE_KEYS.CART);
        }
        addAuditLog('USER_LOGIN', `User ${user.email} signed in via email credential.`);
        return true;
      }

      const namePart = email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      const newUser: User = {
        id: `user-real-${Date.now()}`,
        email: email,
        name: namePart || 'Account Holder',
        role: 'CUSTOMER',
        status: 'APPROVED',
        createdAt: new Date().toISOString(),
        customerProfile: {
          defaultAddress: '',
          savedAddresses: [],
          totalRescuedMeals: 0,
          totalSavedAmount: 0,
        },
      };
      setUsers((prev) => [...prev, newUser]);
      setCurrentUserId(newUser.id);
      setCart([]);
      localStorage.removeItem(STORAGE_KEYS.CART);
      addAuditLog('USER_LOGIN', `Real user account created and signed in: ${newUser.email}`);
      return true;
    },
    [users, addAuditLog]
  );

  const loginWithGoogle = useCallback(
    (email?: string, name?: string): boolean => {
      const targetEmail = email || 'user.google@gmail.com';
      const targetName = name || (email ? email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Google User');
      let existing = users.find((u) => u.email.toLowerCase() === targetEmail.toLowerCase());

      if (!existing) {

        const newUser: User = {
          id: `user-g-${Date.now()}`,
          email: targetEmail,
          name: targetName,
          role: 'CUSTOMER',
          status: 'APPROVED',
          avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
          createdAt: new Date().toISOString(),
          customerProfile: {
            defaultAddress: '',
            savedAddresses: [],
            totalRescuedMeals: 0,
            totalSavedAmount: 0,
          },
        };
        setUsers((prev) => [...prev, newUser]);
        setCurrentUserId(newUser.id);
        setCart([]);
        localStorage.removeItem(STORAGE_KEYS.CART);
        addAuditLog('GOOGLE_SIGNUP', `Real user ${newUser.email} signed up with Google.`);
        return true;
      }

      setCurrentUserId(existing.id);
      setCart([]);
      localStorage.removeItem(STORAGE_KEYS.CART);
      addAuditLog('GOOGLE_LOGIN', `User ${existing.email} authenticated via Google Auth.`);
      return true;
    },
    [users, addAuditLog]
  );

  const loginWithFirebaseUser = useCallback(
    (data: { uid?: string; email: string | null; displayName: string | null; photoURL?: string | null }): boolean => {
      const targetEmail = data.email || 'user@google.com';
      const targetName = data.displayName || (targetEmail.includes('@') ? targetEmail.split('@')[0] : 'User');
      const targetAvatar = data.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';

      let existing = users.find((u) => u.email.toLowerCase() === targetEmail.toLowerCase());

      if (!existing) {

        const newUser: User = {
          id: data.uid || `user-g-${Date.now()}`,
          email: targetEmail,
          name: targetName,
          role: 'CUSTOMER',
          status: 'APPROVED',
          avatarUrl: targetAvatar,
          createdAt: new Date().toISOString(),
          customerProfile: {
            defaultAddress: '',
            savedAddresses: [],
            totalRescuedMeals: 0,
            totalSavedAmount: 0,
          },
        };
        setUsers((prev) => [...prev, newUser]);
        setCurrentUserId(newUser.id);
        setCart([]);
        localStorage.removeItem(STORAGE_KEYS.CART);
        addAuditLog('FIREBASE_GOOGLE_AUTH', `Authenticated Firebase user: ${targetName} (${targetEmail})`);
        return true;
      }

      setUsers((prev) =>
        prev.map((u) =>
          u.id === existing!.id
            ? {
                ...u,
                name: targetName || u.name,
                avatarUrl: targetAvatar || u.avatarUrl,
              }
            : u
        )
      );
      setCurrentUserId(existing.id);
      setCart([]);
      localStorage.removeItem(STORAGE_KEYS.CART);
      addAuditLog('FIREBASE_GOOGLE_AUTH', `Authenticated Firebase user: ${existing.email}`);
      return true;
    },
    [users, addAuditLog]
  );

  const quickLoginDemo = useCallback(
    (role: UserRole) => {
      const demoUser = users.find((u) => u.role === role && u.status === 'APPROVED');
      if (demoUser) {
        setCurrentUserId(demoUser.id);
        addAuditLog('DEMO_ROLE_SWITCH', `Switched active session to demo identity: ${demoUser.email} (${role})`);
      }
    },
    [users, addAuditLog]
  );

  const logout = useCallback(() => {
    if (currentUser) {
      addAuditLog('USER_LOGOUT', `User ${currentUser.email} signed out.`);
    }
    signOutFirebase();
    setCart([]);
    localStorage.removeItem(STORAGE_KEYS.CART);
    setCurrentUserId(null);
  }, [currentUser, addAuditLog]);

  const registerCustomer = useCallback(
    (data: { name: string; email: string; phone: string; address: string }): boolean => {
      const existing = users.find((u) => u.email.toLowerCase() === data.email.toLowerCase());
      if (existing) return false;

      const newUser: User = {
        id: `user-cust-${Date.now()}`,
        email: data.email,
        name: data.name,
        role: 'CUSTOMER',
        status: 'APPROVED',
        phone: data.phone,
        createdAt: new Date().toISOString(),
        customerProfile: {
          defaultAddress: data.address,
          savedAddresses: [data.address],
          totalRescuedMeals: 0,
          totalSavedAmount: 0,
        },
      };

      setUsers((prev) => [...prev, newUser]);
      setCurrentUserId(newUser.id);
      setCart([]);
      localStorage.removeItem(STORAGE_KEYS.CART);
      addAuditLog('CUSTOMER_REGISTERED', `Customer account created: ${newUser.email}`);
      return true;
    },
    [users, addAuditLog]
  );

  const registerRestaurant = useCallback(
    (data: {
      ownerName: string;
      restaurantName: string;
      email: string;
      phone: string;
      cuisine: string;
      address: string;
      kitchenCapability: string;
    }): boolean => {
      const existing = users.find((u) => u.email.toLowerCase() === data.email.toLowerCase());
      if (existing) return false;

      const restId = `rest-${Date.now()}`;
      const newUser: User = {
        id: `user-rest-${Date.now()}`,
        email: data.email,
        name: data.ownerName,
        role: 'RESTAURANT',
        status: 'PENDING_APPROVAL',
        phone: data.phone,
        createdAt: new Date().toISOString(),
        restaurantProfile: {
          restaurantId: restId,
          name: data.restaurantName,
          ownerName: data.ownerName,
          cuisine: data.cuisine,
          address: data.address,
          openingHours: '09:00 AM - 11:00 PM',
          closingTimeStr: '23:00',
          operatingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          phone: data.phone,
          rating: 4.5,
          totalReviews: 0,
          kitchenCapability: data.kitchenCapability,
          description: `${data.restaurantName} - Verified quality kitchen partner.`,
        },
      };

      const newApp: OnboardingApplication = {
        id: `app-rest-${Date.now()}`,
        userId: newUser.id,
        applicantName: data.ownerName,
        email: data.email,
        phone: data.phone,
        role: 'RESTAURANT',
        submittedAt: new Date().toISOString(),
        status: 'PENDING_APPROVAL',
        details: {
          restaurantName: data.restaurantName,
          cuisine: data.cuisine,
          address: data.address,
          kitchenCapability: data.kitchenCapability,
        },
      };

      setUsers((prev) => [...prev, newUser]);
      setApplications((prev) => [newApp, ...prev]);
      setCurrentUserId(newUser.id);
      setCart([]);
      localStorage.removeItem(STORAGE_KEYS.CART);
      addAuditLog('RESTAURANT_APPLICATION_SUBMITTED', `New restaurant application submitted for ${data.restaurantName} by ${data.email}.`);
      return true;
    },
    [users, addAuditLog]
  );

  const registerDelivery = useCallback(
    (data: {
      name: string;
      email: string;
      phone: string;
      vehicleType: 'EV_SCOOTER' | 'MOTORBIKE' | 'BICYCLE' | 'VAN';
      vehicleNumber: string;
      serviceArea: string;
      licenseNo: string;
    }): boolean => {
      const existing = users.find((u) => u.email.toLowerCase() === data.email.toLowerCase());
      if (existing) return false;

      const newUser: User = {
        id: `user-del-${Date.now()}`,
        email: data.email,
        name: data.name,
        role: 'DELIVERY',
        status: 'PENDING_APPROVAL',
        phone: data.phone,
        createdAt: new Date().toISOString(),
        deliveryProfile: {
          vehicleType: data.vehicleType,
          vehicleNumber: data.vehicleNumber,
          serviceArea: data.serviceArea,
          isOnline: false,
          totalDeliveries: 0,
          rating: 5.0,
          earningsInr: 0,
          drivingLicenseNo: data.licenseNo,
        },
      };

      const newApp: OnboardingApplication = {
        id: `app-del-${Date.now()}`,
        userId: newUser.id,
        applicantName: data.name,
        email: data.email,
        phone: data.phone,
        role: 'DELIVERY',
        submittedAt: new Date().toISOString(),
        status: 'PENDING_APPROVAL',
        details: {
          vehicleType: data.vehicleType,
          vehicleNumber: data.vehicleNumber,
          serviceArea: data.serviceArea,
          licenseNo: data.licenseNo,
        },
      };

      setUsers((prev) => [...prev, newUser]);
      setApplications((prev) => [newApp, ...prev]);
      setCurrentUserId(newUser.id);
      setCart([]);
      localStorage.removeItem(STORAGE_KEYS.CART);
      addAuditLog('DELIVERY_APPLICATION_SUBMITTED', `Delivery partner application submitted by ${data.name} (${data.email}).`);
      return true;
    },
    [users, addAuditLog]
  );

  const addToCart = useCallback(
    (item: MenuItem | SurplusListing, isSurplus = false) => {
      const cartItemId = isSurplus ? `surplus-${item.id}` : `menu-${item.id}`;
      const price = isSurplus ? (item as SurplusListing).currentPrice : (item as MenuItem).price;
      const origPrice = isSurplus ? (item as SurplusListing).originalPrice : undefined;

      setCart((prev) => {
        const existing = prev.find((ci) => ci.id === cartItemId);
        if (existing) {
          return prev.map((ci) =>
            ci.id === cartItemId ? { ...ci, quantity: ci.quantity + 1 } : ci
          );
        }
        return [
          ...prev,
          {
            id: cartItemId,
            menuItemId: item.id,
            name: isSurplus ? `${item.name} (Rescue Deal)` : item.name,
            price,
            originalPrice: origPrice,
            quantity: 1,
            isSurplus,
            surplusListingId: isSurplus ? item.id : undefined,
            imageUrl: item.imageUrl,
            isVeg: item.isVeg,
          },
        ];
      });
    },
    []
  );

  const removeFromCart = useCallback((cartItemId: string) => {
    setCart((prev) => prev.filter((ci) => ci.id !== cartItemId));
  }, []);

  const updateCartQuantity = useCallback((cartItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((ci) => {
          if (ci.id === cartItemId) {
            const nextQty = ci.quantity + delta;
            return nextQty > 0 ? { ...ci, quantity: nextQty } : null;
          }
          return ci;
        })
        .filter(Boolean) as CartItem[]
    );
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const { cartTotal, cartOriginalTotal, cartSavings } = useMemo(() => {
    let total = 0;
    let orig = 0;
    for (const item of cart) {
      total += item.price * item.quantity;
      orig += (item.originalPrice || item.price) * item.quantity;
    }
    return {
      cartTotal: total,
      cartOriginalTotal: orig,
      cartSavings: Math.max(0, orig - total),
    };
  }, [cart]);

  const placeOrder = useCallback(
    (
      paymentMethod: 'UPI' | 'CARD' | 'COD',
      deliveryAddress: string,
      notes?: string
    ): Order | null => {
      if (cart.length === 0 || !currentUser) return null;

      const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
      const hasSurplus = cart.some((i) => i.isSurplus);
      const deliveryFee = 35;
      const finalAmount = cartTotal + deliveryFee;

      const newOrder: Order = {
        id: orderId,
        customerId: currentUser.id,
        customerName: currentUser.name,
        customerPhone: currentUser.phone || '+91 98112 34567',
        deliveryAddress,
        restaurantId: 'rest-green-leaf',
        restaurantName: 'Green Leaf Kitchen',
        items: cart.map((i) => ({
          menuItemId: i.menuItemId,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          isSurplus: i.isSurplus,
          surplusListingId: i.surplusListingId,
        })),
        itemTotal: cartTotal,
        discountTotal: cartSavings,
        deliveryFee,
        finalAmount,
        paymentMethod,
        paymentStatus: paymentMethod === 'COD' ? 'PENDING' : 'PAID',
        paymentId: paymentMethod !== 'COD' ? `PAY-${paymentMethod}-${Date.now().toString().slice(-6)}` : undefined,
        orderStatus: 'ORDER_PLACED',
        estimatedDeliveryMinutes: 30,
        deliveryDistanceKm: 3.2,
        timeline: [
          {
            status: 'ORDER_PLACED',
            timestamp: new Date().toISOString(),
            description: `Order successfully placed via ${paymentMethod} payment simulation`,
            actor: currentUser.name,
          },
        ],
        createdAt: new Date().toISOString(),
        hasSurplusItems: hasSurplus,
        savedAmount: cartSavings,
        notes,
      };

      setMenuItems((prev) =>
        prev.map((item) => {
          const ordered = cart.find((c) => !c.isSurplus && c.menuItemId === item.id);
          if (ordered) {
            return {
              ...item,
              currentStock: Math.max(0, item.currentStock - ordered.quantity),
            };
          }
          return item;
        })
      );

      setSurplusListings((prev) =>
        prev.map((listing) => {
          const ordered = cart.find((c) => c.isSurplus && c.surplusListingId === listing.id);
          if (ordered) {
            const nextQty = Math.max(0, listing.quantityAvailable - ordered.quantity);
            return {
              ...listing,
              quantityAvailable: nextQty,
              status: nextQty === 0 ? 'SOLD_OUT' : listing.status,
            };
          }
          return listing;
        })
      );

      setUsers((prev) =>
        prev.map((u) => {
          if (u.id === currentUser.id && u.customerProfile) {
            return {
              ...u,
              customerProfile: {
                ...u.customerProfile,
                totalRescuedMeals:
                  u.customerProfile.totalRescuedMeals + (hasSurplus ? 1 : 0),
                totalSavedAmount: u.customerProfile.totalSavedAmount + cartSavings,
              },
            };
          }
          return u;
        })
      );

      setOrders((prev) => [newOrder, ...prev]);
      saveOrderToFirestore(newOrder);
      clearCart();
      addAuditLog('ORDER_CREATED', `Order ${orderId} created by ${currentUser.email} for ₹${finalAmount}.`, orderId);

      const custNotif: NotificationItem = {
        id: `notif-${Date.now()}-cust`,
        userId: currentUser.id,
        title: `Order Placed (#${orderId})`,
        message: `Your meal from ${newOrder.restaurantName} is confirmed for ₹${finalAmount}. Kitchen is preparing!`,
        type: 'ORDER',
        read: false,
        createdAt: new Date().toISOString(),
        role: 'CUSTOMER',
      };

      const restNotif: NotificationItem = {
        id: `notif-${Date.now()}-rest`,
        userId: 'user-restaurant-1',
        title: `Incoming Order (${orderId})`,
        message: `${currentUser.name} ordered ${newOrder.items.length} items. Total: ₹${finalAmount}.`,
        type: 'ORDER',
        read: false,
        createdAt: new Date().toISOString(),
        role: 'RESTAURANT',
      };
      setNotifications((prev) => [custNotif, restNotif, ...prev]);

      return newOrder;
    },
    [cart, currentUser, cartTotal, cartSavings, clearCart, addAuditLog]
  );

  const addRestaurantOrder = useCallback(
    (orderData: {
      customerName: string;
      customerPhone?: string;
      deliveryAddress?: string;
      orderType?: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
      items: { menuItemId: string; name: string; price: number; quantity: number }[];
      paymentMethod: 'UPI' | 'CARD' | 'COD';
      paymentStatus?: 'PAID' | 'PENDING';
      notes?: string;
    }): Order => {
      const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
      const itemTotal = orderData.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const deliveryFee = orderData.orderType === 'DELIVERY' ? 35 : 0;
      const finalAmount = itemTotal + deliveryFee;

      const restId = currentUser?.restaurantProfile?.restaurantId || 'rest-green-leaf';
      const restName = currentUser?.restaurantProfile?.name || 'Green Leaf Kitchen';

      const initialStatus: OrderStatus =
        orderData.orderType === 'DINE_IN' ? 'PREPARING' : 'ORDER_PLACED';

      const newOrder: Order = {
        id: orderId,
        customerId: `guest-${Date.now().toString().slice(-4)}`,
        customerName: orderData.customerName || 'Walk-in Guest',
        customerPhone: orderData.customerPhone || '+91 98765 00000',
        deliveryAddress: orderData.deliveryAddress || (orderData.orderType === 'DINE_IN' ? 'Table Order (Dine-in)' : 'Counter Pickup'),
        restaurantId: restId,
        restaurantName: restName,
        items: orderData.items.map((i) => ({
          menuItemId: i.menuItemId,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          isSurplus: false,
        })),
        itemTotal,
        discountTotal: 0,
        deliveryFee,
        finalAmount,
        paymentMethod: orderData.paymentMethod,
        paymentStatus: orderData.paymentStatus || 'PAID',
        paymentId: `POS-${Date.now().toString().slice(-6)}`,
        orderStatus: initialStatus,
        estimatedDeliveryMinutes: 20,
        deliveryDistanceKm: 1.0,
        timeline: [
          {
            status: initialStatus,
            timestamp: new Date().toISOString(),
            description: `Order created directly by restaurant staff (${orderData.orderType || 'Kitchen Order'})`,
            actor: currentUser?.name || 'Restaurant Staff',
          },
        ],
        createdAt: new Date().toISOString(),
        hasSurplusItems: false,
        savedAmount: 0,
        notes: orderData.notes,
      };

      setMenuItems((prev) =>
        prev.map((item) => {
          const ordered = orderData.items.find((i) => i.menuItemId === item.id);
          if (ordered) {
            return {
              ...item,
              currentStock: Math.max(0, item.currentStock - ordered.quantity),
            };
          }
          return item;
        })
      );

      setOrders((prev) => [newOrder, ...prev]);
      saveOrderToFirestore(newOrder);
      addAuditLog('ORDER_CREATED_BY_RESTAURANT', `Kitchen order ${orderId} created by ${currentUser?.email || 'restaurant'} for ₹${finalAmount}`, orderId);

      return newOrder;
    },
    [currentUser, addAuditLog]
  );

  const restaurantAcceptOrder = useCallback(
    (orderId: string) => {
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id === orderId && o.orderStatus === 'ORDER_PLACED') {
            return {
              ...o,
              orderStatus: 'RESTAURANT_ACCEPTED',
              timeline: [
                ...o.timeline,
                {
                  status: 'RESTAURANT_ACCEPTED',
                  timestamp: new Date().toISOString(),
                  description: 'Kitchen confirmed order and entered production queue',
                  actor: currentUser?.name || 'Restaurant',
                },
              ],
            };
          }
          return o;
        })
      );
      addAuditLog('ORDER_ACCEPTED', `Restaurant accepted order ${orderId}`, orderId);
    },
    [currentUser, addAuditLog]
  );

  const restaurantRejectOrder = useCallback(
    (orderId: string, reason: string) => {
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id === orderId) {
            return {
              ...o,
              orderStatus: 'REJECTED',
              rejectionReason: reason,
              timeline: [
                ...o.timeline,
                {
                  status: 'REJECTED',
                  timestamp: new Date().toISOString(),
                  description: `Order rejected by restaurant: ${reason}`,
                  actor: currentUser?.name || 'Restaurant',
                },
              ],
            };
          }
          return o;
        })
      );
      addAuditLog('ORDER_REJECTED', `Order ${orderId} rejected. Reason: ${reason}`, orderId);
    },
    [currentUser, addAuditLog]
  );

  const restaurantStartPrep = useCallback(
    (orderId: string) => {
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id === orderId) {
            return {
              ...o,
              orderStatus: 'PREPARING',
              timeline: [
                ...o.timeline,
                {
                  status: 'PREPARING',
                  timestamp: new Date().toISOString(),
                  description: 'Chef is actively preparing dishes fresh',
                  actor: currentUser?.name || 'Restaurant',
                },
              ],
            };
          }
          return o;
        })
      );
    },
    [currentUser]
  );

  const restaurantMarkReady = useCallback(
    (orderId: string) => {
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id === orderId) {
            return {
              ...o,
              orderStatus: 'READY_FOR_PICKUP',
              timeline: [
                ...o.timeline,
                {
                  status: 'READY_FOR_PICKUP',
                  timestamp: new Date().toISOString(),
                  description: 'Dishes packed in eco-friendly tamper-proof bags, waiting for delivery pickup',
                  actor: currentUser?.name || 'Restaurant',
                },
              ],
            };
          }
          return o;
        })
      );
    },
    [currentUser]
  );

  const deliveryAcceptOrder = useCallback(
    (orderId: string): boolean => {
      if (!currentUser || currentUser.role !== 'DELIVERY') return false;

      const targetOrder = orders.find((o) => o.id === orderId);
      if (!targetOrder || targetOrder.deliveryPartnerId) {
        return false;
      }

      setOrders((prev) =>
        prev.map((o) => {
          if (o.id === orderId && !o.deliveryPartnerId) {
            return {
              ...o,
              orderStatus: 'DELIVERY_ASSIGNED',
              deliveryPartnerId: currentUser.id,
              deliveryPartnerName: currentUser.name,
              deliveryPartnerPhone: currentUser.phone || '+91 99887 76655',
              deliveryPartnerVehicle: currentUser.deliveryProfile?.vehicleNumber || 'EV Scooter',
              timeline: [
                ...o.timeline,
                {
                  status: 'DELIVERY_ASSIGNED',
                  timestamp: new Date().toISOString(),
                  description: `Delivery Partner ${currentUser.name} accepted delivery dispatch`,
                  actor: currentUser.name,
                },
              ],
            };
          }
          return o;
        })
      );

      addAuditLog('DELIVERY_ASSIGNED', `Partner ${currentUser.email} accepted order ${orderId}`, orderId);
      return true;
    },
    [currentUser, orders, addAuditLog]
  );

  const deliveryDeclineOrder = useCallback(
    (orderId: string) => {

      addAuditLog('DELIVERY_DECLINED', `Partner ${currentUser?.email} declined order ${orderId}. Remains available in pool.`, orderId);
    },
    [currentUser, addAuditLog]
  );

  const deliveryUpdateStatus = useCallback(
    (orderId: string, nextStatus: 'PICKED_UP' | 'OUT_FOR_DELIVERY' | 'DELIVERED') => {
      const descriptions: Record<string, string> = {
        PICKED_UP: 'Partner arrived at restaurant and picked up order package',
        OUT_FOR_DELIVERY: 'Partner is navigating route to customer address',
        DELIVERED: 'Package successfully delivered and handed to customer',
      };

      setOrders((prev) =>
        prev.map((o) => {
          if (o.id === orderId && o.deliveryPartnerId === currentUser?.id) {
            return {
              ...o,
              orderStatus: nextStatus,
              paymentStatus: nextStatus === 'DELIVERED' ? 'PAID' : o.paymentStatus,
              completedAt: nextStatus === 'DELIVERED' ? new Date().toISOString() : o.completedAt,
              timeline: [
                ...o.timeline,
                {
                  status: nextStatus,
                  timestamp: new Date().toISOString(),
                  description: descriptions[nextStatus],
                  actor: currentUser?.name || 'Delivery Partner',
                },
              ],
            };
          }
          return o;
        })
      );

      if (nextStatus === 'DELIVERED') {

        setUsers((prev) =>
          prev.map((u) => {
            if (u.id === currentUser?.id && u.deliveryProfile) {
              return {
                ...u,
                deliveryProfile: {
                  ...u.deliveryProfile,
                  totalDeliveries: u.deliveryProfile.totalDeliveries + 1,
                  earningsInr: u.deliveryProfile.earningsInr + 45,
                },
              };
            }
            return u;
          })
        );
      }

      addAuditLog(`DELIVERY_${nextStatus}`, `Order ${orderId} marked as ${nextStatus} by ${currentUser?.email}`, orderId);
    },
    [currentUser, addAuditLog]
  );

  const addMenuItem = useCallback(
    (item: Omit<MenuItem, 'id' | 'restaurantId'>) => {
      const restId = currentUser?.restaurantProfile?.restaurantId || 'rest-green-leaf';
      const newItem: MenuItem = {
        ...item,
        id: `item-${Date.now()}`,
        restaurantId: restId,
      };
      setMenuItems((prev) => [...prev, newItem]);
      addAuditLog('MENU_ITEM_ADDED', `New menu item created: ${newItem.name}`);
    },
    [currentUser, addAuditLog]
  );

  const updateMenuItem = useCallback(
    (id: string, updates: Partial<MenuItem>) => {
      setMenuItems((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
      );
      addAuditLog('MENU_ITEM_UPDATED', `Menu item updated: ${id}`);
    },
    [addAuditLog]
  );

  const deleteMenuItem = useCallback(
    (id: string) => {
      setMenuItems((prev) => prev.filter((m) => m.id !== id));
      addAuditLog('MENU_ITEM_DELETED', `Menu item removed: ${id}`);
    },
    [addAuditLog]
  );

  const createSurplusListing = useCallback(
    (listing: Omit<SurplusListing, 'id' | 'restaurantId' | 'currentPrice' | 'listedAt' | 'status'>) => {
      const restId = currentUser?.restaurantProfile?.restaurantId || 'rest-green-leaf';
      const nowIso = new Date().toISOString();
      const newSurplus: SurplusListing = {
        ...listing,
        id: `surplus-${Date.now()}`,
        restaurantId: restId,
        currentPrice: listing.originalPrice,
        listedAt: nowIso,
        status: 'AVAILABLE',
      };
      setSurplusListings((prev) => [newSurplus, ...prev]);
      saveSurplusToFirestore(newSurplus);
      addAuditLog('SURPLUS_LISTING_CREATED', `Surplus rescue deal published: ${newSurplus.name} (${newSurplus.quantityAvailable} units).`);
    },
    [currentUser, addAuditLog]
  );

  const updateSurplusListing = useCallback(
    (id: string, updates: Partial<SurplusListing>) => {
      setSurplusListings((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
      );
      addAuditLog('SURPLUS_LISTING_UPDATED', `Surplus deal updated: ${id}`);
    },
    [addAuditLog]
  );

  const approveApplication = useCallback(
    (appId: string) => {
      const app = applications.find((a) => a.id === appId);
      if (!app) return;

      const nowIso = new Date().toISOString();
      setApplications((prev) =>
        prev.map((a) =>
          a.id === appId
            ? { ...a, status: 'APPROVED', reviewedAt: nowIso, reviewedBy: currentUser?.name || 'Admin' }
            : a
        )
      );

      setUsers((prev) =>
        prev.map((u) => (u.id === app.userId ? { ...u, status: 'APPROVED' } : u))
      );

      addAuditLog('APPLICATION_APPROVED', `Admin approved ${app.role} registration for ${app.applicantName} (${app.email}).`, appId);
    },
    [applications, currentUser, addAuditLog]
  );

  const rejectApplication = useCallback(
    (appId: string, reason: string) => {
      const app = applications.find((a) => a.id === appId);
      if (!app) return;

      const nowIso = new Date().toISOString();
      setApplications((prev) =>
        prev.map((a) =>
          a.id === appId
            ? {
                ...a,
                status: 'REJECTED',
                rejectionReason: reason,
                reviewedAt: nowIso,
                reviewedBy: currentUser?.name || 'Admin',
              }
            : a
        )
      );

      setUsers((prev) =>
        prev.map((u) => (u.id === app.userId ? { ...u, status: 'REJECTED' } : u))
      );

      addAuditLog('APPLICATION_REJECTED', `Admin rejected ${app.role} application for ${app.applicantName}. Reason: ${reason}`, appId);
    },
    [applications, currentUser, addAuditLog]
  );

  const resetDemoData = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
    localStorage.removeItem(STORAGE_KEYS.MENU);
    localStorage.removeItem(STORAGE_KEYS.SURPLUS);
    localStorage.removeItem(STORAGE_KEYS.ORDERS);
    localStorage.removeItem(STORAGE_KEYS.APPS);
    localStorage.removeItem(STORAGE_KEYS.LOGS);
    localStorage.removeItem(STORAGE_KEYS.NOTIFS);
    localStorage.removeItem(STORAGE_KEYS.CART);

    setUsers(SEED_USERS);
    setCurrentUserId('user-customer-1');
    setMenuItems(SEED_MENU_ITEMS);
    setSurplusListings(SEED_SURPLUS_LISTINGS);
    setOrders(SEED_ORDERS);
    setApplications(SEED_ONBOARDING_APPLICATIONS);
    setAuditLogs(SEED_AUDIT_LOGS);
    setNotifications(SEED_NOTIFICATIONS);
    setCart([]);

    addAuditLog('DEMO_RESET', 'System state reset to canonical seed data by admin action.');
  }, [addAuditLog]);

  const advanceOrderSimulation = useCallback(
    (orderId: string): OrderStatus | null => {
      let nextStatus: OrderStatus | null = null;
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id !== orderId) return o;

          const transitions: Record<OrderStatus, { next: OrderStatus; desc: string; actor: string }> = {
            ORDER_PLACED: { next: 'RESTAURANT_ACCEPTED', desc: 'Kitchen accepted order and queued preparation', actor: 'Green Leaf Kitchen' },
            RESTAURANT_ACCEPTED: { next: 'PREPARING', desc: 'Chef is cooking meal fresh in kitchen', actor: 'Green Leaf Kitchen' },
            PREPARING: { next: 'READY_FOR_PICKUP', desc: 'Packed in eco-friendly tamper-proof bag, ready for pickup', actor: 'Green Leaf Kitchen' },
            READY_FOR_PICKUP: { next: 'DELIVERY_ASSIGNED', desc: 'Rider Rahul Verma accepted dispatch assignment', actor: 'Rahul Verma (EV Rider)' },
            DELIVERY_ASSIGNED: { next: 'PICKED_UP', desc: 'Rider picked up parcel from kitchen counter', actor: 'Rahul Verma (EV Rider)' },
            PICKED_UP: { next: 'OUT_FOR_DELIVERY', desc: 'Rider en route to customer location with live GPS tracking', actor: 'Rahul Verma (EV Rider)' },
            OUT_FOR_DELIVERY: { next: 'DELIVERED', desc: 'Order delivered and handed over to customer', actor: 'Rahul Verma (EV Rider)' },
            DELIVERED: { next: 'DELIVERED', desc: 'Delivered', actor: 'System' },
            REJECTED: { next: 'REJECTED', desc: 'Rejected', actor: 'System' },
            CANCELLED: { next: 'CANCELLED', desc: 'Cancelled', actor: 'System' },
          };

          const transition = transitions[o.orderStatus];
          if (!transition || transition.next === o.orderStatus) return o;

          nextStatus = transition.next;
          return {
            ...o,
            orderStatus: transition.next,
            deliveryPartnerId: transition.next === 'DELIVERY_ASSIGNED' || o.deliveryPartnerId ? (o.deliveryPartnerId || 'user-delivery-1') : undefined,
            deliveryPartnerName: transition.next === 'DELIVERY_ASSIGNED' || o.deliveryPartnerName ? (o.deliveryPartnerName || 'Rahul Verma') : undefined,
            deliveryPartnerVehicle: transition.next === 'DELIVERY_ASSIGNED' || o.deliveryPartnerVehicle ? (o.deliveryPartnerVehicle || 'KA-05-EQ-4421 (Ola S1 Pro)') : undefined,
            deliveryPartnerPhone: transition.next === 'DELIVERY_ASSIGNED' || o.deliveryPartnerPhone ? (o.deliveryPartnerPhone || '+91 99887 76655') : undefined,
            paymentStatus: transition.next === 'DELIVERED' ? 'PAID' : o.paymentStatus,
            completedAt: transition.next === 'DELIVERED' ? new Date().toISOString() : o.completedAt,
            timeline: [
              ...o.timeline,
              {
                status: transition.next,
                timestamp: new Date().toISOString(),
                description: transition.desc,
                actor: transition.actor,
              },
            ],
          };
        })
      );

      return nextStatus;
    },
    []
  );

  const addNotification = useCallback(
    (notif: {
      title: string;
      message: string;
      type?: 'ORDER' | 'APPROVAL' | 'SURPLUS' | 'FORECAST';
      role?: UserRole;
      actionLink?: string;
    }) => {
      const newNotif: NotificationItem = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        userId: currentUser?.id || 'user-default',
        title: notif.title,
        message: notif.message,
        type: notif.type || 'ORDER',
        read: false,
        createdAt: new Date().toISOString(),
        role: notif.role || currentUser?.role || 'CUSTOMER',
        actionLink: notif.actionLink,
      };
      setNotifications((prev) => [newNotif, ...prev]);
    },
    [currentUser]
  );

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const value = {
    currentUser,
    users,
    menuItems,
    surplusListings,
    orders,
    applications,
    auditLogs,
    notifications,
    cart,
    searchQuery,
    setSearchQuery,
    historyRecords,
    accuracyEvaluation,
    whatIfParams,
    setWhatIfParams,
    login,
    loginWithGoogle,
    loginWithFirebaseUser,
    quickLoginDemo,
    logout,
    registerCustomer,
    registerRestaurant,
    registerDelivery,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    cartTotal,
    cartOriginalTotal,
    cartSavings,
    placeOrder,
    addRestaurantOrder,
    restaurantAcceptOrder,
    restaurantRejectOrder,
    restaurantStartPrep,
    restaurantMarkReady,
    deliveryAcceptOrder,
    deliveryDeclineOrder,
    deliveryUpdateStatus,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    createSurplusListing,
    updateSurplusListing,
    approveApplication,
    rejectApplication,
    resetDemoData,
    advanceOrderSimulation,
    calculateLiveSurplusPrice,
    getSurplusPricingBreakdown,
    addNotification,
    markAllNotificationsAsRead,
    clearAllNotifications,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
