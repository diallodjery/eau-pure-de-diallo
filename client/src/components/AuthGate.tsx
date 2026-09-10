import { useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/auth";
import LoginScreen from "./LoginScreen";

export default function AuthGate({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => onAuthStateChanged(auth, (nextUser) => {
    setUser(nextUser);
    setChecking(false);
  }), []);

  if (checking) return <main className="auth-loading"><div className="simple-logo-loading">✦</div><span>Chargement...</span></main>;
  if (!user) return <LoginScreen />;
  return <>{children}</>;
}
