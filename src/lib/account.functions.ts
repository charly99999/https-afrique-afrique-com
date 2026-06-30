import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;

    // Sécurité : un administrateur ne peut pas auto-supprimer son compte
    // (risque de perdre l'unique compte admin).
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: roles, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .limit(1);
    if (roleError) throw new Error("Vérification du compte impossible.");
    const isAdmin = !!roles?.length;
    if (isAdmin) {
      throw new Error(
        "Les comptes administrateurs ne peuvent pas être supprimés depuis l'application."
      );
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
