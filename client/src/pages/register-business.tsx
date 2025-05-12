import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Business, Category, Location, BusinessSubscription } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import BusinessForm from "@/components/business-form";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ArrowRight } from "lucide-react";

export default function RegisterBusiness() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [hasSubscription, setHasSubscription] = useState<boolean>(false);
  
  // Get the business ID from URL query params (if coming from subscription flow)
  const params = new URLSearchParams(window.location.search);
  const businessId = params.get('businessId') ? parseInt(params.get('businessId')!) : null;
  
  // Fetch categories
  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });
  
  // Fetch locations
  const { data: locations } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  });
  
  // Check if the user has an active subscription or a temporary business ID
  useEffect(() => {
    if (!user) return;
    
    // If we have a businessId from the query params, we can assume the payment was successful
    if (businessId) {
      setHasSubscription(true);
      return;
    }
    
    // Otherwise, check for active subscriptions
    async function checkSubscription() {
      try {
        const response = await fetch(`/api/payment/subscription/check`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setHasSubscription(data.hasActiveSubscription);
        }
      } catch (error) {
        console.error("Error checking subscription:", error);
      }
    }
    
    checkSubscription();
  }, [user, businessId]);
  
  // Redirect to subscription page
  const handleGoToSubscribe = () => {
    navigate('/subscribe');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-neutral-800 mb-2">Register Your Business</h1>
        <p className="text-neutral-600 mb-8">
          Provide details about your business to connect with customers across Murang'a County
        </p>
        
        {!hasSubscription ? (
          <div className="mb-8">
            <Alert className="mb-6 border-amber-500 bg-amber-50">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <AlertTitle>Subscription Required</AlertTitle>
              <AlertDescription>
                You need to subscribe to a plan before registering your business on Murang'a Marketplace.
                Choose between our affordable monthly or annual plans.
              </AlertDescription>
            </Alert>
            
            <Button 
              onClick={handleGoToSubscribe}
              className="w-full md:w-auto"
            >
              Subscribe Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        ) : (
          <BusinessForm 
            categories={categories || []}
            locations={locations || []}
            user={user}
          />
        )}
      </div>
    </div>
  );
}
