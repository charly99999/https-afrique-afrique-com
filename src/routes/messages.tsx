import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Send, Check, CheckCheck } from "lucide-react";
import { z } from "zod";
import { MobileShell } from "@/components/MobileShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { formatFcfa } from "@/data/catalog";
import { resolveListingImages } from "@/lib/listing-images";
import type { Database } from "@/integrations/supabase/types";

const searchSchema = z.object({
  listing: z.string().uuid().optional(),
  to: z.string().uuid().optional(),
});

type Message = Database["public"]["Tables"]["messages"]["Row"];

type Conversation = {
  listing_id: string;
  other_id: string;
  last_body: string;
  last_at: string;
  unread: number;
  listing_title: string;
  listing_cover: string | null;
  listing_price: number;
  other_name: string;
};

export const Route = createFileRoute("/messages")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Messages — Afrique-business" }] }),
  component: MessagesPage,
});

function MessagesPage() {
  const { listing, to } = useSearch({ from: "/messages" });
  const { user, loading } = useAuth();

  if (loading) return <MobileShell><div className="p-10 text-center text-sm text-muted-foreground">Chargement…</div></MobileShell>;
  if (!user) {
    return (
      <MobileShell>
        <div className="px-6 py-20 text-center">
          <h1 className="font-display text-2xl italic">Connectez-vous</h1>
          <p className="mt-2 text-sm text-muted-foreground">Pour discuter avec les vendeurs et acheteurs.</p>
          <Link to="/auth" className="mt-6 inline-block rounded-xl bg-brand-green px-6 py-3 text-sm font-bold text-primary-foreground">Se connecter</Link>
        </div>
      </MobileShell>
    );
  }

  if (listing && to) return <Thread userId={user.id} listingId={listing} otherId={to} />;
  return <ConversationsList userId={user.id} />;
}

function ConversationsList({ userId }: { userId: string }) {
  const [convos, setConvos] = useState<Conversation[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data } = await supabase
        .from("messages")
        .select(`id, listing_id, sender_id, recipient_id, body, read_at, created_at,
          listings(id, title, cover_url, price_fcfa)`)
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
        .order("created_at", { ascending: false })
        .limit(200);
        
      if (cancelled || !data) return;
      
      const map = new Map<string, Conversation>();
      const otherIds = new Set<string>();
      
      for (const m of data) {
        if (!m.listing_id) continue;
        const other = m.sender_id === userId ? m.recipient_id : m.sender_id;
        const key = `${m.listing_id}::${other}`;
        otherIds.add(other);
        
        if (!map.has(key)) {
          const l = m.listings as any;
          map.set(key, {
            listing_id: m.listing_id,
            other_id: other,
            last_body: m.body,
            last_at: m.created_at,
            unread: 0,
            listing_title: l?.title ?? "Annonce",
            listing_cover: l?.cover_url ?? null,
            listing_price: Number(l?.price_fcfa ?? 0),
            other_name: "Utilisateur",
          });
        }
        const c = map.get(key)!;
        if (m.recipient_id === userId && !m.read_at) c.unread += 1;
      }
      
      if (otherIds.size) {
        const { data: profs } = await supabase
          .from("public_profiles")
          .select("id, display_name")
          .in("id", Array.from(otherIds));
        
        const nameById = new Map((profs as any[])?.map((p) => [p.id, p.display_name ?? "Utilisateur"]) ?? []);
        for (const c of map.values()) c.other_name = nameById.get(c.other_id) ?? "Utilisateur";
      }
      
      const convoList = Array.from(map.values());
      const resolved = await resolveListingImages(convoList.map((c) => c.listing_cover));
      setConvos(convoList.map((c) => ({ 
        ...c, 
        listing_cover: c.listing_cover ? (resolved.get(c.listing_cover) ?? c.listing_cover) : null 
      })));
    }
    
    load();
    const ch = supabase.channel(`messages:list:${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `recipient_id=eq.${userId}` },
        load,
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `sender_id=eq.${userId}` },
        load,
      )
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, [userId]);

  return (
    <MobileShell>
      <header className="px-5 pb-4 pt-8">
        <h1 className="font-display text-3xl italic">Messages</h1>
        <p className="mt-1 text-xs text-muted-foreground">Vos discussions avec les acheteurs et vendeurs.</p>
      </header>
      {convos === null && <p className="px-5 py-10 text-center text-sm text-muted-foreground">Chargement…</p>}
      {convos && convos.length === 0 && (
        <div className="px-6 py-16 text-center">
          <p className="text-sm text-muted-foreground">Aucune conversation pour le moment.</p>
          <Link to="/" className="mt-6 inline-block rounded-xl bg-brand-green px-6 py-3 text-sm font-bold text-primary-foreground">Explorer les annonces</Link>
        </div>
      )}
      <ul className="divide-y divide-border">
        {convos?.map((c) => (
          <li key={`${c.listing_id}-${c.other_id}`}>
            <Link
              to="/messages"
              search={{ listing: c.listing_id, to: c.other_id }}
              className="flex items-center gap-3 px-5 py-4 transition active:bg-accent/30"
            >
              <img src={c.listing_cover ?? "/placeholder.svg"} alt="" className="size-14 shrink-0 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-bold">{c.other_name}</p>
                  <span className="shrink-0 text-[10px] text-muted-foreground">{shortTime(c.last_at)}</span>
                </div>
                <p className="truncate text-[11px] text-brand-green">{c.listing_title} · {formatFcfa(c.listing_price)}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{c.last_body}</p>
              </div>
              {c.unread > 0 && <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-green text-[10px] font-bold text-primary-foreground">{c.unread}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </MobileShell>
  );
}

function Thread({ userId, listingId, otherId }: { userId: string; listingId: string; otherId: string }) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [listing, setListing] = useState<{ title: string; price: number; cover: string | null } | null>(null);
  const [otherName, setOtherName] = useState("Utilisateur");
  const [otherTyping, setOtherTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const otherTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadError(null);
      const [{ data: msgs, error: msgsError }, { data: lst }, { data: prof }] = await Promise.all([
        supabase.from("messages").select("*")
          .eq("listing_id", listingId)
          .or(`and(sender_id.eq.${userId},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${userId})`)
          .order("created_at", { ascending: true }),
        supabase.from("listings").select("title, price_fcfa, cover_url").eq("id", listingId).maybeSingle(),
        supabase.from("public_profiles").select("display_name").eq("id", otherId).maybeSingle(),
      ]);
      if (cancelled) return;
      if (msgsError) {
        setLoadError(msgsError.message);
        return;
      }
      setMessages((msgs ?? []) as Message[]);
      if (lst) {
        const resolvedCover = await resolveListingImages([lst.cover_url]);
        setListing({
          title: lst.title,
          price: Number(lst.price_fcfa),
          cover: lst.cover_url ? (resolvedCover.get(lst.cover_url) ?? lst.cover_url) : null,
        });
      }
      const profRow = prof as any;
      if (profRow?.display_name) setOtherName(profRow.display_name);
      // mark unread as read
      const unread = (msgs ?? []).filter((m) => m.recipient_id === userId && !m.read_at).map((m) => m.id);
      if (unread.length) await supabase.from("messages").update({ read_at: new Date().toISOString() }).in("id", unread);
    }
    load();

    const ch = supabase.channel(`messages:thread:${listingId}:${[userId, otherId].sort().join(":")}`, {
      config: { broadcast: { self: false } },
    })
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `listing_id=eq.${listingId}` },
        (payload) => {
          const m = payload.new as Message;
          if ((m.sender_id === userId && m.recipient_id === otherId) || (m.sender_id === otherId && m.recipient_id === userId)) {
            setMessages((prev) => prev.some((x) => x.id === m.id) ? prev : [...prev, m]);
            if (m.recipient_id === userId) {
              supabase.from("messages").update({ read_at: new Date().toISOString() }).eq("id", m.id);
            }
          }
        }
      )
      .on("postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages", filter: `listing_id=eq.${listingId}` },
        (payload) => {
          const m = payload.new as Message;
          setMessages((prev) => prev.map((x) => x.id === m.id ? m : x));
        }
      )
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if (payload?.from === otherId) {
          setOtherTyping(true);
          if (otherTypingTimeoutRef.current) clearTimeout(otherTypingTimeoutRef.current);
          otherTypingTimeoutRef.current = setTimeout(() => setOtherTyping(false), 3000);
        }
      })
      .subscribe();
    channelRef.current = ch;

    return () => {
      cancelled = true;
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (otherTypingTimeoutRef.current) clearTimeout(otherTypingTimeoutRef.current);
      supabase.removeChannel(ch);
      channelRef.current = null;
    };
  }, [listingId, otherId, userId]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length, otherTyping]);

  function handleTyping(value: string) {
    setBody(value);
    if (!channelRef.current) return;
    // Throttle : on n'envoie un signal "typing" qu'une fois toutes les 2s
    if (typingTimeoutRef.current) return;
    channelRef.current.send({ type: "broadcast", event: "typing", payload: { from: userId } });
    typingTimeoutRef.current = setTimeout(() => {
      typingTimeoutRef.current = null;
    }, 2000);
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text || sending) return;
    setSending(true);
    const { data, error } = await supabase.from("messages").insert({
      listing_id: listingId, sender_id: userId, recipient_id: otherId, body: text,
    }).select().single();
    setSending(false);
    if (error) {
      setLoadError(error.message);
      return;
    }
    if (data) {
      setMessages((prev) => prev.some((x) => x.id === data.id) ? prev : [...prev, data as Message]);
      setBody("");
      setLoadError(null);
    }
  }

  return (
    <MobileShell>
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <button onClick={() => navigate({ to: "/messages" })} aria-label="Retour" className="grid size-9 place-items-center rounded-full hover:bg-accent/40">
          <ArrowLeft className="size-5" />
        </button>
        <Link to="/annonces/$id" params={{ id: listingId }} className="flex min-w-0 flex-1 items-center gap-3">
          {listing?.cover && <img src={listing.cover} alt="" className="size-10 shrink-0 rounded-lg object-cover" />}
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{otherName}</p>
            <p className="truncate text-[11px] text-brand-green">
              {otherTyping ? "écrit…" : (listing?.title ?? "Annonce") + (listing ? ` · ${formatFcfa(listing.price)}` : "")}
            </p>
          </div>
        </Link>
      </header>

      <div className="px-4 py-4 pb-28">
        {loadError && (
          <p className="mb-4 rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {loadError}
          </p>
        )}
        {messages.length === 0 && (
          <p className="py-10 text-center text-xs text-muted-foreground">Lancez la discussion 👋</p>
        )}
        <ul className="flex flex-col gap-2">
          {messages.map((m) => {
            const mine = m.sender_id === userId;
            return (
              <li key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-sm ${mine ? "bg-brand-green text-primary-foreground" : "bg-accent/40 text-foreground"}`}>
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <p className={`mt-1 flex items-center gap-1 text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    <span>{shortTime(m.created_at)}</span>
                    {mine && (m.read_at
                      ? <CheckCheck className="size-3" aria-label="Lu" />
                      : <Check className="size-3" aria-label="Envoyé" />)}
                  </p>
                </div>
              </li>
            );
          })}
          {otherTyping && (
            <li className="flex justify-start">
              <div className="flex items-center gap-1 rounded-2xl bg-accent/40 px-3 py-2.5">
                <span className="size-1.5 animate-pulse rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                <span className="size-1.5 animate-pulse rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                <span className="size-1.5 animate-pulse rounded-full bg-muted-foreground" />
              </div>
            </li>
          )}
          <div ref={endRef} />
        </ul>
      </div>

      <form onSubmit={send} className="fixed inset-x-0 bottom-[88px] z-40 mx-auto flex max-w-[440px] gap-2 px-4">
        <input
          value={body}
          onChange={(e) => handleTyping(e.target.value)}
          placeholder="Votre message…"
          className="flex-1 rounded-2xl border border-border bg-background px-4 py-3 text-sm shadow-soft focus:border-brand-green focus:outline-none"
        />
        <button type="submit" disabled={!body.trim() || sending}
          className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-green text-primary-foreground shadow-soft transition active:scale-95 disabled:opacity-50">
          <Send className="size-5" />
        </button>
      </form>
    </MobileShell>
  );
}

function shortTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diff < 7) return d.toLocaleDateString("fr-FR", { weekday: "short" });
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}
