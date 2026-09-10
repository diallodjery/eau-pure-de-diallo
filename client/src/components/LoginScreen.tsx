import { useState } from "react";
import type { FormEvent } from "react";
import { LockKeyhole, LogIn, Mail, Droplets } from "lucide-react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "register") {
        const credentials = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(credentials.user, { displayName: name.trim() || undefined });
        try {
          await setDoc(doc(db, "users", credentials.user.uid), { name: name.trim(), phone: phone.trim(), email: email.trim(), createdAt: new Date().toISOString() });
        } catch (profileError) {
          console.warn("Profil créé mais fiche utilisateur non enregistrée. Ajouter la règle users dans Firestore.", profileError);
        }
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch {
      setError(mode === "register" ? "Impossible de créer le compte. L’email est peut-être déjà utilisé ou le mot de passe est trop court (6 caractères minimum)." : "Email ou mot de passe incorrect. Vérifiez vos informations.");
    } finally {
      setLoading(false);
    }
  };

  return <main className="login-page"><section className="login-card"><div className="login-logo"><Droplets size={25} /></div><p className="login-kicker">EAU PURE DE DIALLO</p><h1>{mode === "register" ? "Créer mon compte" : "Bienvenue"}</h1><p className="login-subtitle">{mode === "register" ? "Inscrivez-vous pour commencer à gérer votre activité." : "Connectez-vous pour gérer votre activité."}</p><form onSubmit={submit}>{mode === "register" && <><label>Nom complet<div className="login-input"><Mail size={17} /><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex. Mamadou Ndiaye" required /></div></label><label>Téléphone<div className="login-input"><Mail size={17} /><input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Ex. 70 00 00 00" /></div></label></>}<label>Email<div className="login-input"><Mail size={17} /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="exemple@email.com" required /></div></label><label>Mot de passe<div className="login-input"><LockKeyhole size={17} /><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="6 caractères minimum" minLength={6} required /></div></label>{error && <p className="login-error">{error}</p>}<button className="login-submit" disabled={loading}>{loading ? "Un instant..." : mode === "register" ? <><LogIn size={17} /> Créer mon compte</> : <><LogIn size={17} /> Se connecter</>}</button></form><button className="login-switch" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>{mode === "register" ? "J’ai déjà un compte · Se connecter" : "Première utilisation · Créer mon compte"}</button><p className="login-note">Votre compte est réservé au gérant de l’entreprise.</p></section></main>;
}
