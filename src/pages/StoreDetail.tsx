import { useEffect, useState, useMemo } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Star, Clock, MapPin, ArrowLeft, Plus, Minus, Percent, Search } from "lucide-react";
import Navbar from "@/components/Navbar";
import ProductRequestForm from "@/components/ProductRequestForm";
import StoreReviews from "@/components/StoreReviews";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { formatStoreTime, isStoreOpenNow } from "@/utils/storeHours";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  in_stock: boolean;
  offer_percentage: number | null;
  offer_price: number | null;
  offer_active: boolean | null;
}

interface Store {
  id: string;
  name: string;
  category: string;
  image_url: string;
  address: string;
  phone: string;
  rating: number;
  delivery_time: string;
  is_open: boolean;
  opening_time?: string | null;
  closing_time?: string | null;
}

const StoreDetail = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedProductId, setHighlightedProductId] = useState<string | null>(null);

  useEffect(() => {
    // Pre-fill search from URL params
    const searchParam = searchParams.get("search");
    if (searchParam) setSearchQuery(searchParam);
    const highlightParam = searchParams.get("highlight");
    if (highlightParam) setHighlightedProductId(highlightParam);
  }, [searchParams]);

  useEffect(() => {
    if (id) {
      fetchStoreAndProducts();
    }
    const savedCart = JSON.parse(localStorage.getItem("cart") || "[]");
    setCart(savedCart);
  }, [id]);

  // Scroll to highlighted product once products load
  useEffect(() => {
    if (highlightedProductId && products.length > 0) {
      const el = document.getElementById(`product-${highlightedProductId}`);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 300);
        // Remove highlight after 3 seconds
        setTimeout(() => setHighlightedProductId(null), 4000);
      }
    }
  }, [highlightedProductId, products]);

  const fetchStoreAndProducts = async () => {
    setLoading(true);
    
    const { data: storeData } = await supabase
      .from("stores")
      .select("*")
      .eq("id", id)
      .single();

    const { data: productsData } = await supabase
      .from("products")
      .select("*")
      .eq("store_id", id);

    if (storeData) setStore(storeData);
    if (productsData) setProducts(productsData);
    
    setLoading(false);
  };

  const getProductQuantity = (productId: string) => {
    const item = cart.find((item) => item.id === productId);
    return item ? item.quantity : 0;
  };

  const updateCart = (product: Product, change: number) => {
    if (!store || !isStoreOpenNow(store)) {
      toast.error("Store is currently closed. Ordering is paused.");
      return;
    }

    const newCart = [...cart];
    const existingIndex = newCart.findIndex((item) => item.id === product.id);

    if (existingIndex > -1) {
      newCart[existingIndex].quantity += change;
      if (newCart[existingIndex].quantity <= 0) {
        newCart.splice(existingIndex, 1);
        toast.success(`${product.name} removed from cart`);
      }
    } else if (change > 0) {
      const effectivePrice = product.offer_active && product.offer_price 
        ? product.offer_price 
        : product.price;
      newCart.push({
        ...product,
        price: effectivePrice,
        originalPrice: product.price,
        quantity: 1,
        storeId: id,
        storeName: store?.name,
      });
      toast.success(`${product.name} added to cart`);
    }

    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
    window.dispatchEvent(new Event("cartUpdate"));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-48 mb-8" />
          <Skeleton className="h-64 w-full mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-80" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground">Store not found</p>
          <Link to="/stores">
            <Button className="mt-4">Back to Stores</Button>
          </Link>
        </div>
      </div>
    );
  }

  const storeOpenNow = isStoreOpenNow(store);
  const opening = formatStoreTime(store.opening_time) ?? "—";
  const closing = formatStoreTime(store.closing_time) ?? "—";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <Link to="/stores">
          <Button variant="ghost" className="mb-6 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Stores
          </Button>
        </Link>

        {/* Store Header */}
        <Card className="mb-8 overflow-hidden animate-fade-in">
          <div className="relative h-48 md:h-64">
            <img
              src={store.image_url}
              alt={store.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <h1 className="text-3xl md:text-4xl font-outfit font-bold mb-2">
                {store.name}
              </h1>
              <div className="flex flex-wrap gap-3 text-sm">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-primary text-primary" />
                  <span>{store.rating}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{store.delivery_time}</span>
                </div>
                <Badge className="bg-primary text-primary-foreground capitalize">
                  {store.category}
                </Badge>
                <Badge
                  variant={storeOpenNow ? "secondary" : "destructive"}
                  className={storeOpenNow ? "bg-primary/20 text-primary" : undefined}
                >
                  {storeOpenNow ? "Open now" : "Closed"}
                </Badge>
              </div>
            </div>
          </div>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{store.address}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-primary" />
              <span className="text-foreground font-medium">Opening Hours: {opening} - {closing}</span>
            </div>
            {!storeOpenNow && (
              <p className="text-sm text-muted-foreground">
                This store is currently closed. You can browse items, but adding to cart is disabled.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Products */}
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-2xl font-outfit font-bold">Menu</h2>
            <p className="text-muted-foreground">Available products</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products
            .filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.category?.toLowerCase().includes(searchQuery.toLowerCase())))
            .map((product, index) => {
            const quantity = getProductQuantity(product.id);
            return (
              <Card
                key={product.id}
                id={`product-${product.id}`}
                className={`overflow-hidden group hover:shadow-lg transition-all animate-scale-in ${
                  highlightedProductId === product.id
                    ? "ring-2 ring-primary ring-offset-2 shadow-xl scale-[1.02]"
                    : ""
                }`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  {product.offer_active && product.offer_percentage && (
                    <div className="absolute top-2 right-2 bg-destructive text-destructive-foreground px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                      <Percent className="w-3 h-3" />
                      {product.offer_percentage}% OFF
                    </div>
                  )}
                  {!product.in_stock && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Badge variant="destructive">Out of Stock</Badge>
                    </div>
                  )}
                </div>

                <CardContent className="p-4 space-y-3">
                  <div>
                    <h3 className="font-outfit font-semibold text-lg">
                      {product.name}
                    </h3>
                    {product.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {product.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {product.offer_active && product.offer_price ? (
                        <>
                          <span className="text-sm text-muted-foreground line-through">
                            ₹{product.price}
                          </span>
                          <span className="text-lg font-bold text-primary">
                            ₹{product.offer_price}
                          </span>
                        </>
                      ) : (
                        <span className="text-lg font-bold text-primary">
                          ₹{product.price}
                        </span>
                      )}
                    </div>

                    {product.in_stock && (
                      <div className="flex items-center gap-2">
                        {quantity === 0 ? (
                          <Button
                            size="sm"
                            onClick={() => updateCart(product, 1)}
                            className="gap-1"
                            disabled={!storeOpenNow}
                          >
                            <Plus className="w-4 h-4" />
                            Add
                          </Button>
                        ) : (
                          <div className="flex items-center gap-2 bg-secondary rounded-lg px-2 py-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => updateCart(product, -1)}
                              disabled={!storeOpenNow}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <span className="font-semibold min-w-[20px] text-center">
                              {quantity}
                            </span>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => updateCart(product, 1)}
                              disabled={!storeOpenNow}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {products.length === 0 && (
          <div className="text-center py-12 animate-fade-in">
            <p className="text-muted-foreground text-lg">
              No products available at the moment.
            </p>
          </div>
        )}

        {/* Product Request Form */}
        <div className="mt-8">
          <ProductRequestForm storeId={id} storeName={store?.name} />
        </div>

        {/* Reviews Section */}
        <div className="mt-8">
          <StoreReviews storeId={id!} />
        </div>
      </div>

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-bounce-slow">
          <Link to="/cart">
            <Button size="lg" className="shadow-xl gap-2 px-8">
              View Cart ({cart.reduce((acc, item) => acc + item.quantity, 0)} items)
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default StoreDetail;
