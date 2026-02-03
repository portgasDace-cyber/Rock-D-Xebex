import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import Navbar from "@/components/Navbar";
import ProfileCompletion from "@/components/ProfileCompletion";
import { supabase } from "@/integrations/supabase/client";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { toast } from "sonner";
import { User as FirebaseUser, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";
import { auth } from "@/integrations/firebase/config";
import beeMascot from "@/assets/bee-mascot.png";
import { Loader2, Phone } from "lucide-react";

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier | undefined;
    confirmationResult: ConfirmationResult | undefined;
  }
}

const Auth = () => {
  const navigate = useNavigate();
  const { user: firebaseUser, loading: authLoading, signIn, signUp } = useFirebaseAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showProfileCompletion, setShowProfileCompletion] = useState(false);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  
  // Phone auth states
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [phoneLoading, setPhoneLoading] = useState(false);
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleSignedIn = async (signedInUser: FirebaseUser) => {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("full_name, phone, address")
        .eq("user_id", signedInUser.uid)
        .maybeSingle();

      // Ensure a profile row exists so upserts/updates always work
      if (!profile && (error?.code === "PGRST116" || !error)) {
        await supabase
          .from("profiles")
          .upsert(
            {
              user_id: signedInUser.uid,
              full_name: signedInUser.displayName ?? null,
              phone: signedInUser.phoneNumber ?? null,
            },
            { onConflict: "user_id" }
          );
      }

      const isIncomplete = !profile || !profile.address;
      if (isIncomplete) {
        setCurrentUser(signedInUser);
        setShowProfileCompletion(true);
      } else {
        navigate("/");
      }
    };

    if (!authLoading && firebaseUser) {
      handleSignedIn(firebaseUser);
    }
  }, [firebaseUser, authLoading, navigate]);

  // Initialize reCAPTCHA
  const setupRecaptcha = () => {
    if (!auth) {
      toast.error("Authentication service not available");
      return false;
    }

    if (!window.recaptchaVerifier && recaptchaContainerRef.current) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainerRef.current, {
        size: "invisible",
        callback: () => {
          console.log("reCAPTCHA verified");
        },
        "expired-callback": () => {
          toast.error("reCAPTCHA expired. Please try again.");
          window.recaptchaVerifier = undefined;
        },
      });
    }
    return true;
  };

  const handleSendOtp = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      toast.error("Please enter a valid phone number");
      return;
    }

    if (!auth) {
      toast.error("Authentication service not available");
      return;
    }

    setPhoneLoading(true);

    try {
      if (!setupRecaptcha()) {
        setPhoneLoading(false);
        return;
      }

      const formattedPhone = phoneNumber.startsWith("+") ? phoneNumber : `+91${phoneNumber}`;
      const appVerifier = window.recaptchaVerifier!;
      
      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      window.confirmationResult = confirmationResult;
      
      setOtpSent(true);
      toast.success("OTP sent successfully!");
    } catch (error: any) {
      console.error("Error sending OTP:", error);
      toast.error(error.message || "Failed to send OTP");
      // Reset recaptcha on error
      window.recaptchaVerifier = undefined;
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      toast.error("Please enter the 6-digit OTP");
      return;
    }

    setPhoneLoading(true);

    try {
      if (!window.confirmationResult) {
        toast.error("Please request OTP first");
        setPhoneLoading(false);
        return;
      }

      await window.confirmationResult.confirm(otp);
      toast.success("Phone verified successfully!");
    } catch (error: any) {
      console.error("Error verifying OTP:", error);
      toast.error(error.message || "Invalid OTP");
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signUp(email, password);
      toast.success("Account created successfully!");
      setEmail("");
      setPassword("");
    } catch (error: any) {
      toast.error(error.message || "Failed to sign up");
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signIn(email, password);
      toast.success("Welcome back!");
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  if (showProfileCompletion && currentUser) {
    return (
      <ProfileCompletion
        user={currentUser}
        onComplete={() => {
          setShowProfileCompletion(false);
          navigate("/");
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/30 to-background">
      <Navbar />

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8 animate-fade-in">
            <img
              src={beeMascot}
              alt="Carry Bee"
              className="w-24 h-24 mx-auto mb-4 animate-bounce-slow"
            />
            <h1 className="text-3xl font-outfit font-bold mb-2">
              Welcome to Carry Bee
            </h1>
            <p className="text-muted-foreground">
              Sign in to start ordering from local stores
            </p>
          </div>

          <Card className="animate-scale-in">
            <CardHeader>
              <CardTitle className="font-outfit">Get Started</CardTitle>
              <CardDescription>
                Login with phone or create an account
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Phone Authentication */}
              <div className="mb-6 p-4 bg-secondary/30 rounded-lg">
                <div className="flex items-center gap-2 mb-4">
                  <Phone className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">Login with Phone</h3>
                </div>
                
                {!otpSent ? (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <div className="flex gap-2 mt-1">
                        <div className="flex items-center px-3 bg-muted rounded-md border">
                          <span className="text-sm text-muted-foreground">+91</span>
                        </div>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="9876543210"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                          className="flex-1"
                          maxLength={10}
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      className="w-full"
                      onClick={handleSendOtp}
                      disabled={phoneLoading || phoneNumber.length !== 10}
                    >
                      {phoneLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending OTP...
                        </>
                      ) : (
                        "Send OTP"
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label>Enter OTP sent to +91{phoneNumber}</Label>
                      <div className="flex justify-center mt-3">
                        <InputOTP
                          value={otp}
                          onChange={setOtp}
                          maxLength={6}
                        >
                          <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                          </InputOTPGroup>
                        </InputOTP>
                      </div>
                    </div>
                    <Button
                      type="button"
                      className="w-full"
                      onClick={handleVerifyOtp}
                      disabled={phoneLoading || otp.length !== 6}
                    >
                      {phoneLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        "Verify OTP"
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full text-sm"
                      onClick={() => {
                        setOtpSent(false);
                        setOtp("");
                      }}
                    >
                      Change phone number
                    </Button>
                  </div>
                )}
              </div>

              {/* Invisible reCAPTCHA container */}
              <div ref={recaptchaContainerRef} id="recaptcha-container"></div>

              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <span className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    or continue with email
                  </span>
                </span>
              </div>

              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="create">Create New</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div>
                      <Label htmlFor="signin-email">Email</Label>
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="signin-password">Password</Label>
                      <Input
                        id="signin-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loading}
                    >
                      {loading ? "Signing in..." : "Login"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="create">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div>
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="signup-password">Password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loading}
                    >
                      {loading ? "Creating account..." : "Create Account"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;
