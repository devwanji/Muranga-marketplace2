import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { SubscriptionPlan } from "@shared/schema";
import SubscriptionPlanCard from "@/components/subscription-plan-card";
import PaymentForm from "@/components/payment-form";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, ArrowLeft, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SubscribePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [step, setStep] = useState<"select-plan" | "make-payment">("select-plan");
  const [planType, setPlanType] = useState<"monthly" | "yearly">("monthly");
  const [businessId, setBusinessId] = useState<number | null>(null);

  // Fetch subscription plans
  const { data: plans, isLoading: isLoadingPlans } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/payment/subscription-plans"],
  });

  // Filter plans by type
  const filteredPlans = plans?.filter(plan => plan.type === planType) || [];

  // Get selected plan
  const selectedPlan = plans?.find(plan => plan.id === selectedPlanId);

  // Select a plan
  const handleSelectPlan = (planId: number) => {
    setSelectedPlanId(planId);
  };

  // Proceed to payment
  const handleProceedToPayment = async () => {
    if (!selectedPlan) {
      toast({
        variant: "destructive",
        title: "No plan selected",
        description: "Please select a subscription plan to continue.",
      });
      return;
    }

    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please log in to subscribe to a plan.",
      });
      navigate("/auth");
      return;
    }

    try {
      // Create a temporary business record for the payment
      const response = await fetch("/api/businesses/temp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ownerId: user.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create temporary business record");
      }

      const data = await response.json();
      setBusinessId(data.id);
      setStep("make-payment");
    } catch (error) {
      console.error("Error creating temporary business:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to proceed to payment. Please try again.",
      });
    }
  };

  // Handle successful payment
  const handlePaymentComplete = () => {
    // Navigate to the business registration form
    navigate(`/register-business?businessId=${businessId}`);
  };

  // Go back to plan selection
  const handleBackToPlans = () => {
    setStep("select-plan");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-neutral-800 mb-2">
          Subscribe to Murang'a Marketplace
        </h1>
        <p className="text-neutral-600 mb-8">
          Choose a subscription plan to register your business on Murang'a Marketplace
        </p>

        {step === "select-plan" && (
          <>
            <Tabs defaultValue="monthly" className="mb-6">
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
                <TabsTrigger value="monthly" onClick={() => setPlanType("monthly")}>
                  Monthly Plan
                </TabsTrigger>
                <TabsTrigger value="yearly" onClick={() => setPlanType("yearly")}>
                  Yearly Plan
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {isLoadingPlans ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading subscription plans...</span>
              </div>
            ) : filteredPlans.length === 0 ? (
              <Card className="p-6 text-center">
                <p>No subscription plans available. Please try again later.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {filteredPlans.map((plan) => (
                  <SubscriptionPlanCard
                    key={plan.id}
                    plan={plan}
                    onSelect={() => handleSelectPlan(plan.id)}
                    isSelected={selectedPlanId === plan.id}
                  />
                ))}
              </div>
            )}

            <div className="flex justify-end">
              <Button
                onClick={handleProceedToPayment}
                disabled={!selectedPlanId || isLoadingPlans}
                className="px-6"
              >
                Proceed to Payment
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </>
        )}

        {step === "make-payment" && selectedPlan && businessId && (
          <div className="max-w-md mx-auto">
            <Card className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Payment Details</h2>
                <p className="text-neutral-600 text-sm">
                  You're subscribing to the {selectedPlan.name} plan.
                </p>
                <div className="mt-3 p-3 bg-neutral-50 rounded-md">
                  <div className="flex justify-between">
                    <span>Subscription:</span>
                    <span className="font-medium">{selectedPlan.name}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span>Amount:</span>
                    <span className="font-medium">KES {selectedPlan.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span>Duration:</span>
                    <span className="font-medium">
                      {selectedPlan.type === "monthly" ? "1 Month" : "1 Year"}
                    </span>
                  </div>
                </div>
              </div>

              <PaymentForm
                businessId={businessId}
                selectedPlan={selectedPlan}
                onPaymentComplete={handlePaymentComplete}
              />

              <Button
                variant="ghost"
                className="mt-4"
                onClick={handleBackToPlans}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Plans
              </Button>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}