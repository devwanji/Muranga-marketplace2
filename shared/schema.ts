import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull().default("customer"),
  fullName: text("full_name"),
  phone: text("phone"),
  googleId: text("google_id").unique(),
  isGoogleUser: boolean("is_google_user").default(false),
  profilePicture: text("profile_picture"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  imageUrl: text("image_url"),
  businessCount: integer("business_count").default(0),
});

export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  countyArea: text("county_area").notNull(),
});

export const businesses = pgTable("businesses", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  categoryId: integer("category_id").notNull(),
  locationId: integer("location_id").notNull(),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  websiteUrl: text("website_url"),
  imageUrl: text("image_url"),
  rating: integer("rating").default(0),
  ratingCount: integer("rating_count").default(0),
  verified: boolean("verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const businessTags = pgTable("business_tags", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull(),
  name: text("name").notNull(),
});

export const businessHours = pgTable("business_hours", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull(),
  dayOfWeek: integer("day_of_week").notNull(),
  openTime: text("open_time"),
  closeTime: text("close_time"),
  isClosed: boolean("is_closed").default(false),
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull(),
  userId: integer("user_id").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const testimonials = pgTable("testimonials", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  comment: text("comment").notNull(),
  rating: integer("rating").notNull(),
  imageUrl: text("image_url"),
});

// Subscription plan enum
export const subscriptionPlanEnum = pgEnum('subscription_plan_type', ['monthly', 'yearly']);

// Subscription plans
export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: subscriptionPlanEnum("type").notNull(),
  amount: integer("amount").notNull(),  // Amount in KSh
  description: text("description").notNull(),
  features: text("features").notNull(),  // Comma-separated list of features
});

// Business subscriptions
export const businessSubscriptions = pgTable("business_subscriptions", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull(),
  planId: integer("plan_id").notNull(),
  startDate: timestamp("start_date").notNull().defaultNow(),
  endDate: timestamp("end_date").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  autoRenew: boolean("auto_renew").notNull().default(false),
});

// M-Pesa payments
export const mpesaPayments = pgTable("mpesa_payments", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull(),
  subscriptionId: integer("subscription_id"),
  phoneNumber: text("phone_number").notNull(),
  amount: integer("amount").notNull(),
  transactionId: text("transaction_id"),
  merchantRequestId: text("merchant_request_id"),
  checkoutRequestId: text("checkout_request_id").notNull(),
  resultCode: integer("result_code"),
  resultDesc: text("result_desc"),
  mpesaReceiptNumber: text("mpesa_receipt_number"),
  status: text("status").notNull().default("pending"), // pending, completed, failed
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  role: true,
  fullName: true,
  phone: true,
  googleId: true,
  isGoogleUser: true,
  profilePicture: true,
});

export const insertCategorySchema = createInsertSchema(categories);

export const insertLocationSchema = createInsertSchema(locations);

export const insertBusinessSchema = createInsertSchema(businesses).omit({
  id: true,
  createdAt: true,
  rating: true,
  ratingCount: true,
  verified: true,
});

export const insertBusinessTagSchema = createInsertSchema(businessTags).omit({
  id: true,
});

export const insertBusinessHoursSchema = createInsertSchema(businessHours).omit({
  id: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});

export const insertTestimonialSchema = createInsertSchema(testimonials).omit({
  id: true,
});

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
  id: true,
});

export const insertBusinessSubscriptionSchema = createInsertSchema(businessSubscriptions).omit({
  id: true,
  startDate: true,
  isActive: true,
});

export const insertMpesaPaymentSchema = createInsertSchema(mpesaPayments).omit({
  id: true,
  resultCode: true,
  resultDesc: true,
  mpesaReceiptNumber: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type Location = typeof locations.$inferSelect;

export type InsertBusiness = z.infer<typeof insertBusinessSchema>;
export type Business = typeof businesses.$inferSelect;

export type InsertBusinessTag = z.infer<typeof insertBusinessTagSchema>;
export type BusinessTag = typeof businessTags.$inferSelect;

export type InsertBusinessHours = z.infer<typeof insertBusinessHoursSchema>;
export type BusinessHours = typeof businessHours.$inferSelect;

export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;

export type InsertTestimonial = z.infer<typeof insertTestimonialSchema>;
export type Testimonial = typeof testimonials.$inferSelect;

export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;

export type InsertBusinessSubscription = z.infer<typeof insertBusinessSubscriptionSchema>;
export type BusinessSubscription = typeof businessSubscriptions.$inferSelect;

export type InsertMpesaPayment = z.infer<typeof insertMpesaPaymentSchema>;
export type MpesaPayment = typeof mpesaPayments.$inferSelect;

// Extended schemas with additional info for the UI
export type BusinessWithDetails = Business & {
  category?: Category;
  location?: Location;
  tags?: BusinessTag[];
  owner?: User;
  subscription?: BusinessSubscription & {
    plan?: SubscriptionPlan;
  };
};
