import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Category } from "@shared/schema";
import SearchBar from "@/components/search-bar";
import BusinessCard from "@/components/business-card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function BrowseByCategory() {
  const { id } = useParams<{ id: string }>();
  const categoryId = parseInt(id);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");

  // Fetch single category details
  const { data: category, isLoading: isLoadingCategory } = useQuery<Category>({
    queryKey: [`/api/categories/${categoryId}`],
  });

  // Fetch locations
  const { data: locations, isLoading: isLoadingLocations } = useQuery({
    queryKey: ["/api/locations"],
  });

  // Build query parameters for businesses
  const queryParams = new URLSearchParams();
  queryParams.append("categoryId", categoryId.toString());
  if (searchTerm) queryParams.append("search", searchTerm);
  if (selectedLocation) queryParams.append("locationId", selectedLocation);
  
  // Fetch businesses with filters
  const { 
    data: businesses, 
    isLoading: isLoadingBusinesses,
    refetch,
  } = useQuery({
    queryKey: [`/api/businesses?${queryParams.toString()}`],
  });

  const handleSearch = (searchValue: string) => {
    setSearchTerm(searchValue);
  };

  const handleFilter = () => {
    refetch();
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedLocation("");
  };

  // Count businesses that match the current filters
  const businessCount = businesses?.length || 0;

  if (isLoadingCategory) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-neutral-800 mb-4">Category Not Found</h1>
          <p className="text-neutral-600 mb-8">The category you're looking for doesn't exist or has been removed.</p>
          <Button asChild variant="outline">
            <Link href="/businesses">Browse All Businesses</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          {category.imageUrl && (
            <div className="h-48 md:h-64 rounded-xl overflow-hidden mb-6">
              <img 
                src={category.imageUrl} 
                alt={category.name} 
                className="w-full h-full object-cover" 
              />
            </div>
          )}
          
          <h1 className="text-2xl md:text-3xl font-bold text-neutral-800 mb-2">{category.name} in Murang'a County</h1>
          <p className="text-neutral-600 mb-2">{category.description}</p>
          <p className="text-sm text-neutral-500">Browse {category.businessCount} businesses in this category</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-neutral-100 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3">
              <SearchBar 
                placeholder={`Search ${category.name.toLowerCase()}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onSearch={handleSearch}
              />
            </div>
            
            <div>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Locations</SelectItem>
                  {!isLoadingLocations && locations?.map((location) => (
                    <SelectItem key={location.id} value={location.id.toString()}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-between mt-4">
            <p className="text-sm text-neutral-600">
              {isLoadingBusinesses ? (
                <span className="flex items-center">
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  Loading businesses...
                </span>
              ) : (
                <span>Found {businessCount} businesses</span>
              )}
            </p>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleClearFilters}
                disabled={!searchTerm && !selectedLocation}
              >
                Clear Filters
              </Button>
              <Button 
                variant="default" 
                size="sm"
                onClick={handleFilter}
                className="bg-primary hover:bg-primary-dark"
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Businesses Grid */}
        {isLoadingBusinesses ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : businesses && businesses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {businesses.map((business) => (
              <BusinessCard key={business.id} business={business} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-neutral-50 rounded-xl border border-neutral-100">
            <h3 className="text-lg font-semibold text-neutral-800 mb-2">No businesses found in this category</h3>
            <p className="text-neutral-600 mb-6">Be the first to register your {category.name.toLowerCase()} business.</p>
            <Button asChild variant="outline">
              <Link href="/register-business">Register Your Business</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
