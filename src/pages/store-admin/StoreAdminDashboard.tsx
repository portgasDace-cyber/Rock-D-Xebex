import { useEffect, useState } from "react";
import { StoreAdminLayout } from "@/components/store-admin/StoreAdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Clock, Truck, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useStoreAdmin } from "@/hooks/useStoreAdmin";
import { StoreAdminNotificationToggle } from "@/components/store-admin/StoreAdminNotificationToggle";
 
 const StoreAdminDashboard = () => {
   const { storeAdminInfo } = useStoreAdmin();
   const [stats, setStats] = useState({
     pending: 0,
     accepted: 0,
     outForDelivery: 0,
     delivered: 0,
   });
 
   useEffect(() => {
     const fetchStats = async () => {
       if (!storeAdminInfo?.store_id) return;
 
       const { data } = await supabase
         .from("orders")
         .select("status")
         .eq("store_id", storeAdminInfo.store_id);
 
       if (data) {
         setStats({
           pending: data.filter((o) => o.status === "pending").length,
           accepted: data.filter((o) => o.status === "accepted").length,
           outForDelivery: data.filter((o) => o.status === "out_for_delivery").length,
           delivered: data.filter((o) => o.status === "delivered").length,
         });
       }
     };
 
     fetchStats();
   }, [storeAdminInfo]);
 
   return (
     <StoreAdminLayout>
       <div className="space-y-6">
         <div>
           <h1 className="text-3xl font-outfit font-bold">Dashboard</h1>
           <p className="text-muted-foreground">
             Welcome to {storeAdminInfo?.stores?.name || "your store"} admin panel
          </p>
          </div>

          <StoreAdminNotificationToggle />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
           <Card className="bg-orange-50 dark:bg-orange-950/20 border-orange-200">
             <CardHeader className="flex flex-row items-center justify-between pb-2">
               <CardTitle className="text-sm font-medium text-orange-700">Pending</CardTitle>
               <Clock className="w-4 h-4 text-orange-600" />
             </CardHeader>
             <CardContent>
               <div className="text-2xl font-bold text-orange-700">{stats.pending}</div>
             </CardContent>
           </Card>
 
           <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200">
             <CardHeader className="flex flex-row items-center justify-between pb-2">
               <CardTitle className="text-sm font-medium text-blue-700">Accepted</CardTitle>
               <ShoppingCart className="w-4 h-4 text-blue-600" />
             </CardHeader>
             <CardContent>
               <div className="text-2xl font-bold text-blue-700">{stats.accepted}</div>
             </CardContent>
           </Card>
 
           <Card className="bg-purple-50 dark:bg-purple-950/20 border-purple-200">
             <CardHeader className="flex flex-row items-center justify-between pb-2">
               <CardTitle className="text-sm font-medium text-purple-700">Out for Delivery</CardTitle>
               <Truck className="w-4 h-4 text-purple-600" />
             </CardHeader>
             <CardContent>
               <div className="text-2xl font-bold text-purple-700">{stats.outForDelivery}</div>
             </CardContent>
           </Card>
 
           <Card className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200">
             <CardHeader className="flex flex-row items-center justify-between pb-2">
               <CardTitle className="text-sm font-medium text-emerald-700">Delivered</CardTitle>
               <CheckCircle2 className="w-4 h-4 text-emerald-600" />
             </CardHeader>
             <CardContent>
               <div className="text-2xl font-bold text-emerald-700">{stats.delivered}</div>
             </CardContent>
           </Card>
         </div>
       </div>
     </StoreAdminLayout>
   );
 };
 
 export default StoreAdminDashboard;