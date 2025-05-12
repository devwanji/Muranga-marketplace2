import { Link } from "wouter";
import { Facebook, Twitter, Instagram, MapPin, Mail, Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Footer() {
  return (
    <footer className="bg-neutral-800 text-white pt-12 pb-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Company Info */}
          <div>
            <h3 className="font-heading font-bold text-xl mb-4">Murang'a Marketplace</h3>
            <p className="text-neutral-300 mb-4">Connecting local businesses with customers across Murang'a County.</p>
            <div className="flex space-x-4">
              <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer" className="text-neutral-300 hover:text-white">
                <Facebook className="h-6 w-6" />
              </a>
              <a href="https://www.twitter.com" target="_blank" rel="noopener noreferrer" className="text-neutral-300 hover:text-white">
                <Twitter className="h-6 w-6" />
              </a>
              <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" className="text-neutral-300 hover:text-white">
                <Instagram className="h-6 w-6" />
              </a>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h3 className="font-heading font-bold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-neutral-300 hover:text-white">Home</Link>
              </li>
              <li>
                <Link href="/businesses" className="text-neutral-300 hover:text-white">Businesses</Link>
              </li>
              <li>
                <Link href="/register-business" className="text-neutral-300 hover:text-white">Register Business</Link>
              </li>
              <li>
                <a href="#" className="text-neutral-300 hover:text-white">About Us</a>
              </li>
              <li>
                <a href="#" className="text-neutral-300 hover:text-white">Contact</a>
              </li>
            </ul>
          </div>
          
          {/* For Businesses */}
          <div>
            <h3 className="font-heading font-bold text-lg mb-4">For Businesses</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/register-business" className="text-neutral-300 hover:text-white">Register Your Business</Link>
              </li>
              <li>
                <Link href="/auth" className="text-neutral-300 hover:text-white">Business Dashboard</Link>
              </li>
              <li>
                <a href="#" className="text-neutral-300 hover:text-white">Pricing</a>
              </li>
              <li>
                <a href="#" className="text-neutral-300 hover:text-white">Success Stories</a>
              </li>
              <li>
                <a href="#" className="text-neutral-300 hover:text-white">Business Resources</a>
              </li>
            </ul>
          </div>
          
          {/* Contact */}
          <div>
            <h3 className="font-heading font-bold text-lg mb-4">Contact Us</h3>
            <ul className="space-y-2 text-neutral-300">
              <li className="flex items-start">
                <MapPin className="h-5 w-5 mr-2 mt-0.5 text-neutral-400" />
                <span>Murang'a County, Kenya</span>
              </li>
              <li className="flex items-start">
                <Mail className="h-5 w-5 mr-2 mt-0.5 text-neutral-400" />
                <span>info@muranga-marketplace.co.ke</span>
              </li>
              <li className="flex items-start">
                <Phone className="h-5 w-5 mr-2 mt-0.5 text-neutral-400" />
                <span>+254 712 345 678</span>
              </li>
            </ul>
            <div className="mt-4">
              <h4 className="font-medium text-sm mb-2">Subscribe to our newsletter</h4>
              <form className="flex">
                <Input 
                  type="email" 
                  placeholder="Your email" 
                  className="px-3 py-2 text-sm bg-neutral-700 text-white rounded-l-md focus:outline-none w-full border-0"
                />
                <Button type="submit" className="bg-primary hover:bg-primary-dark text-white rounded-r-md rounded-l-none text-sm">
                  Subscribe
                </Button>
              </form>
            </div>
          </div>
        </div>
        
        <div className="border-t border-neutral-700 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-neutral-400 text-sm">&copy; {new Date().getFullYear()} Murang'a Marketplace. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-neutral-400 hover:text-white text-sm">Privacy Policy</a>
            <a href="#" className="text-neutral-400 hover:text-white text-sm">Terms of Service</a>
            <a href="#" className="text-neutral-400 hover:text-white text-sm">Sitemap</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
