import { users, type User, type InsertUser, categories, locations, businesses, businessTags, reviews, testimonials, type InsertCategory, type Category, type InsertLocation, type Location, type InsertBusiness, type Business, type InsertBusinessTag, type BusinessTag, type InsertReview, type Review, type InsertTestimonial, type Testimonial, type BusinessWithDetails } from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { eq, like, SQL, sql, desc, and, or } from "drizzle-orm";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  sessionStore: session.SessionStore;
  
  // User Methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<InsertUser>): Promise<User>;
  
  // Category Methods
  createCategory(category: InsertCategory): Promise<Category>;
  getCategory(id: number): Promise<Category | undefined>;
  getAllCategories(): Promise<Category[]>;
  
  // Location Methods
  createLocation(location: InsertLocation): Promise<Location>;
  getLocation(id: number): Promise<Location | undefined>;
  getAllLocations(): Promise<Location[]>;
  
  // Business Methods
  createBusiness(business: InsertBusiness): Promise<Business>;
  getBusiness(id: number): Promise<Business | undefined>;
  getBusinessWithDetails(id: number): Promise<BusinessWithDetails | undefined>;
  getBusinesses(filters?: { categoryId?: number, locationId?: number, search?: string }): Promise<BusinessWithDetails[]>;
  getBusinessesByOwner(ownerId: number): Promise<BusinessWithDetails[]>;
  updateBusinessRating(businessId: number): Promise<void>;
  
  // Business Tags Methods
  createBusinessTag(tag: InsertBusinessTag): Promise<BusinessTag>;
  getBusinessTags(businessId: number): Promise<BusinessTag[]>;
  
  // Review Methods
  createReview(review: InsertReview): Promise<Review>;
  getBusinessReviews(businessId: number): Promise<Review[]>;

  // Testimonial Methods
  createTestimonial(testimonial: InsertTestimonial): Promise<Testimonial>;
  getAllTestimonials(): Promise<Testimonial[]>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  // User Methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User> {
    const [updatedUser] = await db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }
  
  // Category Methods
  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }
  
  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }
  
  async getAllCategories(): Promise<Category[]> {
    return db.select().from(categories);
  }
  
  // Location Methods
  async createLocation(location: InsertLocation): Promise<Location> {
    const [newLocation] = await db.insert(locations).values(location).returning();
    return newLocation;
  }
  
  async getLocation(id: number): Promise<Location | undefined> {
    const [location] = await db.select().from(locations).where(eq(locations.id, id));
    return location;
  }
  
  async getAllLocations(): Promise<Location[]> {
    return db.select().from(locations);
  }
  
  // Business Methods
  async createBusiness(business: InsertBusiness): Promise<Business> {
    const [newBusiness] = await db.insert(businesses).values(business).returning();
    
    // Update category business count
    const category = await this.getCategory(business.categoryId);
    if (category) {
      await db.update(categories)
        .set({ businessCount: (category.businessCount || 0) + 1 })
        .where(eq(categories.id, category.id));
    }
    
    return newBusiness;
  }
  
  async getBusiness(id: number): Promise<Business | undefined> {
    const [business] = await db.select().from(businesses).where(eq(businesses.id, id));
    return business;
  }
  
  async getBusinessWithDetails(id: number): Promise<BusinessWithDetails | undefined> {
    const [business] = await db.select().from(businesses).where(eq(businesses.id, id));
    if (!business) return undefined;
    
    const [category] = business.categoryId 
      ? await db.select().from(categories).where(eq(categories.id, business.categoryId))
      : [];
    
    const [location] = business.locationId
      ? await db.select().from(locations).where(eq(locations.id, business.locationId))
      : [];
    
    const tags = await this.getBusinessTags(id);
    
    const [owner] = business.ownerId
      ? await db.select().from(users).where(eq(users.id, business.ownerId))
      : [];
    
    return {
      ...business,
      category,
      location,
      tags,
      owner
    };
  }
  
  async getBusinesses(filters?: { categoryId?: number, locationId?: number, search?: string }): Promise<BusinessWithDetails[]> {
    let query = db.select().from(businesses);
    
    // Apply filters
    if (filters) {
      const conditions: SQL[] = [];
      
      if (filters.categoryId) {
        conditions.push(eq(businesses.categoryId, filters.categoryId));
      }
      
      if (filters.locationId) {
        conditions.push(eq(businesses.locationId, filters.locationId));
      }
      
      if (filters.search) {
        const searchLower = `%${filters.search.toLowerCase()}%`;
        conditions.push(
          or(
            sql`lower(${businesses.name}) like ${searchLower}`,
            sql`lower(${businesses.description}) like ${searchLower}`
          )
        );
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
    }
    
    // Order by created date (newest first)
    query = query.orderBy(desc(businesses.createdAt));
    
    const businessList = await query;
    
    // Map to include details
    const detailedBusinesses: BusinessWithDetails[] = [];
    
    for (const business of businessList) {
      const [category] = business.categoryId 
        ? await db.select().from(categories).where(eq(categories.id, business.categoryId))
        : [];
      
      const [location] = business.locationId
        ? await db.select().from(locations).where(eq(locations.id, business.locationId))
        : [];
      
      const tags = await this.getBusinessTags(business.id);
      
      detailedBusinesses.push({
        ...business,
        category,
        location,
        tags
      });
    }
    
    return detailedBusinesses;
  }
  
  async getBusinessesByOwner(ownerId: number): Promise<BusinessWithDetails[]> {
    const businessList = await db.select()
      .from(businesses)
      .where(eq(businesses.ownerId, ownerId))
      .orderBy(desc(businesses.createdAt));
    
    const detailedBusinesses: BusinessWithDetails[] = [];
    
    for (const business of businessList) {
      const [category] = business.categoryId 
        ? await db.select().from(categories).where(eq(categories.id, business.categoryId))
        : [];
      
      const [location] = business.locationId
        ? await db.select().from(locations).where(eq(locations.id, business.locationId))
        : [];
      
      const tags = await this.getBusinessTags(business.id);
      
      detailedBusinesses.push({
        ...business,
        category,
        location,
        tags
      });
    }
    
    return detailedBusinesses;
  }
  
  async updateBusinessRating(businessId: number): Promise<void> {
    const reviewsList = await db.select()
      .from(reviews)
      .where(eq(reviews.businessId, businessId));
    
    if (reviewsList.length === 0) return;
    
    const totalRating = reviewsList.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = Math.round(totalRating / reviewsList.length);
    
    await db.update(businesses)
      .set({ 
        rating: averageRating, 
        ratingCount: reviewsList.length 
      })
      .where(eq(businesses.id, businessId));
  }
  
  // Business Tags Methods
  async createBusinessTag(tag: InsertBusinessTag): Promise<BusinessTag> {
    const [newTag] = await db.insert(businessTags).values(tag).returning();
    return newTag;
  }
  
  async getBusinessTags(businessId: number): Promise<BusinessTag[]> {
    return db.select()
      .from(businessTags)
      .where(eq(businessTags.businessId, businessId));
  }
  
  // Review Methods
  async createReview(review: InsertReview): Promise<Review> {
    const [newReview] = await db.insert(reviews).values(review).returning();
    return newReview;
  }
  
  async getBusinessReviews(businessId: number): Promise<Review[]> {
    return db.select()
      .from(reviews)
      .where(eq(reviews.businessId, businessId))
      .orderBy(desc(reviews.createdAt));
  }
  
  // Testimonial Methods
  async createTestimonial(testimonial: InsertTestimonial): Promise<Testimonial> {
    const [newTestimonial] = await db.insert(testimonials).values(testimonial).returning();
    return newTestimonial;
  }
  
  async getAllTestimonials(): Promise<Testimonial[]> {
    return db.select().from(testimonials);
  }
}

export const storage = new DatabaseStorage();
