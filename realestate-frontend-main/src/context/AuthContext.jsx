import { createContext, useContext, useEffect, useState } from "react";
import API_URL from '../config';
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // ✅ Step 1: Get Firebase ID token
          const token = await firebaseUser.getIdToken();

          // ✅ Step 2: Try to fetch user data from backend
          const res = await fetch(
            `${API_URL}/users/${firebaseUser.uid}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (res.ok) {
            // ✅ Step 3: User exists, get data
            const data = await res.json();
            setUser({
              firebase_uid: data.firebase_uid,
              email: data.email,
              name: data.name,
              surname: data.surname,
              phone: data.phone,
            });
          } else if (res.status === 404) {
            // 🚀 Step 4: Create user if not found
            await fetch(`${API_URL}/users/`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                firebase_uid: firebaseUser.uid,
                name: firebaseUser.displayName?.split(" ")[0] || "",
                surname: firebaseUser.displayName?.split(" ")[1] || "",
                email: firebaseUser.email,
                phone: firebaseUser.phoneNumber || "",
              }),
            });

            // After creating, set local user
            setUser({
              firebase_uid: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName?.split(" ")[0] || "",
              surname: firebaseUser.displayName?.split(" ")[1] || "",
              phone: firebaseUser.phoneNumber || "",
            });
          }
        } catch (error) {
          console.error("Error fetching/creating user:", error);
        }
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}


