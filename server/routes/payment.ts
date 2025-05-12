import { Router } from 'express';
import { db } from '../db';
import { subscriptionPlans, mpesaPayments, businessSubscriptions } from '@shared/schema';
import { initiateSTKPush, handleSTKCallback, queryPaymentStatus } from '../services/mpesa';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { storage } from '../storage';

const router = Router();

// Get subscription plans
router.get('/subscription-plans', async (req, res) => {
  try {
    const plans = await db.query.subscriptionPlans.findMany();
    res.json(plans);
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    res.status(500).json({ error: 'Failed to fetch subscription plans' });
  }
});

// Get business subscription status
router.get('/subscription/:businessId', async (req, res) => {
  try {
    const businessId = parseInt(req.params.businessId);
    
    const subscription = await db.query.businessSubscriptions.findFirst({
      where: (fields, { eq }) => eq(fields.businessId, businessId),
      with: {
        plan: true,
      },
    });
    
    if (!subscription) {
      return res.status(404).json({ error: 'No active subscription found for this business' });
    }
    
    // Check if subscription is expired
    const now = new Date();
    const isActive = subscription.isActive && new Date(subscription.endDate) > now;
    
    res.json({
      ...subscription,
      isActive,
      isExpired: !isActive,
      daysRemaining: subscription.isActive ? 
        Math.ceil((new Date(subscription.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0,
    });
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    res.status(500).json({ error: 'Failed to fetch subscription status' });
  }
});

// Initiate payment
router.post('/pay', async (req, res) => {
  try {
    // Validate request data
    const schema = z.object({
      businessId: z.number(),
      planId: z.number(),
      phoneNumber: z.string().regex(/^(?:\+254|254|0)[17]\d{8}$/, 'Invalid phone number format'),
    });
    
    const { businessId, planId, phoneNumber } = schema.parse(req.body);
    
    // Check if business exists
    const business = await storage.getBusiness(businessId);
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }
    
    // Check if plan exists
    const plan = await db.query.subscriptionPlans.findFirst({
      where: (fields, { eq }) => eq(fields.id, planId),
    });
    
    if (!plan) {
      return res.status(404).json({ error: 'Subscription plan not found' });
    }
    
    // Generate callback URL (replace with your actual domain in production)
    const callbackUrl = `${req.protocol}://${req.get('host')}/api/payment/callback`;
    
    // Initiate STK push
    const result = await initiateSTKPush({
      businessId,
      planId,
      phoneNumber,
      callbackUrl,
      receiverPhoneNumber: "0714092658" // The business owner's phone number
    });
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error: any) {
    console.error('Error initiating payment:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid request data', details: error.errors });
    }
    
    res.status(500).json({ error: 'Failed to initiate payment' });
  }
});

// M-Pesa callback endpoint
router.post('/callback', async (req, res) => {
  try {
    // Handle callback data and update payment status
    const result = await handleSTKCallback(req.body);
    
    // Always respond with a success to the M-Pesa API
    // This ensures M-Pesa doesn't retry the callback
    res.status(200).json({ ResultCode: 0, ResultDesc: 'Success' });
  } catch (error) {
    console.error('Error processing M-Pesa callback:', error);
    
    // Still return success to M-Pesa
    res.status(200).json({ ResultCode: 0, ResultDesc: 'Success' });
  }
});

// Check payment status
router.get('/status/:checkoutRequestId', async (req, res) => {
  try {
    const { checkoutRequestId } = req.params;
    
    // Check database first
    const payment = await db.query.mpesaPayments.findFirst({
      where: (fields, { eq }) => eq(fields.checkoutRequestId, checkoutRequestId),
    });
    
    if (payment && payment.status !== 'pending') {
      return res.json({
        success: true,
        status: payment.status,
        completed: payment.status === 'completed',
        payment,
      });
    }
    
    // If pending or not found, query M-Pesa API
    const result = await queryPaymentStatus(checkoutRequestId);
    
    if (result.success) {
      res.json({
        success: true,
        status: result.data.ResultCode === '0' ? 'completed' : 'failed',
        apiResponse: result.data,
        payment,
      });
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error checking payment status:', error);
    res.status(500).json({ error: 'Failed to check payment status' });
  }
});

// Get payment history for a business
router.get('/history/:businessId', async (req, res) => {
  try {
    const businessId = parseInt(req.params.businessId);
    
    const payments = await db.query.mpesaPayments.findMany({
      where: (fields, { eq }) => eq(fields.businessId, businessId),
      orderBy: (fields, { desc }) => [desc(fields.createdAt)],
    });
    
    res.json(payments);
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
});

// Check if a user has any active subscriptions
router.get('/subscription/check', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  try {
    const userId = req.user!.id;
    
    // Get all businesses owned by this user
    const userBusinesses = await storage.getBusinessesByOwner(userId);
    
    if (!userBusinesses || userBusinesses.length === 0) {
      return res.json({ hasActiveSubscription: false });
    }
    
    // Check if any of the user's businesses have an active subscription
    // We'll query the subscriptions directly to avoid relation errors
    let hasActiveSubscription = false;
    const now = new Date();
    
    // Check each business for an active subscription
    for (const business of userBusinesses) {
      // Query the business subscription directly
      const [subscription] = await db
        .select()
        .from(businessSubscriptions)
        .where(eq(businessSubscriptions.businessId, business.id));
      
      if (subscription && subscription.isActive) {
        // Check if the subscription is still valid
        if (new Date(subscription.endDate) > now) {
          hasActiveSubscription = true;
          break;
        }
      }
    }
    
    res.json({ hasActiveSubscription });
  } catch (error) {
    console.error('Error checking user subscription:', error);
    res.status(500).json({ error: 'Failed to check subscription status' });
  }
});

export default router;