import { useQuery } from "@tanstack/react-query";
import { Category, Testimonial } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import CategoryCard from "@/components/category-card";
import BusinessCard from "@/components/business-card";
import TestimonialCard from "@/components/testimonial-card";
import HeroSection from "@/components/hero-section";
import { Loader2 } from "lucide-react";

const HomePage = () => {
  // Fetch categories
  const { 
    data: categories, 
    isLoading: isLoadingCategories 
  } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Fetch featured businesses
  const { 
    data: businesses, 
    isLoading: isLoadingBusinesses 
  } = useQuery({
    queryKey: ["/api/businesses"],
  });

  // Fetch testimonials
  const { 
    data: testimonials, 
    isLoading: isLoadingTestimonials 
  } = useQuery<Testimonial[]>({
    queryKey: ["/api/testimonials"],
  });

  return (
    <>
      <HeroSection />

      {/* Categories Section */}
      <section id="categories" className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-neutral-800">Browse by Category</h2>
            <p className="text-neutral-600 mt-2">Find what you need from our diverse range of local businesses</p>
          </div>
          
          {isLoadingCategories ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {categories?.slice(0, 7).map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
              
              {/* View More Categories */}
              <Link href="/businesses" className="group flex items-center justify-center">
                <div className="bg-neutral-50 rounded-xl overflow-hidden shadow-sm border border-neutral-100 hover:shadow-md transition-shadow w-full h-full flex flex-col items-center justify-center p-8">
                  <div className="bg-neutral-100 rounded-full p-3 mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <h3 className="font-medium text-neutral-800 group-hover:text-primary transition-colors">View All Categories</h3>
                  <p className="text-sm text-neutral-600 mt-1 text-center">Explore all business types</p>
                </div>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Featured Businesses */}
      <section id="businesses" className="py-12 bg-neutral-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-neutral-800">Featured Businesses</h2>
              <p className="text-neutral-600 mt-2">Discover top-rated local businesses in Murang'a County</p>
            </div>
            <div className="hidden md:block">
              <Link href="/businesses" className="text-primary hover:text-primary-dark font-medium flex items-center">
                View all
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          </div>
          
          {isLoadingBusinesses ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : businesses && businesses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {businesses.slice(0, 3).map((business) => (
                <BusinessCard key={business.id} business={business} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-neutral-600">No businesses found. Be the first to register your business!</p>
            </div>
          )}
          
          <div className="mt-8 text-center md:hidden">
            <Link href="/businesses">
              <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white">
                View All Businesses
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-neutral-800">How It Works</h2>
            <p className="text-neutral-600 mt-2 max-w-2xl mx-auto">Connect with local businesses in Murang'a County in just a few simple steps</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="bg-primary bg-opacity-10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="mt-4 font-semibold text-lg text-neutral-800">Search</h3>
              <p className="mt-2 text-neutral-600">Browse categories or search for specific products, services, or businesses in your area.</p>
            </div>
            
            {/* Step 2 */}
            <div className="text-center">
              <div className="bg-secondary bg-opacity-10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="mt-4 font-semibold text-lg text-neutral-800">Connect</h3>
              <p className="mt-2 text-neutral-600">View business details, read reviews, and contact them directly through our platform.</p>
            </div>
            
            {/* Step 3 */}
            <div className="text-center">
              <div className="bg-accent bg-opacity-10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-accent-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="mt-4 font-semibold text-lg text-neutral-800">Support Local</h3>
              <p className="mt-2 text-neutral-600">Buy products or services from local businesses and help grow Murang'a's economy.</p>
            </div>
          </div>
          
          <div className="mt-12 text-center">
            <Link href="/businesses">
              <Button className="bg-primary hover:bg-primary-dark text-white">
                Get Started Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      {!isLoadingTestimonials && testimonials && testimonials.length > 0 && (
        <section className="py-12 bg-neutral-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-neutral-800">What People Say</h2>
              <p className="text-neutral-600 mt-2">Hear from businesses and customers using our platform</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.map((testimonial) => (
                <TestimonialCard key={testimonial.id} testimonial={testimonial} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Callout */}
      <section className="py-16 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4">Ready to Grow Your Business?</h2>
            <p className="text-white text-opacity-90 text-lg mb-8">Join local businesses in Murang'a County already using our platform to reach new customers.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/register-business">
                <Button className="px-8 py-3 bg-white text-primary hover:bg-neutral-100 transition-colors w-full sm:w-auto">
                  Register Your Business
                </Button>
              </Link>
              <Link href="/businesses">
                <Button variant="outline" className="px-8 py-3 border-white text-white hover:bg-primary-dark transition-colors w-full sm:w-auto">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default HomePage;
