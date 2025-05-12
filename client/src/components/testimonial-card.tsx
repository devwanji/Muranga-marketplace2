import { Testimonial } from "@shared/schema";
import { Star } from "lucide-react";

interface TestimonialCardProps {
  testimonial: Testimonial;
}

export default function TestimonialCard({ testimonial }: TestimonialCardProps) {
  // Generate star rating display
  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`h-5 w-5 ${
            i <= testimonial.rating
              ? "text-accent fill-current"
              : "text-neutral-300"
          }`}
        />
      );
    }
    return stars;
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-100">
      <div className="flex items-center mb-4">
        <div className="h-12 w-12 rounded-full bg-neutral-200 overflow-hidden">
          {testimonial.imageUrl ? (
            <img
              src={testimonial.imageUrl}
              alt={`Profile of ${testimonial.name}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-secondary text-white font-medium">
              {testimonial.name.charAt(0)}
            </div>
          )}
        </div>
        <div className="ml-4">
          <h4 className="font-medium text-neutral-800">{testimonial.name}</h4>
          <p className="text-sm text-neutral-500">{testimonial.role}</p>
        </div>
      </div>
      <p className="text-neutral-600 line-clamp-4">{testimonial.comment}</p>
      <div className="mt-4 flex">{renderStars()}</div>
    </div>
  );
}
