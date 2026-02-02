import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingBag, Clock, MapPin, Heart } from "lucide-react";
import BeeAnimation from "@/components/BeeAnimation";
import Navbar from "@/components/Navbar";
import DailyOffers from "@/components/DailyOffers";
import OffersSection from "@/components/OffersSection";
import OnboardingGuide from "@/components/OnboardingGuide";
import { PushNotificationPrompt } from "@/components/PushNotificationPrompt";
import beeMascot from "@/assets/bee-mascot.png";
import { supabase } from "@/integrations/supabase/client";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/integrations/firebase/config";

const ONBOARDING_KEY = "carrybee_onboarding_complete";

const Home = () => {
  const [welcomeName, setWelcomeName] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      const loggedIn = !!firebaseUser;
      setIsLoggedIn(loggedIn);

      if (!loggedIn || !firebaseUser) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", firebaseUser.uid)
        .maybeSingle();

      setWelcomeName(profile?.full_name || firebaseUser.displayName || null);

      // Check if onboarding is complete
      const onboardingComplete = localStorage.getItem(ONBOARDING_KEY) === "1";
      if (!onboardingComplete) setShowOnboarding(true);
    });

    return () => unsubscribe();
  }, []);

  const handleOnboardingComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, "1");
    setShowOnboarding(false);
  };

  const features = [
    {
      icon: <Clock className="w-8 h-8 text-primary" />,
      title: "Fast Delivery",
      description: "Get your orders delivered in 30-40 minutes",
    },
    {
      icon: <MapPin className="w-8 h-8 text-primary" />,
      title: "Local Stores",
      description: "Support your favorite neighborhood shops",
    },
    {
      icon: <ShoppingBag className="w-8 h-8 text-primary" />,
      title: "Wide Selection",
      description: "Groceries, medicines, food, and more",
    },
    {
      icon: <Heart className="w-8 h-8 text-primary" />,
      title: "Community First",
      description: "Built for Kunnathur, by Kunnathur",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/30 to-background">
      <BeeAnimation />
      <Navbar />

      {/* Daily Offers Section */}
      <DailyOffers />

      {/* Product Offers Section */}
      <OffersSection />

      {/* Welcome banner */}
      {isLoggedIn && (
        <section className="container mx-auto px-4 pt-6">
          <Card className="border-border/60">
            <CardContent className="p-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Welcome back</p>
                <p className="font-outfit font-semibold text-lg">
                  {welcomeName ? `Hi, ${welcomeName}!` : "Hi!"}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowOnboarding(true)}>
                User Guide
              </Button>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 text-center lg:text-left space-y-6 animate-fade-in">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-outfit font-bold text-foreground leading-tight">
              Fast, Local &{" "}
              <span className="text-primary">Friendly</span> Delivery
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
              Order from your favorite local stores in Kunnathur. Fresh groceries, medicines, delicious food - delivered to your doorstep!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link to="/stores">
                <Button size="lg" className="text-lg px-8 py-6 font-outfit font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105">
                  Start Ordering
                </Button>
              </Link>
              <Link to="/stores">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 font-outfit font-semibold">
                  Browse Stores
                </Button>
              </Link>
            </div>
          </div>

          <div className="flex-1 flex justify-center animate-scale-in">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl"></div>
              <img
                src={beeMascot}
                alt="Carry Bee Mascot"
                className="relative w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 animate-float drop-shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl md:text-4xl font-outfit font-bold text-center mb-12">Why Choose Carry Bee?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border/50 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-6 text-center space-y-3">
                <div className="mx-auto w-16 h-16 bg-secondary rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="font-outfit font-semibold text-lg">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-8 md:p-12 text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-outfit font-bold">Ready to Get Started?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join hundreds of happy customers in Kunnathur enjoying fast, reliable delivery from local stores.
            </p>
            <Link to="/stores">
              <Button size="lg" className="text-lg px-8 py-6 font-outfit font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105">
                Browse Local Stores
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <img src={beeMascot} alt="Carry Bee" className="w-8 h-8" />
              <span className="font-outfit font-semibold text-foreground">Kunnathur Carry Bee</span>
            </div>
            <p className="text-sm text-muted-foreground text-center">© 2025 Kunnathur Carry Bee. Fast, local & friendly delivery.</p>
          </div>
        </div>
      </footer>

      {/* Interactive Onboarding Guide */}
      <OnboardingGuide open={showOnboarding} onComplete={handleOnboardingComplete} />

      {/* Push Notification Prompt */}
      <PushNotificationPrompt />
    </div>
  );
};

export default Home;
