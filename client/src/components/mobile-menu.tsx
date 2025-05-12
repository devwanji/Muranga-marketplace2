import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { User } from "@shared/schema";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader,
  SheetTitle,
  SheetClose
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { LogOut, User as UserIcon } from "lucide-react";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onLogout: () => void;
}

export default function MobileMenu({ 
  isOpen, 
  onClose,
  user,
  onLogout
}: MobileMenuProps) {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);

  // Sync the open state with the isOpen prop
  useEffect(() => {
    setOpen(isOpen);
  }, [isOpen]);

  // Handle close
  const handleClose = () => {
    setOpen(false);
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="left" className="w-[80%] max-w-sm p-0" onInteractOutside={handleClose}>
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex items-center space-x-2">
            <span className="text-primary font-heading font-bold">Murang'a</span>
            <span className="text-secondary font-heading font-bold">Marketplace</span>
          </SheetTitle>
        </SheetHeader>
        
        {user && (
          <div className="p-4 border-b bg-neutral-50">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center">
                <UserIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">{user.username}</p>
                <p className="text-sm text-neutral-500 capitalize">{user.role}</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="pt-2 pb-3 space-y-1">
          <SheetClose asChild>
            <Link 
              href="/" 
              className={`block px-4 py-2 text-base font-medium ${
                location === "/" 
                  ? "text-primary border-l-4 border-primary" 
                  : "text-neutral-700 hover:text-primary hover:border-primary border-l-4 border-transparent"
              }`}
            >
              Home
            </Link>
          </SheetClose>
          
          <SheetClose asChild>
            <Link 
              href="/businesses" 
              className={`block px-4 py-2 text-base font-medium ${
                location === "/businesses" 
                  ? "text-primary border-l-4 border-primary" 
                  : "text-neutral-700 hover:text-primary hover:border-primary border-l-4 border-transparent"
              }`}
            >
              Businesses
            </Link>
          </SheetClose>
          
          <SheetClose asChild>
            <Link 
              href="/subscribe" 
              className={`block px-4 py-2 text-base font-medium ${
                location === "/subscribe" 
                  ? "text-primary border-l-4 border-primary" 
                  : "text-neutral-700 hover:text-primary hover:border-primary border-l-4 border-transparent"
              }`}
            >
              Subscribe
            </Link>
          </SheetClose>
          
          <SheetClose asChild>
            <Link 
              href="/register-business" 
              className={`block px-4 py-2 text-base font-medium ${
                location === "/register-business" 
                  ? "text-primary border-l-4 border-primary" 
                  : "text-neutral-700 hover:text-primary hover:border-primary border-l-4 border-transparent"
              }`}
            >
              Register Business
            </Link>
          </SheetClose>
          
          {user && user.role === "business" && (
            <SheetClose asChild>
              <Link 
                href="/my-businesses" 
                className={`block px-4 py-2 text-base font-medium ${
                  location === "/my-businesses" 
                    ? "text-primary border-l-4 border-primary" 
                    : "text-neutral-700 hover:text-primary hover:border-primary border-l-4 border-transparent"
                }`}
              >
                My Businesses
              </Link>
            </SheetClose>
          )}
        </div>

        <div className="border-t pt-4 px-4">
          {user ? (
            <SheetClose asChild>
              <Button 
                variant="outline" 
                className="w-full justify-start text-red-600 border-red-200"
                onClick={onLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </SheetClose>
          ) : (
            <div className="flex flex-col space-y-2">
              <SheetClose asChild>
                <Link href="/auth">
                  <Button 
                    variant="outline" 
                    className="w-full text-primary border-primary"
                  >
                    Login
                  </Button>
                </Link>
              </SheetClose>
              
              <SheetClose asChild>
                <Link href="/auth">
                  <Button 
                    className="w-full bg-primary hover:bg-primary-dark text-white"
                  >
                    Register
                  </Button>
                </Link>
              </SheetClose>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
