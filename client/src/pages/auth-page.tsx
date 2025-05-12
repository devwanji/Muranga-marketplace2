import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { signInWithGoogle, checkRedirectResult } from "@/lib/firebase";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  fullName: z.string().optional(),
  phone: z.string().optional(),
  role: z.enum(["customer", "business"]),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const { toast } = useToast();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      fullName: "",
      phone: "",
      role: "customer",
    },
  });

  // Handle login submission
  function onLoginSubmit(data: LoginFormValues) {
    loginMutation.mutate(data);
  }

  // Handle registration submission
  function onRegisterSubmit(data: RegisterFormValues) {
    // Remove confirmPassword as it's not in the schema
    const { confirmPassword, ...submitData } = data;
    registerMutation.mutate(submitData);
  }

  // Check for Google redirect result on page load
  useEffect(() => {
    async function handleRedirectResult() {
      try {
        setIsGoogleLoading(true);
        const result = await checkRedirectResult();
        
        if (result.success && result.user) {
          // Send the Google user data to our backend
          const res = await apiRequest("POST", "/api/auth/google/token", {
            email: result.user.email,
            displayName: result.user.displayName,
            uid: result.user.uid,
            photoURL: result.user.photoURL
          });
          
          if (res.ok) {
            // Refresh the user data in React Query
            window.location.href = "/";
          } else {
            const error = await res.json();
            toast({
              title: "Authentication Error",
              description: error.message || "Failed to authenticate with Google",
              variant: "destructive"
            });
          }
        }
      } catch (error) {
        console.error("Error handling redirect:", error);
      } finally {
        setIsGoogleLoading(false);
      }
    }
    
    handleRedirectResult();
  }, [toast]);

  // Handle Google login - start the redirect flow
  async function handleGoogleLogin() {
    try {
      setIsGoogleLoading(true);
      const result = await signInWithGoogle();
      
      if (!result.success) {
        // Check if the error is an unauthorized domain error
        if (result.errorCode === 'auth/unauthorized-domain') {
          toast({
            title: "Firebase Configuration Required",
            description: "You need to add this Replit URL to authorized domains in your Firebase project. Please see the Firebase setup guide in the README.",
            variant: "destructive",
            duration: 10000,
          });
        } else {
          toast({
            title: "Google Sign-in Failed",
            description: result.error || "Failed to sign in with Google",
            variant: "destructive"
          });
        }
      }
      // On success, the page will redirect to Google and then back
      // The redirect result is handled in the useEffect above
    } catch (error) {
      toast({
        title: "Authentication Error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
      setIsGoogleLoading(false);
    }
  }

  // Redirect if already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="py-12 bg-neutral-50 min-h-screen">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-sm border border-neutral-100 overflow-hidden">
          <div className="grid md:grid-cols-2">
            {/* Form Section */}
            <div className="p-6 md:p-10">
              <h1 className="text-2xl md:text-3xl font-bold text-neutral-800 mb-6">Welcome to Murang'a Marketplace</h1>
              
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>
                
                {/* Login Form */}
                <TabsContent value="login">
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Enter your password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full bg-primary hover:bg-primary-dark"
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Logging in...
                          </>
                        ) : "Login"}
                      </Button>
                      
                      <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                          <Separator className="w-full" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-white px-2 text-muted-foreground">
                            Or continue with
                          </span>
                        </div>
                      </div>
                      
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="w-full"
                        onClick={handleGoogleLogin}
                        disabled={isGoogleLoading}
                      >
                        {isGoogleLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Connecting to Google...
                          </>
                        ) : (
                          <>
                            <svg 
                              className="mr-2 h-4 w-4" 
                              xmlns="http://www.w3.org/2000/svg" 
                              viewBox="0 0 48 48" 
                              width="16px" 
                              height="16px"
                            >
                              <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                              <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                              <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                              <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
                            </svg>
                            
                            Continue with Google
                          </>
                        )}
                      </Button>
                      
                      <div className="text-xs text-amber-700 mt-2 p-2 bg-amber-50 rounded border border-amber-200">
                        <p className="font-semibold">Google Login Configuration Required</p>
                        <p className="mt-1">To use Google login, you need to add your Replit domain to authorized domains in Firebase. See the README for instructions.</p>
                        <p className="mt-1">Meanwhile, you can use username/password authentication.</p>
                      </div>
                    </form>
                  </Form>
                </TabsContent>
                
                {/* Registration Form */}
                <TabsContent value="register">
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="Create a username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="Enter your email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={registerForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="Create a password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={registerForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirm Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="Confirm your password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={registerForm.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your full name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your phone number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>I am a:</FormLabel>
                            <div className="flex space-x-4">
                              <Button
                                type="button"
                                variant={field.value === "customer" ? "default" : "outline"}
                                className={field.value === "customer" ? "bg-primary text-white" : ""}
                                onClick={() => field.onChange("customer")}
                              >
                                Customer
                              </Button>
                              <Button
                                type="button"
                                variant={field.value === "business" ? "default" : "outline"}
                                className={field.value === "business" ? "bg-primary text-white" : ""}
                                onClick={() => field.onChange("business")}
                              >
                                Business Owner
                              </Button>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full bg-primary hover:bg-primary-dark"
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating Account...
                          </>
                        ) : "Create Account"}
                      </Button>
                      
                      <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                          <Separator className="w-full" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-white px-2 text-muted-foreground">
                            Or continue with
                          </span>
                        </div>
                      </div>
                      
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="w-full"
                        onClick={handleGoogleLogin}
                        disabled={isGoogleLoading}
                      >
                        {isGoogleLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Connecting to Google...
                          </>
                        ) : (
                          <>
                            <svg 
                              className="mr-2 h-4 w-4" 
                              xmlns="http://www.w3.org/2000/svg" 
                              viewBox="0 0 48 48" 
                              width="16px" 
                              height="16px"
                            >
                              <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                              <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                              <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                              <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
                            </svg>
                            
                            Continue with Google
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            </div>
            
            {/* Hero Section */}
            <div className="bg-secondary hero-pattern text-white p-6 md:p-10 flex items-center">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-4">Connect with Local Businesses in Murang'a County</h2>
                <p className="mb-6">Join our community to discover local businesses or list your own services and products.</p>
                
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="bg-white bg-opacity-20 p-2 rounded-full mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Discover Local Services</h3>
                      <p className="text-sm opacity-90">Find farmers, artisans, shops and service providers in Murang'a County.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-white bg-opacity-20 p-2 rounded-full mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Grow Your Business</h3>
                      <p className="text-sm opacity-90">Register your business and reach more customers across the county.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-white bg-opacity-20 p-2 rounded-full mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Easy to Use</h3>
                      <p className="text-sm opacity-90">Simple platform designed for all users, including those with basic smartphones.</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 bg-white bg-opacity-10 rounded-lg p-4">
                  <p className="italic text-sm">
                    "Connecting with local customers has never been easier. This platform has helped me grow my business beyond my village."
                  </p>
                  <p className="text-sm font-medium mt-2">
                    — James Mwangi, Coffee Farmer
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
