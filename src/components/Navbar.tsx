import { ShoppingCart, User, Menu, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import beeMascot from "@/assets/bee-mascot.png";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { onAuthStateChanged, User as FirebaseUser, signOut } from "firebase/auth";
import { auth } from "@/integrations/firebase/config";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const fetchProfile = async (userId: string) => {
    // Check admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    setIsAdmin(!!roleData);

    // Get profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("user_id", userId)
      .maybeSingle();
    setProfileName(profileData?.full_name || null);
    setAvatarUrl(profileData?.avatar_url || null);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        fetchProfile(firebaseUser.uid);
      } else {
        setIsAdmin(false);
        setProfileName(null);
        setAvatarUrl(null);
      }
    });

    // Listen for profile updates
    const handleProfileUpdate = () => {
      if (user?.uid) fetchProfile(user.uid);
    };
    window.addEventListener("profileUpdate", handleProfileUpdate);

    return () => {
      unsubscribe();
      window.removeEventListener("profileUpdate", handleProfileUpdate);
    };
  }, [user?.uid]);

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    setCartCount(cart.reduce((acc: number, item: any) => acc + item.quantity, 0));
    
    const handleStorageChange = () => {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      setCartCount(cart.reduce((acc: number, item: any) => acc + item.quantity, 0));
    };
    
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("cartUpdate", handleStorageChange);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("cartUpdate", handleStorageChange);
    };
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
  };

  const getInitials = (name: string | null) => {
    if (!name) return null;
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const displayName = profileName || user?.displayName || user?.email?.split("@")[0] || "User";


  return (
    <nav className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <img src={beeMascot} alt="Carry Bee" className="w-10 h-10 animate-bounce-slow" />
            <span className="text-xl font-outfit font-bold text-foreground group-hover:text-primary transition-colors">
              Kunnathur Carry Bee
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link to="/stores" className="text-sm font-medium hover:text-primary transition-colors">
              Stores
            </Link>
            <Link to="/orders" className="text-sm font-medium hover:text-primary transition-colors">
              Orders
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-scale-in">
                    {cartCount}
                  </span>
                )}
              </Button>
            </Link>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Avatar className="w-7 h-7">
                      <AvatarImage src={user.photoURL || avatarUrl || undefined} alt={displayName} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {getInitials(profileName || user.displayName) || <User className="w-4 h-4" />}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline max-w-[100px] truncate">
                      {displayName}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to="/profile">My Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/orders">My Orders</Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          Admin Panel
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/auth">
                <Button size="sm" className="font-medium">
                  Login
                </Button>
              </Link>
            )}

            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
