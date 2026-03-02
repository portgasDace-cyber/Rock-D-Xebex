
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

const reviews = [
  {
    author: "Gokul",
    rating: 5,
    body: "Excellent service! The delivery was super fast, and the items were fresh. I would highly recommend Kunnathur Carry Bee to anyone looking for a reliable delivery service in the area.",
  },
  {
    author: "Praveen",
    rating: 4,
    body: "Good service, but the app is a bit slow at times. Overall, a great experience.",
  },
  {
    author: "Suresh",
    rating: 5,
    body: "I love this app! It's so easy to use, and the delivery is always on time. I would definitely recommend it to anyone looking for a convenient way to get their groceries.",
  },
  {
    author: "Anitha",
    rating: 4,
    body: "The app is great, but I wish there were more stores to choose from. Otherwise, it's a great service.",
  },
  {
    author: "Rajesh",
    rating: 5,
    body: "I'm so glad I found this app! It's been a lifesaver for me. I can now get my groceries delivered to my doorstep without having to leave my house.",
  },
  {
    author: "Priya",
    rating: 5,
    body: "I've been using this app for a few weeks now, and I'm really impressed. The delivery is always on time, and the customer service is excellent.",
  },
  {
    author: "Vijay",
    rating: 4,
    body: "The app is good, but it would be even better if it had a feature to track the delivery in real-time.",
  },
  {
    author: "Kavitha",
    rating: 5,
    body: "I'm so happy with this service! The delivery is always on time, and the items are always fresh. I would highly recommend it to anyone.",
  },
  {
    author: "Arun",
    rating: 5,
    body: "This is the best delivery app I've ever used! It's so convenient and easy to use. I would definitely recommend it to anyone.",
  },
  {
    author: "Deepa",
    rating: 4,
    body: "The app is great, but I wish there were more payment options available. Otherwise, it's a great service.",
  },
    {
    author: "Sathish",
    rating: 5,
    body: "I'm so impressed with this app! It's so easy to use, and the delivery is always on time. I would highly recommend it to anyone.",
  },
  {
    author: "Saranya",
    rating: 5,
    body: "This is the best delivery service I've ever used. The delivery is always on time, and the customer service is excellent.",
  },
  {
    author: "Karthik",
    rating: 4,
    body: "The app is good, but it would be better if it had a feature to save my favorite stores.",
  },
  {
    author: "Meena",
    rating: 5,
    body: "I'm so glad I found this app. It's so convenient and easy to use. I would highly recommend it to anyone.",
  },
  {
    author: "Prabhu",
    rating: 5,
    body: "This is the best delivery app I've ever used. I'm so impressed with the service.",
  },
  {
    author: "Geetha",
    rating: 4,
    body: "The app is great, but it would be better if it had a feature to schedule deliveries in advance.",
  },
  {
    author: "Ramesh",
    rating: 5,
    body: "I'm so happy with this service. The delivery is always on time, and the items are always fresh.",
  },
  {
    author: "Chitra",
    rating: 5,
    body: "This is the best delivery service in Kunnathur. I would highly recommend it to anyone.",
  },
  {
    author: "Balaji",
    rating: 4,
    body: "The app is good, but it would be better if it had a feature to see the delivery person's location in real-time.",
  },
  {
    author: "Vanitha",
    rating: 5,
    body: "I'm so impressed with this app. It's so easy to use, and the delivery is always on time.",
  },
    {
    author: "Senthil",
    rating: 5,
    body: "This is the best delivery service I've ever used. I would highly recommend it to anyone.",
  },
  {
    author: "Amutha",
    rating: 4,
    body: "The app is great, but I wish there were more options for fresh produce.",
  },
  {
    author: "Murugan",
    rating: 5,
    body: "I'm so glad I found this app. It's been a lifesaver for me.",
  },
  {
    author: "Lakshmi",
    rating: 5,
    body: "I've been using this app for a few months now, and I'm really impressed. The delivery is always on time, and the customer service is excellent.",
  },
  {
    author: "Ganesh",
    rating: 4,
    body: "The app is good, but it would be even better if it had a feature to add items to my cart by scanning the barcode.",
  },
  {
    author: "Selvi",
    rating: 5,
    body: "I'm so happy with this service! The delivery is always on time, and the items are always fresh. I would highly recommend it to anyone.",
  },
  {
    author: "Ravi",
    rating: 5,
    body: "This is the best delivery app I've ever used! It's so convenient and easy to use. I would definitely recommend it to anyone.",
  },
  {
    author: "Parvathi",
    rating: 4,
    body: "The app is great, but I wish there were more payment options available. Otherwise, it's a great service.",
  },
  {
    author: "Kumar",
    rating: 5,
    body: "I'm so impressed with this app! It's so easy to use, and the delivery is always on time. I would highly recommend it to anyone.",
  },
  {
    author: "Jothi",
    rating: 5,
    body: "This is the best delivery service I've ever used. The delivery is always on time, and the customer service is excellent.",
  },
    {
    author: "Mani",
    rating: 4,
    body: "The app is good, but it would be better if it had a feature to save my favorite items.",
  },
  {
    author: "Valli",
    rating: 5,
    body: "I'm so glad I found this app. It's so convenient and easy to use. I would highly recommend it to anyone.",
  },
  {
    author: "Bala",
    rating: 5,
    body: "This is the best delivery app I've ever used. I'm so impressed with the service.",
  },
  {
    author: "Devi",
    rating: 4,
    body: "The app is great, but it would be better if it had a feature to schedule recurring deliveries.",
  },
  {
    author: "Krishnan",
    rating: 5,
    body: "I'm so happy with this service. The delivery is always on time, and the items are always fresh.",
  },
  {
    author: "Latha",
    rating: 5,
    body: "This is the best delivery service in Kunnathur. I would highly recommend it to anyone.",
  },
  {
    author: "Moorthy",
    rating: 4,
    body: "The app is good, but it would be better if it had a feature to see the delivery person's photo.",
  },
  {
    author: "Anbu",
    rating: 5,
    body: "I'm so impressed with this app. It's so easy to use, and the delivery is always on time.",
  },
  {
    author: "Nithya",
    rating: 5,
    body: "This is the best delivery service I've ever used. I would highly recommend it to anyone.",
  },
  {
    author: "Velu",
    rating: 4,
    body: "The app is great, but I wish there were more options for organic products.",
  },
    {
    author: "Pandian",
    rating: 5,
    body: "I'm so glad I found this app. It's been a lifesaver for me.",
  },
  {
    author: "Shanthi",
    rating: 5,
    body: "I've been using this app for a few months now, and I'm really impressed. The delivery is always on time, and the customer service is excellent.",
  },
  {
    author: "Saravanan",
    rating: 4,
    body: "The app is good, but it would be even better if it had a feature to add items to my cart from a recipe.",
  },
  {
    author: "Malar",
    rating: 5,
    body: "I'm so happy with this service! The delivery is always on time, and the items are always fresh. I would highly recommend it to anyone.",
  },
  {
    author: "Kannan",
    rating: 5,
    body: "This is the best delivery app I've ever used! It's so convenient and easy to use. I would definitely recommend it to anyone.",
  },
  {
    author: "Eswari",
    rating: 4,
    body: "The app is great, but I wish there were more payment options available. Otherwise, it's a great service.",
  },
  {
    author: "Dinesh",
    rating: 5,
    body: "I'm so impressed with this app! It's so easy to use, and the delivery is always on time. I would highly recommend it to anyone.",
  },
  {
    author: "Sumathi",
    rating: 5,
    body: "This is the best delivery service I've ever used. The delivery is always on time, and the customer service is excellent.",
  },
  {
    author: "Jagadeesh",
    rating: 4,
    body: "The app is good, but it would be better if it had a feature to save my delivery addresses.",
  },
  {
    author: "Nirmala",
    rating: 5,
    body: "I'm so glad I found this app. It's so convenient and easy to use. I would highly recommend it to anyone.",
  },
  {
    author: "Mohan",
    rating: 5,
    body: "This is the best delivery app I've ever used. I'm so impressed with the service.",
  },
  {
    author: "Sasikala",
    rating: 4,
    body: "The app is great, but it would be better if it had a feature to see the estimated delivery time before placing an order.",
  },
  {
    author: "Thangaraj",
    rating: 5,
    body: "I'm so happy with this service. The delivery is always on time, and the items are always fresh.",
  },
  {
    author: "Usha",
    rating: 5,
    body: "This is the best delivery service in Kunnathur. I would highly recommend it to anyone.",
  },
  {
    author: "Chandran",
    rating: 4,
    body: "The app is good, but it would be better if it had a feature to see the delivery person's contact number.",
  },
  {
    author: "Manjula",
    rating: 5,
    body: "I'm so impressed with this app. It's so easy to use, and the delivery is always on time.",
  },
  {
    author: "Sivakumar",
    rating: 5,
    body: "This is the best delivery service I've ever used. I would highly recommend it to anyone.",
  },
  {
    author: "Pushpa",
    rating: 4,
    body: "The app is great, but I wish there were more options for frozen foods.",
  },
  {
    author: "Elango",
    rating: 5,
    body: "I'm so glad I found this app. It's been a lifesaver for me.",
  },
  {
    author: "Thilagavathi",
    rating: 5,
    body: "I've been using this app for a few months now, and I'm really impressed. The delivery is always on time, and the customer service is excellent.",
  },
];

const Reviews = () => {
  const [open, setOpen] = useState(false);
  const [allReviews, setAllReviews] = useState(reviews);
  const [user, setUser] = useState<User | null>(null);
  const [fullName, setFullName] = useState<string | null>(null);
  const [newReview, setNewReview] = useState({
    author: "",
    rating: 0,
    body: "",
  });

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);

        if (session?.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("user_id", session.user.id)
            .maybeSingle();
          setFullName(profile?.full_name || null);
          setNewReview((prev) => ({ ...prev, author: profile?.full_name || "" }));
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleRating = (rating: number) => {
    setNewReview({ ...newReview, rating });
  };

  const handleSubmit = () => {
    if (newReview.author && newReview.body && newReview.rating > 0) {
      setAllReviews([newReview, ...allReviews]);
      setNewReview({ author: fullName || "", rating: 0, body: "" });
      setOpen(false);
    }
  };

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-center">
            What Our Customers Say
          </h2>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button disabled={!user}>Write a Review</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Write a Review</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Your Name"
                  value={newReview.author}
                  onChange={(e) =>
                    setNewReview({ ...newReview, author: e.target.value })
                  }
                  disabled
                />
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-6 h-6 cursor-pointer ${
                        star <= newReview.rating
                          ? "text-yellow-500 fill-current"
                          : "text-gray-300"
                      }`}
                      onClick={() => handleRating(star)}
                    />
                  ))}
                </div>
                <Textarea
                  placeholder="Your Review"
                  value={newReview.body}
                  onChange={(e) =>
                    setNewReview({ ...newReview, body: e.target.value })
                  }
                />
                <Button onClick={handleSubmit}>Submit Review</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        {!user && (
          <p className="text-center text-muted-foreground mb-4">
            You must be logged in to write a review.
          </p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {allReviews.map((review, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{review.author}</CardTitle>
                  <div className="flex items-center">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < review.rating
                            ? "text-yellow-500 fill-current"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{review.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Reviews;
