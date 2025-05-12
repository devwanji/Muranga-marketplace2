import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { SubscriptionPlan } from "@shared/schema";

interface SubscriptionPlanCardProps {
  plan: SubscriptionPlan;
  onSelect: () => void;
  isSelected: boolean;
}

export default function SubscriptionPlanCard({ plan, onSelect, isSelected }: SubscriptionPlanCardProps) {
  // Parse plan features from comma-separated string
  const features = plan.features.split(',').map(feature => feature.trim());
  
  return (
    <Card className={`relative transition-all ${isSelected ? 'border-primary shadow-md' : 'border-neutral-200'}`}>
      {isSelected && (
        <div className="absolute top-3 right-3">
          <CheckCircle className="h-6 w-6 text-primary" />
        </div>
      )}
      <CardHeader>
        <CardTitle className="text-xl">{plan.name}</CardTitle>
        <CardDescription>
          {plan.type === 'monthly' ? 'Monthly Plan' : 'Annual Plan'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <p className="text-3xl font-bold text-neutral-800">
            KES {plan.amount.toLocaleString()}{" "}
            <span className="text-sm font-normal text-neutral-500">
              /{plan.type === 'monthly' ? 'month' : 'year'}
            </span>
          </p>
          <p className="text-neutral-600 text-sm mt-1">{plan.description}</p>
        </div>
        
        <div className="space-y-2">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start">
              <CheckCircle className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-neutral-700">{feature}</p>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          variant={isSelected ? "default" : "outline"} 
          className="w-full"
          onClick={onSelect}
        >
          {isSelected ? "Selected" : "Select Plan"}
        </Button>
      </CardFooter>
    </Card>
  );
}