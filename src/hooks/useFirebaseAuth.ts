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
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    if (!auth) {
      console.warn("Firebase auth not initialized");
      setLoading(false);
      setAuthReady(true);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      setAuthReady(true);

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
    if (!auth) throw new Error("Firebase auth not initialized");
    return signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string) => {
    if (!auth) throw new Error("Firebase auth not initialized");
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const signInWithGoogle = async () => {
    if (!auth || !googleProvider) throw new Error("Firebase auth not initialized");
    return signInWithPopup(auth, googleProvider);
  };

  const signOut = async () => {
    if (!auth) throw new Error("Firebase auth not initialized");
    return firebaseSignOut(auth);
  };

  return {
    user,
    loading,
    authReady,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
  };
};
