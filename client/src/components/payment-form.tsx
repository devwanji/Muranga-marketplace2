import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SubscriptionPlan } from "@shared/schema";

// Payment form schema
const paymentFormSchema = z.object({
  phoneNumber: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(13, "Phone number must not exceed 13 digits")
    .regex(/^(?:\+254|254|0)[17]\d{8}$/, "Invalid phone number format (e.g., 07XX XXX XXX)"),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

interface PaymentFormProps {
  businessId: number;
  selectedPlan: SubscriptionPlan;
  onPaymentComplete: () => void;
}

export default function PaymentForm({ businessId, selectedPlan, onPaymentComplete }: PaymentFormProps) {
  const { toast } = useToast();
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "initiated" | "checking" | "completed" | "failed">("idle");
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null);
  
  // Form setup
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      phoneNumber: "",
    },
  });

  // Initialize payment mutation
  const paymentMutation = useMutation({
    mutationFn: async (values: PaymentFormValues) => {
      const response = await apiRequest(
        "POST",
        "/api/payment/pay", 
        {
          businessId,
          planId: selectedPlan.id,
          phoneNumber: values.phoneNumber,
        }
      );
      return await response.json();
    },
    onSuccess: (data: any) => {
      if (data.success) {
        setPaymentStatus("initiated");
        setCheckoutRequestId(data.checkoutRequestId);
        toast({
          title: "Payment initiated",
          description: "Please check your phone and enter your M-Pesa PIN to complete the payment.",
        });
        
        // Start checking payment status
        startCheckingPaymentStatus(data.checkoutRequestId);
      } else {
        setPaymentStatus("failed");
        toast({
          variant: "destructive",
          title: "Payment failed",
          description: data.error || "Failed to initiate payment. Please try again.",
        });
      }
    },
    onError: (error: Error) => {
      setPaymentStatus("failed");
      toast({
        variant: "destructive",
        title: "Payment error",
        description: error.message || "An error occurred while processing your payment.",
      });
    },
  });

  // Check payment status
  const checkPaymentStatus = async (checkoutRequestId: string) => {
    try {
      setPaymentStatus("checking");
      const response = await fetch(`/api/payment/status/${checkoutRequestId}`);
      const data = await response.json();
      
      if (data.success) {
        if (data.status === "completed") {
          setPaymentStatus("completed");
          toast({
            title: "Payment successful",
            description: "Your subscription has been activated.",
          });
          // Notify parent component that payment is complete
          onPaymentComplete();
          return true;
        } else if (data.status === "failed") {
          setPaymentStatus("failed");
          toast({
            variant: "destructive",
            title: "Payment failed",
            description: "The payment was not completed. Please try again.",
          });
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error("Error checking payment status:", error);
      return false;
    }
  };

  // Start polling for payment status
  const startCheckingPaymentStatus = (checkoutRequestId: string) => {
    const pollInterval = 5000; // 5 seconds
    const maxAttempts = 12; // 1 minute total (12 * 5s)
    let attempts = 0;
    
    const pollPaymentStatus = async () => {
      attempts++;
      const isCompleted = await checkPaymentStatus(checkoutRequestId);
      
      if (!isCompleted && attempts < maxAttempts) {
        setTimeout(pollPaymentStatus, pollInterval);
      } else if (!isCompleted) {
        // Max attempts reached
        setPaymentStatus("idle");
        toast({
          variant: "destructive",
          title: "Payment timeout",
          description: "We couldn't confirm your payment. If you completed the payment, please contact support.",
        });
      }
    };
    
    // Start polling
    setTimeout(pollPaymentStatus, pollInterval);
  };

  // Submit handler
  const onSubmit = (values: PaymentFormValues) => {
    paymentMutation.mutate(values);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium">Pay with M-Pesa</h3>
        <p className="text-neutral-600 text-sm mt-1">
          An STK push will be sent to your phone. Enter your M-Pesa PIN to complete payment.
        </p>
      </div>
      
      {paymentStatus === "idle" && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter your M-Pesa number e.g. 07XX XXX XXX" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={paymentMutation.isPending}
            >
              {paymentMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Initiating Payment...
                </>
              ) : (
                `Pay KES ${selectedPlan.amount.toLocaleString()}`
              )}
            </Button>
          </form>
        </Form>
      )}
      
      {paymentStatus === "initiated" && (
        <Alert className="bg-amber-50 border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Payment Initiated</AlertTitle>
          <AlertDescription className="text-amber-700">
            Please check your phone and enter your M-Pesa PIN to complete the payment. 
            This page will automatically update once the payment is completed.
          </AlertDescription>
        </Alert>
      )}
      
      {paymentStatus === "checking" && (
        <div className="text-center p-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p>Verifying payment status...</p>
        </div>
      )}
      
      {paymentStatus === "completed" && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Payment Successful</AlertTitle>
          <AlertDescription className="text-green-700">
            Your payment has been successfully processed. You can now proceed with business registration.
          </AlertDescription>
        </Alert>
      )}
      
      {paymentStatus === "failed" && (
        <Alert className="bg-red-50 border-red-200">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Payment Failed</AlertTitle>
          <AlertDescription className="text-red-700">
            Your payment could not be processed. Please try again or use a different phone number.
          </AlertDescription>
          <Button 
            variant="outline" 
            className="mt-2 w-full"
            onClick={() => setPaymentStatus("idle")}
          >
            Try Again
          </Button>
        </Alert>
      )}
    </div>
  );
}