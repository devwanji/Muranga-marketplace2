import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import MobileMenu from "@/components/mobile-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, User } from "lucide-react";

export default function Header() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-primary font-heading font-bold text-xl md:text-2xl">Murang'a</span>
            <span className="text-secondary font-heading font-bold text-xl md:text-2xl">Marketplace</span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/" className={`${location === '/' ? 'text-primary' : 'text-neutral-700 hover:text-primary'} font-medium`}>
              Home
            </Link>
            <Link href="/businesses" className={`${location === '/businesses' ? 'text-primary' : 'text-neutral-700 hover:text-primary'} font-medium`}>
              Businesses
            </Link>
            <Link href="/subscribe" className={`${location === '/subscribe' ? 'text-primary' : 'text-neutral-700 hover:text-primary'} font-medium`}>
              Subscribe
            </Link>
            <Link href="/register-business" className={`${location === '/register-business' ? 'text-primary' : 'text-neutral-700 hover:text-primary'} font-medium`}>
              Register Business
            </Link>
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    {user.username}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {user.role === "business" && (
                    <DropdownMenuItem asChild>
                      <Link href="/my-businesses" className="cursor-pointer">My Businesses</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex space-x-3">
                <Link href="/auth">
                  <Button variant="outline" className="px-4 py-2 text-sm font-medium text-primary border-primary hover:bg-primary hover:text-white">
                    Login
                  </Button>
                </Link>
                <Link href="/auth">
                  <Button className="px-4 py-2 text-sm font-medium bg-primary text-white hover:bg-primary-dark">
                    Register
                  </Button>
                </Link>
              </div>
            )}
          </nav>
          
          {/* Mobile Menu Button */}
          <button 
            type="button" 
            className="md:hidden text-neutral-700"
            onClick={toggleMobileMenu}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
        
        {/* Mobile Navigation */}
        <MobileMenu 
          isOpen={isMobileMenuOpen} 
          onClose={() => setIsMobileMenuOpen(false)}
          user={user}
          onLogout={handleLogout}
        />
      </div>
    </header>
  );
}
