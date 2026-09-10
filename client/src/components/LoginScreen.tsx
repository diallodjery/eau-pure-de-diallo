import { useState } from "react";
import type { FormEvent } from "react";
import { LockKeyhole, LogIn, Mail, Droplets } from "lucide-react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/auth";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch {
      setError("Email ou mot de passe incorrect. Vérifiez aussi que la connexion Email/Mot de passe est activée dans Firebase.");
    } finally {
      setLoading(false);
    }
  };

  return <main className="login-page"><section className="login-card"><div className="login-logo"><Droplets size={25} /></div><p className="login-kicker">EAU PURE DE DIALLO</p><h1>Bienvenue</h1><p className="login-subtitle">Connectez-vous pour gérer votre activité.</p><form onSubmit={submit}><label>Email du gérant<div className="login-input"><Mail size={17} /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="exemple@email.com" required /></div></label><label>Mot de passe<div className="login-input"><LockKeyhole size={17} /><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Votre mot de passe" required /></div></label>{error && <p className="login-error">{error}</p>}<button className="login-submit" disabled={loading}>{loading ? "Connexion..." : <><LogIn size={17} /> Se connecter</>}</button></form><p className="login-note">Votre compte est réservé au gérant de l’entreprise.</p></section></main>;
}
