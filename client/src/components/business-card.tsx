import { Link } from "wouter";
import { BusinessWithDetails } from "@shared/schema";
import { Star, MapPin, Share2 } from "lucide-react";

interface BusinessCardProps {
  business: BusinessWithDetails;
}

export default function BusinessCard({ business }: BusinessCardProps) {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-neutral-100">
      {/* Business Image */}
      <div className="w-full h-48 bg-neutral-200">
        {business.imageUrl ? (
          <img 
            src={business.imageUrl} 
            alt={business.name} 
            className="w-full h-full object-cover" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-400">
            No image available
          </div>
        )}
      </div>
      
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-heading font-semibold text-lg text-neutral-800">{business.name}</h3>
            <div className="flex items-center mt-1">
              {business.category && (
                <span className="bg-secondary-light bg-opacity-10 text-secondary-dark text-xs px-2 py-0.5 rounded-full">
                  {business.category.name}
                </span>
              )}
              {business.location && (
                <span className="ml-2 text-sm text-neutral-500 flex items-center">
                  <MapPin className="h-3 w-3 mr-0.5" />
                  {business.location.name}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center">
            <Star className="h-5 w-5 text-accent-dark fill-current" />
            <span className="ml-1 text-sm font-medium">
              {business.rating || 'New'}
            </span>
          </div>
        </div>
        
        <p className="mt-3 text-neutral-600 text-sm line-clamp-2">
          {business.description}
        </p>
        
        {business.tags && business.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {business.tags.slice(0, 3).map((tag) => (
              <span key={tag.id} className="text-xs bg-neutral-100 px-2 py-1 rounded-full">
                {tag.name}
              </span>
            ))}
            {business.tags.length > 3 && (
              <span className="text-xs bg-neutral-100 px-2 py-1 rounded-full">
                +{business.tags.length - 3} more
              </span>
            )}
          </div>
        )}
        
        <div className="mt-5 flex justify-between items-center">
          <Link href={`/businesses/${business.id}`} className="text-primary hover:text-primary-dark font-medium text-sm flex items-center">
            View Details
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </Link>
          <button 
            className="text-sm text-neutral-600 hover:text-primary flex items-center"
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: business.name,
                  text: business.description,
                  url: window.location.origin + `/businesses/${business.id}`,
                });
              }
            }}
          >
            <Share2 className="h-4 w-4 mr-1" />
            Share
          </button>
        </div>
      </div>
    </div>
  );
}
