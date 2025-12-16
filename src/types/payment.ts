/**
 * Payment System Type Definitions
 * Ensures type safety across payment components and API routes
 */

// ============================================================================
// SUBSCRIPTION TYPES
// ============================================================================

export type PlanType = 'free' | 'master' | 'warrior';

export type SubscriptionStatus = 
  | 'active' 
  | 'canceled' 
  | 'past_due' 
  | 'incomplete' 
  | 'trialing';

export interface Subscription {
  id: number;
  user_id: string;
  plan_type: PlanType;
  status: SubscriptionStatus;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  razorpay_customer_id?: string;
  razorpay_subscription_id?: string;
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end: boolean;
  amount?: number;
  currency: string;
  razorpay_payment_id?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// USAGE LIMITS TYPES
// ============================================================================

export interface UsageLimits {
  user_id: string;
  plan_type: PlanType;
  breakdowns_used: number;
  breakdowns_limit: number;
  flashcards_used: number;
  flashcards_limit: number;
  subjects_limit: number;
  reset_date: string;
  yearly_payment_id?: string;
  yearly_expires_at?: string;
  yearly_activated_at?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// PAYMENT LOG TYPES
// ============================================================================

export type PaymentStatus = 
  | 'pending' 
  | 'completed' 
  | 'failed' 
  | 'refunded' 
  | 'canceled';

export interface PaymentLog {
  id: string;
  user_id?: string;
  payment_id: string;
  order_id?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  plan_type?: PlanType;
  error_description?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// WEBHOOK TYPES
// ============================================================================

export interface WebhookLog {
  id: number;
  event_id: string;
  event_type: string;
  payload: Record<string, any>;
  signature: string;
  created_at: string;
}

// ============================================================================
// RAZORPAY API TYPES
// ============================================================================

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt?: string;
  status: string;
  created_at: number;
}

export interface RazorpayPayment {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  created_at: number;
}

export interface RazorpaySubscription {
  id: string;
  plan_id: string;
  customer_id?: string;
  status: string;
  current_start?: number;
  current_end?: number;
  ended_at?: number;
  quantity: number;
  notes?: Record<string, string>;
  short_url?: string;
  created_at: number;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface CreateSubscriptionRequest {
  planId: string;
  userId: string;
  userEmail: string;
  userName?: string;
}

export interface CreateSubscriptionResponse {
  success: boolean;
  subscriptionId?: string;
  customerId?: string;
  shortUrl?: string;
  status?: string;
  keyId?: string;
  error?: string;
  details?: any;
}

export interface CreateYearlyPaymentRequest {
  amount: number;
  planName: string;
  userId: string;
  userEmail: string;
  userName?: string;
}

export interface CreateYearlyPaymentResponse {
  success: boolean;
  orderId?: string;
  amount?: number;
  currency?: string;
  keyId?: string;
  error?: string;
}

export interface VerifyPaymentRequest {
  orderId: string;
  paymentId: string;
  signature: string;
  planName: string;
  userId: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  message?: string;
  expiresAt?: string;
  error?: string;
}

export interface UpdateSubscriptionRequest {
  subscriptionId: string;
  paymentId: string;
  signature: string;
  planName: string;
  userId: string;
}

export interface UpdateSubscriptionResponse {
  success: boolean;
  message?: string;
  error?: string;
}

// ============================================================================
// PLAN CONFIGURATION TYPES
// ============================================================================

export interface PlanFeatures {
  breakdowns: number;
  flashcards: number;
  subjects: number;
  aiInsights: boolean;
  prioritySupport: boolean;
  customization: boolean;
}

export interface PlanConfig {
  name: string;
  type: PlanType;
  price: number;
  annualPrice?: number;
  description: string;
  features: string[];
  limits: PlanFeatures;
  razorpayPlanId?: string;
  stripePriceId?: string;
  popular: boolean;
  cta: string;
}

// ============================================================================
// PRICING COMPONENT TYPES
// ============================================================================

export interface PricingCardProps {
  plan: PlanConfig;
  billingInterval: 'monthly' | 'annual';
  loading: string | null;
  onSubscribe: (productId: string, planName: string) => void;
  user: any;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface PaymentError {
  code: string;
  message: string;
  details?: any;
}

export interface PaymentSuccess {
  paymentId: string;
  orderId?: string;
  subscriptionId?: string;
  amount: number;
  currency: string;
  planType: PlanType;
}

// ============================================================================
// ADMIN TYPES
// ============================================================================

export interface UsageStats {
  totalUsers: number;
  freeUsers: number;
  masterUsers: number;
  warriorUsers: number;
  totalAIUsageToday: number;
  totalSubjects: number;
  averageSubjectsPerUser: number;
  conversionRate: number;
}

export interface RevenueStats {
  monthlyRecurring: number;
  yearlyRevenue: number;
  totalRevenue: number;
  averageRevenuePerUser: number;
}