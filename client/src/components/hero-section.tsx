import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Category } from "@shared/schema";
import { Search } from "lucide-react";

export default function HeroSection() {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  // Fetch categories for the dropdown
  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const handleSearch = () => {
    const params = new URLSearchParams();
    
    if (searchTerm) {
      params.append("search", searchTerm);
    }
    
    if (selectedCategory && selectedCategory !== "all") {
      params.append("categoryId", selectedCategory);
    }
    
    if (params.toString()) {
      navigate(`/businesses?${params.toString()}`);
    } else {
      navigate("/businesses");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <section className="hero-pattern text-white">
      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Connect with Local Businesses in Murang'a County
          </h1>
          <p className="text-lg md:text-xl opacity-90 mb-8">
            Discover farmers, artisans, shops and service providers near you
          </p>

          {/* Search Bar */}
          <div className="bg-white rounded-lg shadow-lg p-3 max-w-2xl mx-auto flex flex-col md:flex-row gap-2">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="What are you looking for?"
                className="w-full px-4 py-3 text-neutral-800 border-none focus:ring-2 focus:ring-primary"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
            
            <div className="flex-1">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full px-4 py-3 h-[50px] border-none focus:ring-2 focus:ring-primary">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button
              className="bg-primary hover:bg-primary-dark text-white font-medium rounded-md px-6 py-3 h-[50px]"
              onClick={handleSearch}
            >
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white bg-opacity-20 backdrop-filter backdrop-blur-sm rounded-lg p-4">
              <div className="font-bold text-2xl md:text-3xl">500+</div>
              <div className="text-sm md:text-base">Local Businesses</div>
            </div>
            
            <div className="bg-white bg-opacity-20 backdrop-filter backdrop-blur-sm rounded-lg p-4">
              <div className="font-bold text-2xl md:text-3xl">12</div>
              <div className="text-sm md:text-base">Categories</div>
            </div>
            
            <div className="bg-white bg-opacity-20 backdrop-filter backdrop-blur-sm rounded-lg p-4">
              <div className="font-bold text-2xl md:text-3xl">35+</div>
              <div className="text-sm md:text-base">Locations</div>
            </div>
            
            <div className="bg-white bg-opacity-20 backdrop-filter backdrop-blur-sm rounded-lg p-4">
              <div className="font-bold text-2xl md:text-3xl">5k+</div>
              <div className="text-sm md:text-base">Happy Customers</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
