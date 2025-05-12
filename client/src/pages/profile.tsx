import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Business, Review } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Building2, Star, Calendar, Phone, Mail, ShoppingBag, Store } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function ProfilePage() {
  const { user } = useAuth();
  const [servicesRendered, setServicesRendered] = useState(0);
  const [servicesRequested, setServicesRequested] = useState(0);

  // Fetch user's businesses
  const { data: userBusinesses, isLoading: isLoadingBusinesses } = useQuery<Business[]>({
    queryKey: ["/api/businesses/user"],
    enabled: !!user,
  });

  // Fetch user's reviews
  const { data: userReviews, isLoading: isLoadingReviews } = useQuery<Review[]>({
    queryKey: ["/api/reviews/user"],
    enabled: !!user,
  });

  // Calculate metrics
  useEffect(() => {
    if (user) {
      // Count businesses for services rendered
      if (userBusinesses) {
        setServicesRendered(userBusinesses.length);
      }

      // Count reviews for services requested/used
      if (userReviews) {
        setServicesRequested(userReviews.length);
      }
    }
  }, [user, userBusinesses, userReviews]);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Please log in to view your profile</h1>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-bold text-neutral-800 mb-6">My Profile</h1>
      
      {isLoadingBusinesses || isLoadingReviews ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading profile data...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* User Profile Card */}
          <Card className="md:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Your account details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col">
                <div className="h-24 w-24 rounded-full bg-primary text-white flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl font-bold">{user.username.charAt(0).toUpperCase()}</span>
                </div>
                
                <h3 className="text-lg font-semibold text-center mb-4">{user.username}</h3>
                
                <div className="space-y-3 mt-2">
                  <div className="flex items-start">
                    <Mail className="h-5 w-5 mr-2 text-neutral-500" />
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm text-neutral-600">{user.email || 'Not provided'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Phone className="h-5 w-5 mr-2 text-neutral-500" />
                    <div>
                      <p className="text-sm font-medium">Phone</p>
                      <p className="text-sm text-neutral-600">{user.phone || 'Not provided'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Calendar className="h-5 w-5 mr-2 text-neutral-500" />
                    <div>
                      <p className="text-sm font-medium">Member Since</p>
                      <p className="text-sm text-neutral-600">
                        {user.createdAt 
                          ? `${formatDistanceToNow(new Date(user.createdAt))} ago` 
                          : 'Unknown'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <Badge variant="outline" className="flex items-center justify-center w-full py-1.5">
                    <span className="capitalize">{user.role} Account</span>
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Activity Summary */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Activity Summary</CardTitle>
              <CardDescription>Your marketplace interactions</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="as-customer">As Customer</TabsTrigger>
                  <TabsTrigger value="as-business">As Business</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Services Used</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center">
                          <ShoppingBag className="h-10 w-10 text-primary p-1.5 bg-primary/10 rounded-full mr-3" />
                          <div>
                            <p className="text-3xl font-bold">{servicesRequested}</p>
                            <p className="text-sm text-neutral-500">businesses you've engaged</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Services Offered</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center">
                          <Store className="h-10 w-10 text-primary p-1.5 bg-primary/10 rounded-full mr-3" />
                          <div>
                            <p className="text-3xl font-bold">{servicesRendered}</p>
                            <p className="text-sm text-neutral-500">businesses you've registered</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                <TabsContent value="as-customer" className="space-y-4 pt-4">
                  <h3 className="text-lg font-medium mb-3">Recent Services Used</h3>
                  {userReviews && userReviews.length > 0 ? (
                    <div className="space-y-3">
                      {userReviews.slice(0, 4).map(review => (
                        <Card key={review.id} className="overflow-hidden">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium">Business #{review.businessId}</h4>
                                <p className="text-sm text-neutral-500 mt-1 max-w-md">{review.comment || 'No comment'}</p>
                              </div>
                              <div className="flex items-center">
                                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                                <span className="ml-1 font-medium">{review.rating}</span>
                              </div>
                            </div>
                            <div className="mt-2 text-xs text-neutral-400">
                              {review.createdAt 
                                ? formatDistanceToNow(new Date(review.createdAt)) + ' ago' 
                                : 'Unknown date'}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-neutral-500">
                      <p>You haven't used any services yet.</p>
                      <p className="mt-1 text-sm">Browse the marketplace to find businesses.</p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="as-business" className="space-y-4 pt-4">
                  <h3 className="text-lg font-medium mb-3">Your Businesses</h3>
                  
                  {userBusinesses && userBusinesses.length > 0 ? (
                    <div className="space-y-3">
                      {userBusinesses.slice(0, 4).map(business => (
                        <Card key={business.id} className="overflow-hidden">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium">{business.name}</h4>
                                <p className="text-sm text-neutral-500 mt-1 max-w-md">{business.description}</p>
                              </div>
                              <div className="flex items-center">
                                <Building2 className="h-5 w-5 text-neutral-500" />
                              </div>
                            </div>
                            <div className="mt-2 flex">
                              <Badge variant="outline" className="mr-2">
                                Category #{business.categoryId}
                              </Badge>
                              {business.verified && (
                                <Badge className="bg-green-500">Verified</Badge>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-neutral-500">
                      <p>You haven't registered any businesses yet.</p>
                      <p className="mt-1 text-sm">Register a business to offer services on the marketplace.</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}