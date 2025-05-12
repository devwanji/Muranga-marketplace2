import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "muranga-marketplace-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const user = await storage.getUserByUsername(username);
      if (!user || !(await comparePasswords(password, user.password))) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    }),
  );
  
  // Skip Google Strategy initialization if credentials are not available
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    // Configure Google Strategy
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: "/api/auth/google/callback",
        },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user exists by email
          const email = profile.emails?.[0]?.value || "";
          if (!email) {
            return done(new Error("Email is required"));
          }
          
          let user = await storage.getUserByEmail(email);
          
          if (!user) {
            // User doesn't exist, create a new one
            const randomPasswordString = randomBytes(16).toString('hex');
            const hashedPassword = await hashPassword(randomPasswordString);
            
            user = await storage.createUser({
              username: profile.displayName?.replace(/\s+/g, '_').toLowerCase() || `user_${randomBytes(4).toString('hex')}`,
              email: email,
              password: hashedPassword,
              fullName: profile.displayName || "",
              isGoogleUser: true,
              googleId: profile.id,
              profilePicture: profile.photos?.[0]?.value || null
            });
          } else if (!user.googleId) {
            // User exists but not linked with Google yet
            await storage.updateUser(user.id, {
              googleId: profile.id,
              isGoogleUser: true,
              profilePicture: profile.photos?.[0]?.value || user.profilePicture
            });
          }
          
          return done(null, user);
        } catch (error) {
          return done(error as Error);
        }
      }
    )
  );
  }

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });

  app.post("/api/register", async (req, res, next) => {
    const existingUser = await storage.getUserByUsername(req.body.username);
    if (existingUser) {
      return res.status(400).send("Username already exists");
    }

    try {
      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (error) {
      return res.status(400).json({ message: (error as Error).message });
    }
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });

  // Google Auth Routes - Only enable if Google OAuth is configured
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    app.get(
      "/api/auth/google",
      passport.authenticate("google", { scope: ["profile", "email"] })
    );

    app.get(
      "/api/auth/google/callback",
      passport.authenticate("google", { failureRedirect: "/auth" }),
      (req, res) => {
        // Successful authentication, redirect to home page
        res.redirect("/");
      }
    );
  }

  // Firebase Google Token Auth
  app.post("/api/auth/google/token", async (req, res, next) => {
    try {
      const { email, displayName, uid, photoURL } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      // Check if user exists
      let user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Create new user
        const randomPassword = randomBytes(16).toString("hex");
        const hashedPassword = await hashPassword(randomPassword);
        
        user = await storage.createUser({
          username: displayName?.replace(/\s+/g, "_").toLowerCase() || `user_${randomBytes(4).toString("hex")}`,
          email,
          password: hashedPassword,
          fullName: displayName || "",
          isGoogleUser: true,
          googleId: uid,
          profilePicture: photoURL || null
        });
      } else if (!user.googleId) {
        // Link existing user with Google
        await storage.updateUser(user.id, {
          googleId: uid,
          isGoogleUser: true,
          profilePicture: photoURL || user.profilePicture
        });
      }
      
      // Log the user in
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(200).json(user);
      });
    } catch (error) {
      return res.status(500).json({ message: (error as Error).message });
    }
  });
}
