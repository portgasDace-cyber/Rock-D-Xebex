import { useEffect, useState } from "react";
import { StoreAdminLayout } from "@/components/store-admin/StoreAdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, Edit, Search, IndianRupee } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useStoreAdmin } from "@/hooks/useStoreAdmin";

interface ProductData {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string | null;
  in_stock: boolean;
  offer_active: boolean;
  offer_percentage: number | null;
  offer_price: number | null;
}

const StoreAdminProducts = () => {
  const { storeAdminInfo } = useStoreAdmin();
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<ProductData | null>(null);
  const [editData, setEditData] = useState({
    price: 0,
    in_stock: true,
    offer_active: false,
    offer_percentage: 0,
  });
  const [updating, setUpdating] = useState(false);

  const fetchProducts = async () => {
    if (!storeAdminInfo?.store_id) return;

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("store_id", storeAdminInfo.store_id)
      .order("name");

    if (!error) {
      setProducts(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, [storeAdminInfo?.store_id]);

  const handleEdit = (product: ProductData) => {
    setSelectedProduct(product);
    setEditData({
      price: product.price,
      in_stock: product.in_stock ?? true,
      offer_active: product.offer_active ?? false,
      offer_percentage: product.offer_percentage ?? 0,
    });
  };

  const handleUpdate = async () => {
    if (!selectedProduct) return;

    setUpdating(true);

    const offerPrice = editData.offer_active && editData.offer_percentage > 0
      ? editData.price - (editData.price * editData.offer_percentage / 100)
      : null;

    const { error } = await supabase
      .from("products")
      .update({
        price: editData.price,
        in_stock: editData.in_stock,
        offer_active: editData.offer_active,
        offer_percentage: editData.offer_active ? editData.offer_percentage : null,
        offer_price: offerPrice,
      })
      .eq("id", selectedProduct.id);

    if (error) {
      toast.error("Failed to update product");
      setUpdating(false);
      return;
    }

    toast.success("Product updated successfully");
    setUpdating(false);
    setSelectedProduct(null);
    fetchProducts();
  };

  const toggleStock = async (productId: string, currentStock: boolean) => {
    const { error } = await supabase
      .from("products")
      .update({ in_stock: !currentStock })
      .eq("id", productId);

    if (error) {
      toast.error("Failed to update stock status");
      return;
    }

    toast.success(`Product marked as ${!currentStock ? "In Stock" : "Out of Stock"}`);
    fetchProducts();
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <StoreAdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-outfit font-bold">Products</h1>
            <p className="text-muted-foreground">Manage your store's product prices and stock</p>
          </div>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Your Products ({filteredProducts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Loading...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No products found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Offer</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {product.image_url && (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          )}
                          <span className="font-medium">{product.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {product.category || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <IndianRupee className="w-3 h-3" />
                          <span className={product.offer_active ? "line-through text-muted-foreground" : "font-bold"}>
                            {product.price}
                          </span>
                          {product.offer_active && product.offer_price && (
                            <span className="font-bold text-primary ml-2">₹{product.offer_price.toFixed(0)}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {product.offer_active ? (
                          <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-medium">
                            {product.offer_percentage}% OFF
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={product.in_stock ?? true}
                          onCheckedChange={() => toggleStock(product.id, product.in_stock ?? true)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(product)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Edit Product Dialog */}
        <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Product: {selectedProduct?.name}</DialogTitle>
            </DialogHeader>
            {selectedProduct && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="price">Price (₹)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={editData.price}
                    onChange={(e) => setEditData({ ...editData, price: Number(e.target.value) })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="in_stock">In Stock</Label>
                  <Switch
                    id="in_stock"
                    checked={editData.in_stock}
                    onCheckedChange={(checked) => setEditData({ ...editData, in_stock: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="offer_active">Offer Active</Label>
                  <Switch
                    id="offer_active"
                    checked={editData.offer_active}
                    onCheckedChange={(checked) => setEditData({ ...editData, offer_active: checked })}
                  />
                </div>

                {editData.offer_active && (
                  <div>
                    <Label htmlFor="offer_percentage">Offer Percentage (%)</Label>
                    <Input
                      id="offer_percentage"
                      type="number"
                      min="1"
                      max="100"
                      value={editData.offer_percentage}
                      onChange={(e) => setEditData({ ...editData, offer_percentage: Number(e.target.value) })}
                    />
                    {editData.offer_percentage > 0 && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Offer Price: ₹{(editData.price - (editData.price * editData.offer_percentage / 100)).toFixed(0)}
                      </p>
                    )}
                  </div>
                )}

                <Button onClick={handleUpdate} className="w-full" disabled={updating}>
                  {updating ? "Updating..." : "Update Product"}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </StoreAdminLayout>
  );
};

export default StoreAdminProducts;
