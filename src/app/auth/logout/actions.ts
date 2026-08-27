"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function logoutAction() {
    const supabase = await createClient();
    await supabase.auth.signOut();

    revalidatePath("/", "layout");
    redirect("/auth/login");
}