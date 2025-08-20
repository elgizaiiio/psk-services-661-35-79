import { supabase } from "@/integrations/supabase/client";

export async function callGameApi(action: string, payload?: any) {
  const { data, error } = await supabase.functions.invoke("game-api", {
    body: { action, payload: { ...payload } },
  });
  if (error) throw error;
  return data as any;
}
