import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Category, Location } from "@shared/schema";
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

export default function AllBusinesses() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");

  // Fetch categories
  const { data: categories, isLoading: isLoadingCategories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Fetch locations
  const { data: locations, isLoading: isLoadingLocations } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  });

  // Build query parameters for businesses
  const queryParams = new URLSearchParams();
  if (searchTerm) queryParams.append("search", searchTerm);
  if (selectedCategory && selectedCategory !== "all") queryParams.append("categoryId", selectedCategory);
  if (selectedLocation && selectedLocation !== "all") queryParams.append("locationId", selectedLocation);
  
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
    setSelectedCategory("");
    setSelectedLocation("");
  };

  // Count businesses that match the current filters
  const businessCount = businesses?.length || 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-neutral-800 mb-2">Businesses in Murang'a County</h1>
        <p className="text-neutral-600 mb-6">Discover and connect with local businesses across Murang'a</p>

        {/* Search and Filters */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-neutral-100 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <SearchBar 
                placeholder="Search for businesses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onSearch={handleSearch}
              />
            </div>
            
            <div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {!isLoadingCategories && categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
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
                disabled={!searchTerm && !selectedCategory && !selectedLocation}
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
            <h3 className="text-lg font-semibold text-neutral-800 mb-2">No businesses found</h3>
            <p className="text-neutral-600 mb-6">We couldn't find any businesses matching your search.</p>
            <Button asChild variant="outline">
              <Link href="/register-business">Register Your Business</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
