import { db, pool } from "../db";
import fs from "fs";
import path from "path";
import { subscriptionPlans } from "@shared/schema";

// Main migration function
async function migrate() {
  console.log("Starting database migration...");
  try {
    // Run the migration SQL file
    const migrationFilePath = path.join(process.cwd(), "migrations", "0000_milky_silver_centurion.sql");
    const migrationSQL = fs.readFileSync(migrationFilePath, "utf8");
    
    // Split the migration into separate statements
    const statements = migrationSQL.split("--> statement-breakpoint");
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await pool.query(statement);
          console.log("Executed SQL statement successfully");
        } catch (error: any) {
          // If error is about the relation already existing, continue
          if (error.code === '42P07') {
            console.log("Relation already exists, continuing...");
          } else {
            console.error("Error executing statement:", error.message);
            throw error;
          }
        }
      }
    }
    
    console.log("Migration completed successfully");
    
    // Insert default subscription plans if they don't exist
    await seedSubscriptionPlans();
    
    console.log("Database setup completed");
  } catch (error) {
    console.error("Migration error:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Insert default subscription plans
async function seedSubscriptionPlans() {
  console.log("Checking for existing subscription plans...");
  const existingPlans = await db.query.subscriptionPlans.findMany();
  
  if (existingPlans.length === 0) {
    console.log("No existing plans found. Creating default subscription plans...");
    
    try {
      // Monthly plan
      await db.insert(subscriptionPlans).values({
        name: "Monthly Subscription",
        type: "monthly",
        amount: 200, // KSh 200
        description: "Monthly business subscription plan",
        features: "Business listing, Contact info, Location display, Category listing"
      });
      
      // Yearly plan
      await db.insert(subscriptionPlans).values({
        name: "Yearly Subscription",
        type: "yearly",
        amount: 3000, // KSh 3,000
        description: "Yearly business subscription plan - save KSh 1,400 compared to monthly",
        features: "Business listing, Contact info, Location display, Category listing, Featured placement, Business analytics"
      });
      
      console.log("Default subscription plans created successfully");
    } catch (error) {
      console.error("Error creating subscription plans:", error);
    }
  } else {
    console.log("Subscription plans already exist in the database");
  }
}

// Run the migration
migrate();