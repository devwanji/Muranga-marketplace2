import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import {
  insertBusinessSchema,
  insertBusinessTagSchema,
  insertCategorySchema,
  insertLocationSchema,
  insertReviewSchema,
  insertSubscriptionPlanSchema,
  subscriptionPlans,
} from "@shared/schema";
import paymentRoutes from "./routes/payment";
import { db } from "./db";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Register payment routes
  app.use('/api/payment', paymentRoutes);

  // Initialize with sample data if in development mode
  if (process.env.NODE_ENV === "development") {
    await initializeSampleData();
  }

  // Category routes
  app.get("/api/categories", async (req, res) => {
    const categories = await storage.getAllCategories();
    res.json(categories);
  });

  app.get("/api/categories/:id", async (req, res) => {
    const categoryId = parseInt(req.params.id);
    const category = await storage.getCategory(categoryId);
    
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    
    res.json(category);
  });

  // Location routes
  app.get("/api/locations", async (req, res) => {
    const locations = await storage.getAllLocations();
    res.json(locations);
  });

  // Business routes
  app.get("/api/businesses", async (req, res) => {
    const { categoryId, locationId, search } = req.query;
    
    const businesses = await storage.getBusinesses({
      categoryId: categoryId ? parseInt(categoryId as string) : undefined,
      locationId: locationId ? parseInt(locationId as string) : undefined,
      search: search as string | undefined,
    });
    
    res.json(businesses);
  });

  app.get("/api/businesses/:id", async (req, res) => {
    // Validate that id is a number before parsing
    if (!/^\d+$/.test(req.params.id)) {
      return res.status(400).json({ message: "Invalid business ID format" });
    }
    
    const businessId = parseInt(req.params.id);
    
    try {
      const business = await storage.getBusinessWithDetails(businessId);
      
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }
      
      res.json(business);
    } catch (error) {
      console.error("Error fetching business details:", error);
      res.status(500).json({ message: "Failed to fetch business details" });
    }
  });

  app.post("/api/businesses", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const businessData = insertBusinessSchema.parse({
        ...req.body,
        ownerId: req.user!.id,
      });
      
      const business = await storage.createBusiness(businessData);
      
      // Add tags if provided
      if (req.body.tags && Array.isArray(req.body.tags)) {
        for (const tagName of req.body.tags) {
          await storage.createBusinessTag({
            businessId: business.id,
            name: tagName,
          });
        }
      }
      
      res.status(201).json(business);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(400).json({ message: (error as Error).message });
    }
  });
  
  // Create temporary business for payment process
  app.post("/api/businesses/temp", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      // Create a minimal temporary business for the payment process
      const businessData = {
        ownerId: req.user!.id,
        name: "Temporary Business",
        description: "Temporary business record for payment processing",
        categoryId: 1, // Default category
        locationId: 1, // Default location
        // Add minimal required fields
        email: req.user!.email || "",
        phone: req.user!.phone || "",
      };
      
      const business = await storage.createBusiness(businessData);
      
      res.status(201).json(business);
    } catch (error) {
      console.error("Error creating temporary business:", error);
      res.status(500).json({ message: "Failed to create temporary business record" });
    }
  });

  // Review routes
  app.post("/api/businesses/:id/reviews", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const businessId = parseInt(req.params.id);
      const reviewData = insertReviewSchema.parse({
        ...req.body,
        businessId,
        userId: req.user!.id,
      });
      
      const review = await storage.createReview(reviewData);
      await storage.updateBusinessRating(businessId);
      
      res.status(201).json(review);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(400).json({ message: (error as Error).message });
    }
  });

  // Get testimonials
  app.get("/api/testimonials", async (req, res) => {
    const testimonials = await storage.getAllTestimonials();
    res.json(testimonials);
  });

  // Get my businesses (for logged in business owners)
  app.get("/api/my-businesses", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const businesses = await storage.getBusinessesByOwner(req.user!.id);
    res.json(businesses);
  });
  
  // User's businesses (for profile page)
  app.get("/api/businesses/user", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const userId = req.user!.id;
      const businesses = await storage.getBusinessesByOwner(userId);
      res.json(businesses);
    } catch (error) {
      console.error("Error fetching user businesses:", error);
      res.status(500).json({ message: "Failed to fetch user businesses" });
    }
  });
  
  // User's reviews (for profile page)
  app.get("/api/reviews/user", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const userId = req.user!.id;
      const reviews = await db.query.reviews.findMany({
        where: (fields, { eq }) => eq(fields.userId, userId),
        orderBy: (fields, { desc }) => [desc(fields.createdAt)],
      });
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching user reviews:", error);
      res.status(500).json({ message: "Failed to fetch user reviews" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to initialize sample data for development
async function initializeSampleData() {
  // Only initialize if categories table is empty
  const existingCategories = await storage.getAllCategories();
  if (existingCategories.length > 0) {
    return; // Data already exists, don't initialize again
  }
  
  // Check if subscription plans exist
  const existingPlans = await db.query.subscriptionPlans.findMany();
  if (existingPlans.length === 0) {
    // Add subscription plans
    const plansData = [
      {
        name: "Monthly Plan",
        description: "Basic monthly subscription for business listing",
        type: "monthly" as const, // Using the enum value
        amount: 200, // KSh 200
        features: "Business listing, Customer inquiries, Basic analytics"
      },
      {
        name: "Annual Plan",
        description: "Discounted annual subscription for business listing",
        type: "yearly" as const, // Using the enum value
        amount: 3000, // KSh 3,000
        features: "Business listing, Customer inquiries, Advanced analytics, Featured placement"
      }
    ];

    try {
      // Insert each plan individually
      for (const plan of plansData) {
        await db.insert(subscriptionPlans).values(plan);
      }
      console.log("Subscription plans initialized");
    } catch (error) {
      console.error("Error initializing subscription plans:", error);
    }
  }

  // Add sample categories
  const categories = [
    { name: "Agriculture", description: "Farms, produce, seeds", imageUrl: "https://images.unsplash.com/photo-1488459716781-31db52582fe9?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=500&h=350", businessCount: 120 },
    { name: "Transportation", description: "Boda services, matatus", imageUrl: "https://images.unsplash.com/photo-1559693216-5b7a24c18232?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=500&h=350", businessCount: 85 },
    { name: "Retail", description: "Shops, markets, vendors", imageUrl: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=500&h=350", businessCount: 95 },
    { name: "Crafts & Artisan", description: "Handcrafts, artwork", imageUrl: "https://images.unsplash.com/photo-1606925207923-c580f25966b0?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=500&h=350", businessCount: 45 },
    { name: "Services", description: "Repairs, tailoring", imageUrl: "https://images.unsplash.com/photo-1581299894341-367e6517569c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=500&h=350", businessCount: 75 },
    { name: "Food & Dining", description: "Restaurants, catering", imageUrl: "https://images.unsplash.com/photo-1534531173927-aeb928d54385?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=500&h=350", businessCount: 65 },
    { name: "Education", description: "Schools, tutoring", imageUrl: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=500&h=350", businessCount: 40 }
  ];

  for (const category of categories) {
    await storage.createCategory(category);
  }

  // Add sample locations
  const locations = [
    { name: "Murang'a Town", countyArea: "Central" },
    { name: "Kahuro", countyArea: "South" },
    { name: "Kandara", countyArea: "East" },
    { name: "Maragua", countyArea: "West" },
    { name: "Kangema", countyArea: "North" }
  ];

  for (const location of locations) {
    await storage.createLocation(location);
  }

  // Add sample testimonials
  const testimonials = [
    {
      name: "Jane Wambui",
      role: "Fruit Vendor, Kahuro Market",
      comment: "This platform has helped me reach customers beyond my local market. Now people from all over Murang'a can find my produce and place orders. My business has grown significantly!",
      rating: 5,
      imageUrl: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100"
    },
    {
      name: "John Kamau",
      role: "Customer, Murang'a Town",
      comment: "Finding local services used to be difficult. Now I can quickly search for exactly what I need, compare options, and support businesses in my community. The platform is easy to use even on my basic smartphone.",
      rating: 4,
      imageUrl: "https://images.unsplash.com/photo-1506634572416-48cdfe530110?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100"
    },
    {
      name: "David Mwangi",
      role: "Tailor, Kangema",
      comment: "Registering my tailoring business was simple and fast. Now I get orders from all over the county. The platform has brought my small village shop to the digital world without any technical knowledge needed!",
      rating: 5,
      imageUrl: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100"
    }
  ];

  for (const testimonial of testimonials) {
    await storage.createTestimonial(testimonial);
  }
}
