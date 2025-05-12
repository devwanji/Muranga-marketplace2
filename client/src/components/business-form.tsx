import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { InsertBusiness, User } from "@shared/schema";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

interface BusinessFormProps {
  categories: { id: number; name: string }[];
  locations: { id: number; name: string }[];
  user: User | null;
}

// Create schema for business form
const businessFormSchema = z.object({
  name: z.string().min(3, "Business name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  categoryId: z.string().min(1, "Please select a category"),
  locationId: z.string().min(1, "Please select a location"),
  address: z.string().optional(),
  phone: z.string().min(10, "Phone number is required"),
  email: z.string().email("Please enter a valid email"),
  websiteUrl: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  imageUrl: z.string().url("Please enter a valid image URL").optional().or(z.literal("")),
});

type BusinessFormValues = z.infer<typeof businessFormSchema>;

export default function BusinessForm({ categories, locations, user }: BusinessFormProps) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const form = useForm<BusinessFormValues>({
    resolver: zodResolver(businessFormSchema),
    defaultValues: {
      name: "",
      description: "",
      categoryId: "",
      locationId: "",
      address: "",
      phone: user?.phone || "",
      email: user?.email || "",
      websiteUrl: "",
      imageUrl: "",
    },
  });

  const registerBusinessMutation = useMutation({
    mutationFn: async (values: BusinessFormValues) => {
      const formattedValues: InsertBusiness = {
        ...values,
        categoryId: parseInt(values.categoryId),
        locationId: parseInt(values.locationId),
        ownerId: user?.id || 0,
      };

      const res = await apiRequest("POST", "/api/businesses", {
        ...formattedValues,
        tags,
      });
      
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Business Registered",
        description: "Your business has been successfully registered!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/businesses"] });
      navigate("/businesses");
    },
    onError: (error: Error) => {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function onSubmit(values: BusinessFormValues) {
    registerBusinessMutation.mutate(values);
  }

  function handleAddTag() {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  }

  function handleRemoveTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-6 md:p-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Name*</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your business name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Description*</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe your business, products, or services" 
                      className="resize-none h-24"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Category*</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem 
                            key={category.id} 
                            value={category.id.toString()}
                          >
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="locationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Location*</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a location" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {locations.map((location) => (
                          <SelectItem 
                            key={location.id} 
                            value={location.id.toString()}
                          >
                            {location.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Street Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your business address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number*</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. +254712345678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address*</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your business email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="websiteUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website URL (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://yourwebsite.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Image URL (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/your-image.jpg" {...field} />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-neutral-500">Enter a URL to an image of your business, products, or services</p>
                </FormItem>
              )}
            />

            {/* Services and Products Tags */}
            <div>
              <label className="block text-sm font-medium">Services & Products Tags</label>
              <div className="mt-1 flex">
                <Input
                  placeholder="Add a service or product tag"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  className="rounded-r-none"
                />
                <Button 
                  type="button" 
                  onClick={handleAddTag}
                  className="rounded-l-none"
                >
                  Add
                </Button>
              </div>
              
              {tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <div key={index} className="bg-neutral-100 rounded-full px-3 py-1 text-sm flex items-center">
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-2 text-neutral-500 hover:text-primary"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <p className="mt-1 text-xs text-neutral-500">Add tags to help customers find your business (e.g. "Coffee Beans", "Farm Tours", "Wholesale")</p>
            </div>

            <div className="pt-4">
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary-dark"
                disabled={registerBusinessMutation.isPending}
              >
                {registerBusinessMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registering Business...
                  </>
                ) : "Register Business"}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
