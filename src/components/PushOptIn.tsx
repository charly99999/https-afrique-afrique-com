import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { savePushSubscription } from "@/lib/push.functions";
import { VAPID_PUBLIC_KEY } from "@/lib/vapid";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function PushOptIn() {
  const { user } = useAuth();
  const save = useServerFn(savePushSubscription);
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const ok = typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;
    setSupported(ok);
    if (!ok) return;
    navigator.serviceWorker.getRegistration("/sw-push.js").then(async (reg) => {
      if (!reg) return;
      const sub = await reg.pushManager.getSubscription();
      setEnabled(!!sub);
    });
  }, []);

  if (!supported || !user) return null;
  if (enabled) return null;

  async function activate() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.register("/sw-push.js");
      const perm = await Notification.requestPermission();
      if (perm !== "granted") { toast.error("Permission refusée"); return; }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      const json = sub.toJSON() as any;
      await save({
        data: {
          endpoint: sub.endpoint,
          p256dh: json.keys?.p256dh ?? "",
          auth: json.keys?.auth ?? "",
          userAgent: navigator.userAgent,
        },
      });
      setEnabled(true);
      toast.success("Notifications activées 🔔");
    } catch (e: any) {
      toast.error(e?.message ?? "Erreur d'activation");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border-2 border-brand-gold/40 bg-gradient-to-br from-brand-gold/10 via-amber-50 to-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-brand-gold/20 p-2"><Bell className="h-5 w-5 text-brand-green" /></div>
        <div className="flex-1">
          <h3 className="font-semibold text-brand-green">Activez les notifications</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Recevez des rappels pour booster vos annonces au meilleur moment et obtenir jusqu'à 10× plus de vues.
          </p>
          <Button onClick={activate} disabled={busy} size="sm" className="mt-3 bg-brand-green text-white hover:bg-brand-green/90">
            {busy ? "Activation…" : "Activer les notifications"}
          </Button>
        </div>
      </div>
    </div>
  );
}
