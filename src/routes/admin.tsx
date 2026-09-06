import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ShieldAlert,
  Users,
  Megaphone,
  Flag,
  Wallet,
  Search,
  Ban,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({
  ssr: false,
  component: AdminPage,
  head: () => ({
    meta: [
      { title: "Administration — Afrique-Business" },
      { name: "robots", content: "noindex, nofollow" },
      { name: "description", content: "Espace de modération et de pilotage de la marketplace Afrique-Business." },
    ],
  }),
});

type Stats = {
  users: number;
  users_new_7d: number;
  listings_total: number;
  listings_active: number;
  listings_pending: number;
  reports_open: number;
  payments_pending: number;
  payments_completed: number;
  revenue_fcfa: number;
  subscriptions_active: number;
  boosts_active: number;
  suspended: number;
};

type AdminUser = {
  id: string;
  display_name: string | null;
  phone: string | null;
  city: string | null;
  country: string;
  account_type: string;
  verified: boolean;
  suspended_at: string | null;
  created_at: string;
  is_admin: boolean;
  listings_count: number;
};

type ModListing = {
  id: string;
  title: string;
  status: string;
  city: string;
  price_fcfa: number;
  created_at: string;
  owner_id: string;
};

type OpenReport = {
  id: string;
  listing_id: string;
  reason: string;
  details: string | null;
  created_at: string;
};

const TABS = [
  { key: "dashboard", label: "Tableau de bord", icon: ShieldAlert },
  { key: "listings", label: "Annonces", icon: Megaphone },
  { key: "users", label: "Comptes", icon: Users },
  { key: "reports", label: "Signalements", icon: Flag },
  { key: "payments", label: "Paiements", icon: Wallet },
] as const;
type TabKey = (typeof TABS)[number]["key"];

const fcfa = (n: number) => `${n.toLocaleString("fr-FR")} FCFA`;

function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [tab, setTab] = useState<TabKey>("dashboard");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setIsAdmin(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      if (!cancelled) setIsAdmin(!error && data === true);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  if (authLoading || isAdmin === null) {
    return (
      <MobileShell>
        <div className="p-16 text-center text-sm text-muted-foreground">Vérification des accès…</div>
      </MobileShell>
    );
  }

  if (!isAdmin) {
    return (
      <MobileShell>
        <div className="px-6 py-24 text-center">
          <ShieldAlert className="mx-auto size-10 text-muted-foreground" />
          <h1 className="mt-4 font-display text-2xl italic">Accès réservé</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Cet espace est réservé à l'équipe d'administration.
          </p>
          <Link
            to="/"
            className="mt-6 inline-block rounded-xl bg-brand-green px-6 py-3 text-sm font-bold text-primary-foreground"
          >
            Retour à l'accueil
          </Link>
        </div>
      </MobileShell>
    );
  }

  return (
    <MobileShell>
      <header className="border-b border-border bg-[linear-gradient(180deg,color-mix(in_oklab,var(--color-brand-gold)_14%,transparent),transparent)] px-5 pb-4 pt-6">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-green">Afrique-Business</p>
        <h1 className="mt-1 font-display text-3xl">Administration</h1>
      </header>

      <div className="sticky top-0 z-20 flex gap-2 overflow-x-auto border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold transition ${
                tab === t.key
                  ? "bg-foreground text-brand-gold"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="size-3.5" /> {t.label}
            </button>
          );
        })}
      </div>

      <div className="px-4 py-5">
        {tab === "dashboard" && <DashboardTab />}
        {tab === "listings" && <ListingsTab />}
        {tab === "users" && <UsersTab />}
        {tab === "reports" && <ReportsTab />}
        {tab === "payments" && <PaymentsTab />}
      </div>
    </MobileShell>
  );
}

/* ------------------------------- Dashboard ------------------------------- */

function DashboardTab() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const { data, error: err } = await supabase.rpc("admin_dashboard_stats");
    if (err) {
      setError(err.message);
      return;
    }
    setStats(data as unknown as Stats);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) return <ErrorBlock message={error} onRetry={load} />;
  if (!stats) return <SkeletonGrid />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Comptes" value={stats.users} hint={`+${stats.users_new_7d} sur 7 j`} />
        <Stat label="Annonces actives" value={stats.listings_active} hint={`${stats.listings_total} au total`} />
        <Stat label="En attente" value={stats.listings_pending} hint="à modérer" />
        <Stat label="Signalements" value={stats.reports_open} hint="non traités" />
        <Stat label="Revenus encaissés" value={fcfa(stats.revenue_fcfa)} hint={`${stats.payments_completed} paiements`} />
        <Stat label="Paiements en attente" value={stats.payments_pending} hint="à réconcilier" />
        <Stat label="Abonnements actifs" value={stats.subscriptions_active} hint={`${stats.boosts_active} boosts`} />
        <Stat label="Comptes suspendus" value={stats.suspended} hint="modération" />
      </div>
      <button
        onClick={() => void load()}
        className="flex items-center gap-2 rounded-xl bg-muted px-4 py-2.5 text-xs font-bold"
      >
        <RefreshCw className="size-3.5" /> Actualiser
      </button>
    </div>
  );
}

/* -------------------------------- Annonces -------------------------------- */

function ListingsTab() {
  const [status, setStatus] = useState<string>("pending");
  const [rows, setRows] = useState<ModListing[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setRows(null);
    setError(null);
    const { data, error: err } = await supabase
      .from("listings")
      .select("id, title, status, city, price_fcfa, created_at, owner_id")
      .eq("status", status as never)
      .order("created_at", { ascending: false })
      .limit(100);
    if (err) {
      setError(err.message);
      return;
    }
    setRows((data ?? []) as ModListing[]);
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  async function setListingStatus(id: string, next: string, reason?: string) {
    setBusy(id);
    try {
      const { error: err } = await supabase.rpc("admin_set_listing_status", {
        _listing_id: id,
        _status: next as never,
        _reason: reason ?? undefined,
      });
      if (err) throw err;
      toast.success("Annonce mise à jour.");
      setRows((prev) => (prev ?? []).filter((r) => r.id !== id));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action impossible");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {["pending", "active", "rejected", "suspended", "expired"].map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold capitalize ${
              status === s ? "bg-brand-green text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {error && <ErrorBlock message={error} onRetry={load} />}
      {!error && rows === null && <SkeletonList />}
      {rows?.length === 0 && <Empty label="Aucune annonce dans cet état." />}

      <ul className="space-y-2">
        {(rows ?? []).map((l) => (
          <li key={l.id} className="rounded-2xl border border-border bg-card p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link
                  to="/annonces/$id"
                  params={{ id: l.id }}
                  className="line-clamp-2 text-sm font-bold hover:underline"
                >
                  {l.title}
                </Link>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {l.city} · {fcfa(l.price_fcfa)} · {new Date(l.created_at).toLocaleDateString("fr-FR")}
                </p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {l.status !== "active" && (
                <ActionBtn
                  disabled={busy === l.id}
                  onClick={() => void setListingStatus(l.id, "active")}
                  tone="green"
                  icon={<CheckCircle2 className="size-3.5" />}
                  label="Valider"
                />
              )}
              {l.status !== "rejected" && (
                <ActionBtn
                  disabled={busy === l.id}
                  onClick={() => void setListingStatus(l.id, "rejected", "Non conforme aux règles")}
                  tone="red"
                  icon={<XCircle className="size-3.5" />}
                  label="Refuser"
                />
              )}
              {l.status !== "suspended" && (
                <ActionBtn
                  disabled={busy === l.id}
                  onClick={() => void setListingStatus(l.id, "suspended", "Suspendue par la modération")}
                  tone="neutral"
                  icon={<Ban className="size-3.5" />}
                  label="Suspendre"
                />
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* -------------------------------- Comptes --------------------------------- */

function UsersTab() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<AdminUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async (search: string) => {
    setRows(null);
    setError(null);
    const { data, error: err } = await supabase.rpc("admin_list_users", {
      _search: search || undefined,
      _limit: 100,
    });
    if (err) {
      setError(err.message);
      return;
    }
    setRows((data ?? []) as unknown as AdminUser[]);
  }, []);

  useEffect(() => {
    void load("");
  }, [load]);

  async function toggleSuspension(u: AdminUser) {
    const suspend = !u.suspended_at;
    if (suspend && !confirm(`Suspendre ${u.display_name ?? "ce compte"} ? Ses annonces seront masquées.`)) return;
    setBusy(u.id);
    try {
      const { error: err } = await supabase.rpc("admin_set_suspension", {
        _user_id: u.id,
        _suspended: suspend,
        _reason: suspend ? "Violation des règles de la marketplace" : undefined,
      });
      if (err) throw err;
      toast.success(suspend ? "Compte suspendu." : "Compte réactivé.");
      setRows((prev) =>
        (prev ?? []).map((r) => (r.id === u.id ? { ...r, suspended_at: suspend ? new Date().toISOString() : null } : r))
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action impossible");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void load(q.trim());
        }}
        className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2"
      >
        <Search className="size-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Nom, téléphone ou ville"
          className="flex-1 bg-transparent text-sm outline-none"
        />
        <button type="submit" className="rounded-lg bg-foreground px-3 py-1.5 text-xs font-bold text-brand-gold">
          Chercher
        </button>
      </form>

      {error && <ErrorBlock message={error} onRetry={() => load(q)} />}
      {!error && rows === null && <SkeletonList />}
      {rows?.length === 0 && <Empty label="Aucun compte trouvé." />}

      <ul className="space-y-2">
        {(rows ?? []).map((u) => (
          <li key={u.id} className="rounded-2xl border border-border bg-card p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">
                  {u.display_name ?? "Sans nom"}{" "}
                  {u.is_admin && <span className="ml-1 rounded bg-brand-gold px-1.5 py-0.5 text-[10px] font-extrabold text-foreground">ADMIN</span>}
                  {u.verified && <span className="ml-1 rounded bg-brand-green/15 px-1.5 py-0.5 text-[10px] font-extrabold text-brand-green">VÉRIFIÉ</span>}
                  {u.suspended_at && <span className="ml-1 rounded bg-destructive/15 px-1.5 py-0.5 text-[10px] font-extrabold text-destructive">SUSPENDU</span>}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {u.account_type.toUpperCase()} · {u.city ?? "—"} ({u.country}) · {u.listings_count} annonce(s)
                </p>
                <p className="text-[11px] text-muted-foreground">{u.phone ?? "Pas de téléphone"}</p>
              </div>
              <Link
                to="/boutique/$ownerId"
                params={{ ownerId: u.id }}
                className="shrink-0 rounded-lg bg-muted px-2.5 py-1.5 text-[11px] font-bold"
              >
                Boutique
              </Link>
            </div>
            {!u.is_admin && (
              <div className="mt-3">
                <ActionBtn
                  disabled={busy === u.id}
                  onClick={() => void toggleSuspension(u)}
                  tone={u.suspended_at ? "green" : "red"}
                  icon={u.suspended_at ? <CheckCircle2 className="size-3.5" /> : <Ban className="size-3.5" />}
                  label={u.suspended_at ? "Réactiver" : "Suspendre"}
                />
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------ Signalements ------------------------------ */

function ReportsTab() {
  const [rows, setRows] = useState<OpenReport[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setRows(null);
    setError(null);
    const { data, error: err } = await supabase
      .from("reports")
      .select("id, listing_id, reason, details, created_at")
      .eq("resolved", false)
      .order("created_at", { ascending: false })
      .limit(100);
    if (err) {
      setError(err.message);
      return;
    }
    setRows((data ?? []) as OpenReport[]);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function resolve(id: string) {
    setBusy(id);
    try {
      const { error: err } = await supabase.from("reports").update({ resolved: true }).eq("id", id);
      if (err) throw err;
      setRows((prev) => (prev ?? []).filter((r) => r.id !== id));
      toast.success("Signalement traité.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action impossible");
    } finally {
      setBusy(null);
    }
  }

  if (error) return <ErrorBlock message={error} onRetry={load} />;
  if (rows === null) return <SkeletonList />;
  if (rows.length === 0) return <Empty label="Aucun signalement en attente. 👌" />;

  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li key={r.id} className="rounded-2xl border border-border bg-card p-3">
          <p className="text-sm font-bold">{r.reason}</p>
          {r.details && <p className="mt-1 text-xs text-muted-foreground">{r.details}</p>}
          <p className="mt-1 text-[11px] text-muted-foreground">
            {new Date(r.created_at).toLocaleString("fr-FR")}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              to="/annonces/$id"
              params={{ id: r.listing_id }}
              className="rounded-lg bg-muted px-3 py-1.5 text-[11px] font-bold"
            >
              Voir l'annonce
            </Link>
            <ActionBtn
              disabled={busy === r.id}
              onClick={() => void resolve(r.id)}
              tone="green"
              icon={<CheckCircle2 className="size-3.5" />}
              label="Marquer traité"
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/* -------------------------------- Paiements -------------------------------- */

type PaymentRow = {
  id: string;
  kind: string;
  amount_fcfa: number;
  status: string;
  created_at: string;
  completed_at: string | null;
};

function PaymentsTab() {
  const [rows, setRows] = useState<PaymentRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setRows(null);
    setError(null);
    const { data, error: err } = await supabase
      .from("payments")
      .select("id, kind, amount_fcfa, status, created_at, completed_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (err) {
      setError(err.message);
      return;
    }
    setRows((data ?? []) as PaymentRow[]);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) return <ErrorBlock message={error} onRetry={load} />;
  if (rows === null) return <SkeletonList />;
  if (rows.length === 0) return <Empty label="Aucun paiement enregistré." />;

  return (
    <ul className="space-y-2">
      {rows.map((p) => (
        <li key={p.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3">
          <div className="min-w-0">
            <p className="text-sm font-bold">{fcfa(p.amount_fcfa)}</p>
            <p className="text-[11px] text-muted-foreground">
              {p.kind === "boost" ? "Mise en avant" : "Abonnement"} ·{" "}
              {new Date(p.created_at).toLocaleString("fr-FR")}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase ${
              p.status === "completed"
                ? "bg-brand-green/15 text-brand-green"
                : p.status === "pending"
                  ? "bg-brand-gold/20 text-foreground"
                  : "bg-destructive/15 text-destructive"
            }`}
          >
            {p.status}
          </span>
        </li>
      ))}
    </ul>
  );
}

/* --------------------------------- Bits ---------------------------------- */

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="font-display text-2xl italic">{value}</p>
      <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      {hint && <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function ActionBtn({
  onClick,
  label,
  icon,
  tone,
  disabled,
}: {
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
  tone: "green" | "red" | "neutral";
  disabled?: boolean;
}) {
  const cls =
    tone === "green"
      ? "bg-brand-green text-primary-foreground"
      : tone === "red"
        ? "bg-destructive text-destructive-foreground"
        : "bg-muted text-foreground";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold disabled:opacity-50 ${cls}`}
    >
      {icon} {label}
    </button>
  );
}

function Empty({ label }: { label: string }) {
  return <p className="rounded-2xl bg-muted py-10 text-center text-sm text-muted-foreground">{label}</p>;
}

function SkeletonList() {
  return (
    <div className="space-y-2">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted" />
      ))}
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />
      ))}
    </div>
  );
}

function ErrorBlock({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-center">
      <p className="text-sm font-bold text-destructive">Impossible de charger les données</p>
      <p className="mt-1 text-xs text-muted-foreground">{message}</p>
      <button onClick={onRetry} className="mt-3 rounded-lg bg-foreground px-4 py-2 text-xs font-bold text-brand-gold">
        Réessayer
      </button>
    </div>
  );
}
