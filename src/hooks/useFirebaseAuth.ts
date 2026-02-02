import { useState, useEffect } from "react";
import { 
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut
} from "firebase/auth";
import { auth, googleProvider } from "@/integrations/firebase/config";
import { supabase } from "@/integrations/supabase/client";

export const useFirebaseAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);

      // Sync Firebase user with Supabase profiles if needed
      if (firebaseUser) {
        await syncUserToSupabase(firebaseUser);
      }
    });

    return () => unsubscribe();
  }, []);

  const syncUserToSupabase = async (firebaseUser: User) => {
    try {
      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", firebaseUser.uid)
        .maybeSingle();

      if (!existingProfile) {
        // Create profile for new user
        await supabase.from("profiles").insert({
          user_id: firebaseUser.uid,
          full_name: firebaseUser.displayName || null,
        });
      }
    } catch (error) {
      console.error("Error syncing user to Supabase:", error);
    }
  };

  const signIn = async (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const signInWithGoogle = async () => {
    return signInWithPopup(auth, googleProvider);
  };

  const signOut = async () => {
    return firebaseSignOut(auth);
  };

  return {
    user,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
  };
};
