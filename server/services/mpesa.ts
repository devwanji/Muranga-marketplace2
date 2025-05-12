import axios from 'axios';
import { db } from '../db';
import { mpesaPayments, businessSubscriptions, subscriptionPlans } from '@shared/schema';
import { add } from 'date-fns';

// M-Pesa Daraja API credentials
const consumer_key = process.env.MPESA_CONSUMER_KEY;
const consumer_secret = process.env.MPESA_CONSUMER_SECRET;
const shortcode = process.env.MPESA_SHORTCODE;
const passkey = process.env.MPESA_PASSKEY;

// Base URLs
const baseURL = 'https://sandbox.safaricom.co.ke'; // Use sandbox for development
// const baseURL = 'https://api.safaricom.co.ke'; // Use this for production

// Validate required environment variables
function validateEnvironment() {
  const requiredVars = [
    { name: 'MPESA_CONSUMER_KEY', value: consumer_key },
    { name: 'MPESA_CONSUMER_SECRET', value: consumer_secret },
    { name: 'MPESA_SHORTCODE', value: shortcode },
    { name: 'MPESA_PASSKEY', value: passkey },
  ];

  const missingVars = requiredVars
    .filter(({ value }) => !value)
    .map(({ name }) => name);

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
}

// Get OAuth token
async function getAccessToken() {
  try {
    validateEnvironment();
    
    const auth = Buffer.from(`${consumer_key}:${consumer_secret}`).toString('base64');
    const response = await axios.get(
      `${baseURL}/oauth/v1/generate?grant_type=client_credentials`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );
    
    return response.data.access_token;
  } catch (error) {
    console.error('Error getting M-Pesa access token:', error);
    throw error;
  }
}

// Initiate STK Push (Lipa Na M-Pesa Online)
export async function initiateSTKPush(params: {
  businessId: number;
  planId: number;
  phoneNumber: string;
  callbackUrl: string;
  receiverPhoneNumber?: string;
}) {
  try {
    const { businessId, planId, phoneNumber, callbackUrl, receiverPhoneNumber } = params;
    
    // Get the plan details
    const plan = await db.query.subscriptionPlans.findFirst({
      where: (fields, { eq }) => eq(fields.id, planId)
    });
    
    if (!plan) {
      throw new Error(`Subscription plan with ID ${planId} not found`);
    }
    
    // Format customer's phone number (ensure it starts with 254)
    let formattedPhone = phoneNumber;
    if (phoneNumber.startsWith('0')) {
      formattedPhone = `254${phoneNumber.substring(1)}`;
    } else if (phoneNumber.startsWith('+254')) {
      formattedPhone = phoneNumber.substring(1);
    }
    
    // Format receiver's phone number (the business owner's number)
    let formattedReceiverPhone = "";
    if (receiverPhoneNumber) {
      if (receiverPhoneNumber.startsWith('0')) {
        formattedReceiverPhone = `254${receiverPhoneNumber.substring(1)}`;
      } else if (receiverPhoneNumber.startsWith('+254')) {
        formattedReceiverPhone = receiverPhoneNumber.substring(1);
      } else {
        formattedReceiverPhone = receiverPhoneNumber;
      }
    }
    
    // Generate timestamp
    const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '').substring(0, 14);
    
    // Generate password
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
    
    // Get access token
    const accessToken = await getAccessToken();
    
    // Prepare STK push request
    const requestData = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: plan.amount,
      PartyA: formattedPhone, // Customer paying
      PartyB: shortcode,
      PhoneNumber: formattedPhone, // Customer's phone for STK push
      CallBackURL: callbackUrl,
      AccountReference: `Murang'a Marketplace - ${formattedReceiverPhone || "0714092658"}`, // Your phone number as the receiver
      TransactionDesc: `Payment for ${plan.name} - To: 0714092658`,
    };
    
    // Send STK push request
    const response = await axios.post(
      `${baseURL}/mpesa/stkpush/v1/processrequest`,
      requestData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (response.data.ResponseCode === '0') {
      // Save payment request to database
      const payment = await db.insert(mpesaPayments).values({
        businessId,
        phoneNumber: formattedPhone,
        amount: plan.amount,
        checkoutRequestId: response.data.CheckoutRequestID,
        merchantRequestId: response.data.MerchantRequestID,
      }).returning();
      
      return {
        success: true,
        checkoutRequestId: response.data.CheckoutRequestID,
        merchantRequestId: response.data.MerchantRequestID,
        paymentId: payment[0].id,
      };
    } else {
      throw new Error(`STK push failed with response code: ${response.data.ResponseCode}`);
    }
  } catch (error: any) {
    console.error('Error initiating STK push:', error);
    return {
      success: false,
      error: error.message || 'Failed to initiate payment',
    };
  }
}

// Handle M-Pesa callback
export async function handleSTKCallback(callbackData: any) {
  try {
    const resultCode = callbackData.Body.stkCallback.ResultCode;
    const merchantRequestId = callbackData.Body.stkCallback.MerchantRequestID;
    const checkoutRequestId = callbackData.Body.stkCallback.CheckoutRequestID;
    
    // Find the payment record
    const [payment] = await db
      .select()
      .from(mpesaPayments)
      .where((eb: any) => eb.eq(mpesaPayments.checkoutRequestId, checkoutRequestId));
    
    if (!payment) {
      throw new Error(`Payment record with CheckoutRequestID ${checkoutRequestId} not found`);
    }
    
    // Update payment status
    if (resultCode === 0) {
      // Payment successful
      const callbackMetadata = callbackData.Body.stkCallback.CallbackMetadata.Item;
      
      // Extract relevant data from callback
      const mpesaReceiptNumber = callbackMetadata.find((item: any) => item.Name === 'MpesaReceiptNumber')?.Value;
      const transactionDate = callbackMetadata.find((item: any) => item.Name === 'TransactionDate')?.Value;
      const phoneNumber = callbackMetadata.find((item: any) => item.Name === 'PhoneNumber')?.Value;
      
      // Update payment record
      await db
        .update(mpesaPayments)
        .set({
          resultCode,
          resultDesc: callbackData.Body.stkCallback.ResultDesc,
          mpesaReceiptNumber,
          status: 'completed',
          updatedAt: new Date(),
        })
        .where((eb: any) => eb.eq(mpesaPayments.id, payment.id));
      
      // Get subscription plan
      const plan = await db.query.subscriptionPlans.findFirst({
        where: (fields, { eq }) => eq(fields.id, payment.planId)
      });
      
      if (!plan) {
        throw new Error(`Subscription plan not found`);
      }
      
      // Calculate subscription end date based on plan type
      let endDate = new Date();
      if (plan.type === 'monthly') {
        endDate = add(new Date(), { months: 1 });
      } else if (plan.type === 'yearly') {
        endDate = add(new Date(), { years: 1 });
      }
      
      // Create or update business subscription
      const [existingSubscription] = await db
        .select()
        .from(businessSubscriptions)
        .where((eb: any) => eb.eq(businessSubscriptions.businessId, payment.businessId));
      
      if (existingSubscription) {
        // Update existing subscription
        await db
          .update(businessSubscriptions)
          .set({
            planId: plan.id,
            startDate: new Date(),
            endDate,
            isActive: true,
          })
          .where((eb: any) => eb.eq(businessSubscriptions.id, existingSubscription.id));
      } else {
        // Create new subscription
        await db.insert(businessSubscriptions).values({
          businessId: payment.businessId,
          planId: plan.id,
          endDate,
        });
      }
      
      // Update payment record with subscription ID
      if (existingSubscription) {
        await db
          .update(mpesaPayments)
          .set({
            subscriptionId: existingSubscription.id,
          })
          .where((eb: any) => eb.eq(mpesaPayments.id, payment.id));
      }
      
      return {
        success: true,
        message: 'Payment successful',
        data: {
          mpesaReceiptNumber,
          transactionDate,
          phoneNumber,
        },
      };
    } else {
      // Payment failed
      await db
        .update(mpesaPayments)
        .set({
          resultCode,
          resultDesc: callbackData.Body.stkCallback.ResultDesc,
          status: 'failed',
          updatedAt: new Date(),
        })
        .where((eb: any) => eb.eq(mpesaPayments.id, payment.id));
      
      return {
        success: false,
        message: 'Payment failed',
        error: callbackData.Body.stkCallback.ResultDesc,
      };
    }
  } catch (error: any) {
    console.error('Error handling STK callback:', error);
    return {
      success: false,
      error: error.message || 'Failed to process payment callback',
    };
  }
}

// Query payment status
export async function queryPaymentStatus(checkoutRequestId: string) {
  try {
    // Get access token
    const accessToken = await getAccessToken();
    
    // Generate timestamp
    const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '').substring(0, 14);
    
    // Generate password
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
    
    // Prepare query request
    const requestData = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    };
    
    // Send query request
    const response = await axios.post(
      `${baseURL}/mpesa/stkpushquery/v1/query`,
      requestData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error('Error querying payment status:', error);
    return {
      success: false,
      error: error.message || 'Failed to query payment status',
    };
  }
}