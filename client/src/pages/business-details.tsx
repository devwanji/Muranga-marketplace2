import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { BusinessWithDetails } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  Star,
  Share2,
  Tag
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function BusinessDetails() {
  // Get business ID from URL
  const { id } = useParams<{ id: string }>();
  const businessId = parseInt(id);

  // Fetch business details
  const { data: business, isLoading } = useQuery<BusinessWithDetails>({
    queryKey: [`/api/businesses/${businessId}`],
  });

  if (isLoading) {
    return <BusinessDetailsSkeleton />;
  }

  if (!business) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-neutral-800 mb-4">Business Not Found</h1>
          <p className="text-neutral-600 mb-8">The business you're looking for doesn't exist or has been removed.</p>
          <Button asChild variant="outline">
            <a href="/businesses">Browse All Businesses</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Business Image */}
        <div className="rounded-xl overflow-hidden h-64 md:h-80 mb-6">
          {business.imageUrl ? (
            <img
              src={business.imageUrl}
              alt={business.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-neutral-200 flex items-center justify-center">
              <span className="text-neutral-500">No image available</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-neutral-800">{business.name}</h1>
                <div className="flex items-center mt-2">
                  {business.category && (
                    <span className="bg-secondary-light bg-opacity-10 text-secondary-dark text-xs px-2 py-0.5 rounded-full">
                      {business.category.name}
                    </span>
                  )}
                  {business.location && (
                    <span className="ml-2 text-sm text-neutral-500 flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {business.location.name}, Murang'a
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center">
                <Star className="h-5 w-5 text-accent-dark fill-current" />
                <span className="ml-1 text-sm font-medium">
                  {business.rating ?? 'New'} {business.ratingCount > 0 && `(${business.ratingCount})`}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-2">About</h2>
              <p className="text-neutral-600">{business.description}</p>
            </div>

            {/* Tags */}
            {business.tags && business.tags.length > 0 && (
              <div className="mt-6">
                <h2 className="text-lg font-semibold mb-2">Services & Products</h2>
                <div className="flex flex-wrap gap-2">
                  {business.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="text-xs bg-neutral-100 px-2 py-1 rounded-full flex items-center"
                    >
                      <Tag className="h-3 w-3 mr-1" />
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews Section */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Reviews & Ratings</h2>
                <Button variant="outline" size="sm">
                  Write a Review
                </Button>
              </div>

              {business.ratingCount > 0 ? (
                <div className="space-y-4">
                  {/* Review cards would go here */}
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-neutral-600">Reviews will be displayed here...</p>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-neutral-600">No reviews yet. Be the first to leave a review!</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div>
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4">Contact Information</h2>
                <div className="space-y-3">
                  {business.address && (
                    <div className="flex items-start">
                      <MapPin className="h-5 w-5 text-primary mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-neutral-800">Address</p>
                        <p className="text-sm text-neutral-600">{business.address}</p>
                      </div>
                    </div>
                  )}

                  {business.phone && (
                    <div className="flex items-start">
                      <Phone className="h-5 w-5 text-primary mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-neutral-800">Phone</p>
                        <p className="text-sm text-neutral-600">{business.phone}</p>
                      </div>
                    </div>
                  )}

                  {business.email && (
                    <div className="flex items-start">
                      <Mail className="h-5 w-5 text-primary mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-neutral-800">Email</p>
                        <p className="text-sm text-neutral-600">{business.email}</p>
                      </div>
                    </div>
                  )}

                  {business.websiteUrl && (
                    <div className="flex items-start">
                      <Globe className="h-5 w-5 text-primary mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-neutral-800">Website</p>
                        <a
                          href={business.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          {business.websiteUrl}
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6">
                  <Button className="w-full bg-primary hover:bg-primary-dark">
                    Contact Business
                  </Button>
                </div>

                <div className="mt-4">
                  <Button variant="outline" className="w-full" onClick={() => navigator.share({
                    title: business.name,
                    text: business.description,
                    url: window.location.href,
                  })}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Business Hours */}
            <Card className="mt-6">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <Clock className="h-5 w-5 text-primary mr-2" />
                  <h2 className="text-lg font-semibold">Business Hours</h2>
                </div>
                <p className="text-neutral-600 text-sm">Business hours will be displayed here...</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function BusinessDetailsSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Business Image Skeleton */}
        <Skeleton className="h-64 md:h-80 w-full rounded-xl mb-6" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Content Skeleton */}
          <div className="md:col-span-2">
            <Skeleton className="h-8 w-2/3 mb-2" />
            <div className="flex items-center mt-2">
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-5 w-32 ml-2" />
            </div>

            <div className="mt-6">
              <Skeleton className="h-6 w-24 mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </div>

            <div className="mt-6">
              <Skeleton className="h-6 w-36 mb-2" />
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </div>

            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-6 w-36" />
                <Skeleton className="h-9 w-28" />
              </div>
              <Skeleton className="h-32 w-full rounded-xl" />
            </div>
          </div>

          {/* Sidebar Skeleton */}
          <div>
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-40 mb-4" />
                <div className="space-y-3">
                  <div className="flex items-start">
                    <Skeleton className="h-5 w-5 mr-2" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-16 mb-1" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Skeleton className="h-5 w-5 mr-2" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-16 mb-1" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Skeleton className="h-5 w-5 mr-2" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-16 mb-1" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </div>
                </div>
                <Skeleton className="h-10 w-full mt-6" />
                <Skeleton className="h-10 w-full mt-4" />
              </CardContent>
            </Card>
            <Card className="mt-6">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <Skeleton className="h-5 w-5 mr-2" />
                  <Skeleton className="h-6 w-32" />
                </div>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
