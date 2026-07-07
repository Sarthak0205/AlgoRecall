import { redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export async function redirectIfAuthenticated() {
  const { data } = await supabase.auth.getSession();
  if (data.session) {
    throw redirect({
      to: "/dashboard",
    });
  }
}
