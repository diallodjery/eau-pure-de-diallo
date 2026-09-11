import { useEffect, useState } from "react";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

export default function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  if (!visible || !installEvent) return null;
  return <div className="install-prompt"><div><strong>Installer l’application</strong><small>Accédez rapidement à Eau Pure Diallo.</small></div><button onClick={() => { void installEvent.prompt(); setVisible(false); }}>Installer</button><button className="install-close" onClick={() => setVisible(false)} aria-label="Fermer">×</button></div>;
}
