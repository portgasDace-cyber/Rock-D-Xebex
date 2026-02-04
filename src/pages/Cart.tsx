import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Plus, Minus, Trash2, ArrowLeft, ShoppingBag, MapPin, Loader2, QrCode, Check } from "lucide-react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import paymentQR from "@/assets/payment-qr.jpeg";
import { isStoreOpenNow } from "@/utils/storeHours";

// Calculate distance between two points using Haversine formula (returns km)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Calculate delivery fee based on distance (₹10 per km)
const calculateDeliveryFee = (distanceKm: number): number => {
  const fee = Math.ceil(distanceKm) * 10;
  return fee > 0 ? fee : 10; // Minimum ₹10 for very short distances
};

const Cart = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [storeLocation, setStoreLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [deliveryFee, setDeliveryFee] = useState(20);
  const [distance, setDistance] = useState<number | null>(null);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setLocation(newLocation);
        toast.success("Location captured successfully!");
        setLocationLoading(false);
        
        // Calculate delivery fee if store location is available
        if (storeLocation) {
          const dist = calculateDistance(
            newLocation.lat, 
            newLocation.lng, 
            storeLocation.lat, 
            storeLocation.lng
          );
          setDistance(dist);
          setDeliveryFee(calculateDeliveryFee(dist));
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        let errorMessage = "Unable to get your location.";
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission denied. Please enable location access in your browser settings.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable. Please try again.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out. Please try again.";
            break;
        }
        toast.error(errorMessage);
        setLocationLoading(false);
      },
      { 
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem("cart") || "[]");
    setCart(savedCart);

    const fetchUserAndProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      // Auto-fill from saved profile
      if (session?.user) {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("phone, address")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (error && error.code !== "PGRST116") {
          console.error("Error fetching profile:", error);
        }

        if (profile) {
          if (profile.phone && !phone) setPhone(profile.phone);
          if (profile.address && !address) setAddress(profile.address);
        }
      }
    };

    fetchUserAndProfile();

    // Fetch store location for delivery fee calculation
    if (savedCart.length > 0) {
      const storeId = savedCart[0].storeId;
      supabase
        .from("stores")
        .select("latitude, longitude")
        .eq("id", storeId)
        .single()
        .then(({ data }) => {
          if (data?.latitude && data?.longitude) {
            setStoreLocation({ lat: Number(data.latitude), lng: Number(data.longitude) });
          }
        });
    }
  }, []);

  // Recalculate delivery fee when location or store location changes
  useEffect(() => {
    if (location && storeLocation) {
      const dist = calculateDistance(
        location.lat, 
        location.lng, 
        storeLocation.lat, 
        storeLocation.lng
      );
      setDistance(dist);
      setDeliveryFee(calculateDeliveryFee(dist));
    }
  }, [location, storeLocation]);

  const updateQuantity = (productId: string, change: number) => {
    const newCart = cart.map((item) => {
      if (item.id === productId) {
        const newQuantity = item.quantity + change;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
      }
      return item;
    }).filter(Boolean);

    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
    window.dispatchEvent(new Event("cartUpdate"));
  };

  const removeItem = (productId: string) => {
    const newCart = cart.filter((item) => item.id !== productId);
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
    window.dispatchEvent(new Event("cartUpdate"));
    toast.success("Item removed from cart");
  };

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const handleProceedToPayment = () => {
    // Prevent orders when a store is closed
    const ensureStoresOpen = async () => {
      const storeIds = Array.from(new Set(cart.map((i) => i.storeId).filter(Boolean)));
      if (storeIds.length === 0) return { ok: true as const };

      const { data, error } = await supabase
        .from("stores")
        .select("id,name,opening_time,closing_time,is_open")
        .in("id", storeIds);

      if (error || !data) return { ok: true as const }; // fail-open (don’t block due to fetch issues)

      const closed = data.filter((s) => !isStoreOpenNow(s));
      if (closed.length === 0) return { ok: true as const };

      return {
        ok: false as const,
        names: closed.map((s) => s.name).slice(0, 3),
      };
    };

    // Wrap the existing sync handler flow
    const run = async () => {
      const res = await ensureStoresOpen();
      if (!res.ok) {
        toast.error(`Store closed: ${res.names.join(", ")}. Please try again later.`);
        return;
      }

      if (!user) {
        toast.error("Please login to place an order");
        navigate("/auth");
        return;
      }

      if (!address || !phone) {
        toast.error("Please fill in all delivery details");
        return;
      }

      if (!location) {
        toast.error("Please share your location for delivery");
        return;
      }

      if (cart.length === 0) {
        toast.error("Your cart is empty");
        return;
      }

      // Open UPI payment link with amount
      const totalAmount = getTotalAmount() + deliveryFee;
      const upiId = "9787141556-1@okbizaxis";
      const payeeName = "Kunnathur Carry Bee";
      const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${totalAmount}&cu=INR`;

      // Try to open UPI app, then show modal
      window.open(upiLink, "_blank");
      setShowPaymentModal(true);
    };

    void run();
  };

  const handleConfirmPayment = async () => {
    setPaymentConfirmed(true);
    setShowPaymentModal(false);
    await handlePlaceOrder();
  };

  const handlePlaceOrder = async () => {
    setLoading(true);

    try {
      // Group items by store
      const storeGroups: Record<string, any[]> = cart.reduce((acc, item) => {
        if (!acc[item.storeId]) {
          acc[item.storeId] = [];
        }
        acc[item.storeId].push(item);
        return acc;
      }, {} as Record<string, any[]>);

      // Create an order for each store
      for (const [storeId, items] of Object.entries(storeGroups)) {
        const storeTotal = (items as any[]).reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );

        const totalWithDelivery = storeTotal + deliveryFee;

        // Get store name
        const { data: storeData } = await supabase
          .from("stores")
          .select("name")
          .eq("id", storeId)
          .single();

        const { data: order, error: orderError } = await supabase
          .from("orders")
          .insert({
            user_id: user.id,
            store_id: storeId,
            total_amount: totalWithDelivery,
            delivery_address: address,
            phone: phone,
            status: "pending",
            latitude: location!.lat,
            longitude: location!.lng,
          })
          .select()
          .single();

        if (orderError) throw orderError;

        // Create order items
        const orderItems = (items as any[]).map((item) => ({
          order_id: order.id,
          product_id: item.id,
          quantity: item.quantity,
          price: item.price,
        }));

        const { error: itemsError } = await supabase
          .from("order_items")
          .insert(orderItems);

        if (itemsError) throw itemsError;

        // Send email notification
        try {
          await supabase.functions.invoke("send-order-email", {
            body: {
              customerEmail: user.email,
              customerPhone: phone,
              deliveryAddress: address,
              storeName: storeData?.name || "Store",
              totalAmount: totalWithDelivery,
              deliveryFee: deliveryFee,
              distance: distance ? distance.toFixed(2) : "N/A",
              latitude: location!.lat,
              longitude: location!.lng,
              orderItems: (items as any[]).map((item) => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price * item.quantity,
              })),
              orderId: order.id,
            },
          });
          console.log("Order email sent successfully");
        } catch (emailError) {
          console.error("Failed to send order email:", emailError);
        }
      }

      // Clear cart
      setCart([]);
      localStorage.removeItem("cart");
      window.dispatchEvent(new Event("cartUpdate"));

      toast.success("Order placed successfully!");
      navigate("/orders");
    } catch (error: any) {
      console.error("Error placing order:", error);
      toast.error("Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16">
          <div className="text-center space-y-6 animate-fade-in">
            <ShoppingBag className="w-24 h-24 mx-auto text-muted-foreground" />
            <h2 className="text-3xl font-outfit font-bold">Your cart is empty</h2>
            <p className="text-muted-foreground">
              Add some items from local stores to get started
            </p>
            <Link to="/stores">
              <Button size="lg">Browse Stores</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <Link to="/stores">
          <Button variant="ghost" className="mb-6 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Continue Shopping
          </Button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <h1 className="text-3xl font-outfit font-bold mb-6">Your Cart</h1>

            {cart.map((item) => (
              <Card key={item.id} className="animate-fade-in">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-24 h-24 object-cover rounded-lg"
                    />

                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="font-outfit font-semibold text-lg">
                            {item.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {item.storeName}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-primary">
                          ₹{item.price * item.quantity}
                        </span>

                        <div className="flex items-center gap-2 bg-secondary rounded-lg px-2 py-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, -1)}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="font-semibold min-w-[30px] text-center">
                            {item.quantity}
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, 1)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <Card className="sticky top-24">
              <CardContent className="p-6 space-y-6">
                <h2 className="text-xl font-outfit font-bold">Order Summary</h2>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">₹{getTotalAmount()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Delivery Fee {distance && `(${distance.toFixed(1)} km)`}
                    </span>
                    <span className="font-medium">₹{deliveryFee}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold text-lg text-primary">
                      ₹{getTotalAmount() + deliveryFee}
                    </span>
                  </div>
                </div>

                <div className="space-y-4 border-t pt-6">
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    {phone ? (
                      <div className="mt-1 flex items-center justify-between p-3 bg-muted rounded-md">
                        <span className="font-medium">{phone}</span>
                        <Link to="/profile" className="text-xs text-primary hover:underline">
                          Edit in Profile
                        </Link>
                      </div>
                    ) : (
                      <div className="mt-1 p-3 bg-muted/50 rounded-md text-center">
                        <p className="text-sm text-muted-foreground mb-2">No phone number saved</p>
                        <Link to="/profile">
                          <Button variant="outline" size="sm">Add in Profile</Button>
                        </Link>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="address">Delivery Address</Label>
                    {address ? (
                      <div className="mt-1 space-y-2">
                        <Textarea
                          id="address"
                          value={address}
                          disabled
                          className="bg-muted"
                          rows={3}
                        />
                        <Link to="/profile" className="text-xs text-primary hover:underline inline-block">
                          Edit in Profile
                        </Link>
                      </div>
                    ) : (
                      <div className="mt-1 p-3 bg-muted/50 rounded-md text-center">
                        <p className="text-sm text-muted-foreground mb-2">No address saved</p>
                        <Link to="/profile">
                          <Button variant="outline" size="sm">Add in Profile</Button>
                        </Link>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label>Delivery Location</Label>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full mt-1 gap-2"
                      onClick={getCurrentLocation}
                      disabled={locationLoading}
                    >
                      {locationLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <MapPin className="w-4 h-4" />
                      )}
                      {location
                        ? "Location Captured ✓"
                        : "Share Current Location"}
                    </Button>
                    {location && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Lat: {location.lat.toFixed(6)}, Lng: {location.lng.toFixed(6)}
                      </p>
                    )}
                  </div>
                </div>

                <Button
                  className="w-full gap-2"
                  size="lg"
                  onClick={handleProceedToPayment}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Placing Order...
                    </>
                  ) : (
                    <>
                      <QrCode className="w-4 h-4" />
                      Proceed to Payment
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Payment QR Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-outfit">
              Scan & Pay ₹{getTotalAmount() + deliveryFee}
            </DialogTitle>
            <DialogDescription className="text-center">
              Scan the QR code below using any UPI app to complete payment
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center space-y-4">
            <div className="bg-white p-4 rounded-xl shadow-lg">
              <img 
                src={paymentQR} 
                alt="Payment QR Code" 
                className="w-64 h-auto rounded-lg"
              />
            </div>
            
            <div className="text-center space-y-1">
              <p className="text-sm text-muted-foreground">UPI ID</p>
              <p className="font-mono font-semibold">9787141556-1@okbizaxis</p>
            </div>

            <div className="w-full space-y-3 pt-4">
              <Button 
                className="w-full gap-2" 
                size="lg"
                onClick={handleConfirmPayment}
              >
                <Check className="w-4 h-4" />
                I have completed the payment
              </Button>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => setShowPaymentModal(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Cart;