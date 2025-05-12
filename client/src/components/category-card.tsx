import { Link } from "wouter";
import { Category } from "@shared/schema";

interface CategoryCardProps {
  category: Category;
}

export default function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link href={`/categories/${category.id}`} className="group">
      <div className="bg-neutral-50 rounded-xl overflow-hidden shadow-sm border border-neutral-100 hover:shadow-md transition-shadow">
        {category.imageUrl && (
          <img
            src={category.imageUrl}
            alt={`${category.name} category`}
            className="w-full h-36 object-cover"
          />
        )}
        <div className="p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-neutral-800 group-hover:text-primary transition-colors">
              {category.name}
            </h3>
            {category.businessCount !== undefined && (
              <span className="text-xs bg-secondary-light bg-opacity-10 text-secondary px-2 py-1 rounded-full">
                {category.businessCount}+
              </span>
            )}
          </div>
          <p className="text-sm text-neutral-600 mt-1">{category.description}</p>
        </div>
      </div>
    </Link>
  );
}
