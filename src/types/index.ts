export type UserRole = 'CUSTOMER' | 'RESTAURANT' | 'DELIVERY' | 'ADMIN';
export type AccountStatus = 'APPROVED' | 'PENDING_APPROVAL' | 'REJECTED';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: AccountStatus;
  phone?: string;
  avatarUrl?: string;
  createdAt: string;
  restaurantProfile?: RestaurantProfile;
  deliveryProfile?: DeliveryProfile;
  customerProfile?: CustomerProfile;
}

export interface CustomerProfile {
  defaultAddress: string;
  savedAddresses: string[];
  totalRescuedMeals: number;
  totalSavedAmount: number;
}

export interface RestaurantProfile {
  restaurantId: string;
  name: string;
  ownerName: string;
  cuisine: string;
  address: string;
  openingHours: string;
  closingTimeStr: string;
  operatingDays: string[];
  phone: string;
  rating: number;
  totalReviews: number;
  fssaiLicense?: string;
  seatingCapacity?: number;
  kitchenCapability: string;
  coverImage?: string;
  description: string;
}

export interface DeliveryProfile {
  vehicleType: 'EV_SCOOTER' | 'MOTORBIKE' | 'BICYCLE' | 'VAN';
  vehicleNumber: string;
  serviceArea: string;
  isOnline: boolean;
  totalDeliveries: number;
  rating: number;
  earningsInr: number;
  drivingLicenseNo?: string;
}

export interface OnboardingApplication {
  id: string;
  userId: string;
  applicantName: string;
  email: string;
  phone: string;
  role: 'RESTAURANT' | 'DELIVERY';
  submittedAt: string;
  status: AccountStatus;
  rejectionReason?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  details: Record<string, string | number | boolean>;
}

export type MenuCategory = 'Rolls & Wraps' | 'Bowls & Thalis' | 'Chaat & Cafe Bites' | 'Brews & Desserts';

export interface MenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  category: MenuCategory;
  price: number;
  isVeg: boolean;
  prepTimeMinutes: number;
  inStock: boolean;
  currentStock: number;
  expectedDailyPrep: number;
  imageUrl?: string;
  allergens?: string[];
  calories?: number;
}

export interface SurplusListing {
  id: string;
  menuItemId: string;
  restaurantId: string;
  name: string;
  category: MenuCategory;
  originalPrice: number;
  minPrice: number;
  currentPrice: number;
  quantityAvailable: number;
  initialQuantity: number;
  isVeg: boolean;
  listedAt: string;
  closingTime: string;
  status: 'AVAILABLE' | 'RESERVED' | 'SOLD_OUT' | 'EXPIRED';
  prepTimeInfo: string;
  imageUrl?: string;
}

export type OrderStatus =
  | 'ORDER_PLACED'
  | 'RESTAURANT_ACCEPTED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'DELIVERY_ASSIGNED'
  | 'PICKED_UP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'REJECTED'
  | 'CANCELLED';

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  isSurplus?: boolean;
  surplusListingId?: string;
}

export interface OrderTimelineEvent {
  status: OrderStatus;
  timestamp: string;
  description: string;
  actor?: string;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  restaurantId: string;
  restaurantName: string;
  items: OrderItem[];
  itemTotal: number;
  discountTotal: number;
  deliveryFee: number;
  finalAmount: number;
  paymentMethod: 'UPI' | 'CARD' | 'COD';
  paymentStatus: 'PAID' | 'PENDING' | 'FAILED';
  paymentId?: string;
  orderStatus: OrderStatus;
  deliveryPartnerId?: string;
  deliveryPartnerName?: string;
  deliveryPartnerPhone?: string;
  deliveryPartnerVehicle?: string;
  estimatedDeliveryMinutes: number;
  deliveryDistanceKm: number;
  rejectionReason?: string;
  declinedByDeliveryPartnerIds?: string[];
  timeline: OrderTimelineEvent[];
  createdAt: string;
  completedAt?: string;
  notes?: string;
  hasSurplusItems: boolean;
  savedAmount: number;
}

export interface HistoricalDailyRecord {
  id: string;
  date: string;
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  month: number;
  year: number;
  season: 'Winter' | 'Spring' | 'Summer' | 'Monsoon' | 'Autumn';
  festivalName?: string;
  isWeekend: boolean;
  mealPeriod: 'BREAKFAST' | 'LUNCH' | 'EVENING' | 'DINNER';
  menuItemId: string;
  itemName: string;
  category: MenuCategory;
  preparedQty: number;
  soldQty: number;
  unsoldQty: number;
  surplusRescuedQty: number;
  unitPrice: number;
  revenue: number;
  stockoutOccurred: boolean;
  promotionActive: boolean;
}

export interface ForecastPrediction {
  menuItemId: string;
  itemName: string;
  category: MenuCategory;
  mealPeriod: 'BREAKFAST' | 'LUNCH' | 'EVENING' | 'DINNER';
  targetDate: string;
  expectedDemand: number;
  suggestedPrepQty: number;
  safetyBufferQty: number;
  currentPreparedStock: number;
  surplusRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  confidenceScore: number;
  expectedRevenueInr: number;
  expectedWasteUnits: number;
  keyDrivers: string[];
  baselineAvgDemand: number;
  weekdayDeltaPercent: number;
  festivalDeltaPercent: number;
  recentTrendDeltaPercent: number;
}

export interface ModelAccuracyEvaluation {
  modelName: string;
  holdoutPeriod: string;
  totalRecordsEvaluated: number;
  meanAbsoluteError: number;
  weightedAbsolutePercentageError: number;
  accuracyPercent: number;
  baselineMae: number;
  errorReductionVsBaseline: number;
}

export interface WhatIfScenarioParameters {
  demandMultiplier: number;
  safetyBufferPercent: number;
  priceAdjustmentPercent: number;
  productionCostUnit: number;
  wastePenaltyCostUnit: number;
  missedSalePenaltyUnit: number;
  festivalImpactFactor: number;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorEmail: string;
  actorRole: UserRole;
  action: string;
  targetId?: string;
  details: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'ORDER' | 'APPROVAL' | 'SURPLUS' | 'FORECAST';
  read: boolean;
  createdAt: string;
  actionLink?: string;
  role?: UserRole;
}
