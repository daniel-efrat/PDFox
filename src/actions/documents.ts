"use server";

import { supabase, supabaseAdmin } from "@/lib/supabase";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { revalidatePath } from "next/cache";

/**
 * Ensures a user exists in our database based on their Clerk profile.
 */
async function getOrCreateUser() {
  const supabaseServer = createSupabaseServerClient();
  const { data: authData, error: authErr } = await supabaseServer.auth.getUser();
  if (authErr || !authData?.user) throw new Error("Unauthorized");

  const user = authData.user;

  const email = user.email ?? "";
  const name = user.user_metadata?.full_name || user.email || "User";

  const { data: upserted, error: upsertError } = await supabaseAdmin
    .from("User")
    .upsert(
      {
        clerkId: user.id,
        email,
        name,
        image: user.user_metadata?.avatar_url,
      },
      { onConflict: "clerkId" }
    )
    .select("id, clerkId")
    .maybeSingle();

  if (upsertError || !upserted) {
    console.error("[getOrCreateUser] upsert error", upsertError);
    throw new Error("Failed to create user");
  }

  return upserted;
}

export async function uploadDocument(formData: FormData) {
  const supabaseServer = createSupabaseServerClient();
  const { data: authData, error: authErr } = await supabaseServer.auth.getUser();
  if (authErr || !authData?.user) throw new Error("Unauthorized");
  const userId = authData.user.id;

  const file = formData.get("file") as File;
  if (!file) throw new Error("No file provided");

  const dbUser = await getOrCreateUser();

  // 1. Upload to Supabase Storage
  const fileExtension = file.name.split(".").pop();
  const fileId = `${userId}/${crypto.randomUUID()}.${fileExtension}`;
  
  const { data: storageData, error: storageError } = await supabase.storage
    .from("pdfs")
    .upload(fileId, file);

  if (storageError) {
    console.error("Supabase Storage Error:", storageError);
    throw new Error("Failed to upload file to storage");
  }

  // Get Public URL
  const { data: { publicUrl } } = supabase.storage
    .from("pdfs")
    .getPublicUrl(fileId);

  // 2. Save to Supabase Postgres
  const { data: document, error: docError } = await supabaseAdmin
    .from("Document")
    .insert({
      title: file.name,
      fileId: fileId,
      fileUrl: publicUrl,
      ownerId: dbUser.id,
    })
    .select("*")
    .maybeSingle();

  if (docError || !document) {
    console.error("[uploadDocument] insert error", docError);
    throw new Error("Failed to save document");
  }

  revalidatePath("/dashboard");
  return document;
}

export async function getDocuments() {
  const supabaseServer = createSupabaseServerClient();
  const { data: authData, error: authErr } = await supabaseServer.auth.getUser();
  if (authErr || !authData?.user) return [];
  const userId = authData.user.id;

  try {
    const { data: dbUser, error: userError } = await supabaseAdmin
      .from("User")
      .select("id")
      .eq("clerkId", userId)
      .maybeSingle();

    if (userError) throw userError;
    if (!dbUser) return [];

    const { data: docs, error: docsError } = await supabaseAdmin
      .from("Document")
      .select("*")
      .eq("ownerId", dbUser.id)
      .eq("isTrashed", false)
      .order("updatedAt", { ascending: false });

    if (docsError) throw docsError;
    return docs ?? [];
  } catch (error) {
    console.error("[getDocuments] DB error:", (error as Error).message);
    return [];
  }
}

export async function deleteDocument(id: string) {
  const supabaseServer = createSupabaseServerClient();
  const { data: authData, error: authErr } = await supabaseServer.auth.getUser();
  if (authErr || !authData?.user) throw new Error("Unauthorized");
  const userId = authData.user.id;

  const { data: dbUser, error: userError } = await supabaseAdmin
    .from("User")
    .select("id")
    .eq("clerkId", userId)
    .maybeSingle();

  if (userError) throw userError;
  if (!dbUser) throw new Error("User not found");

  const { data: doc, error: docError } = await supabaseAdmin
    .from("Document")
    .select("id, fileId")
    .eq("id", id)
    .eq("ownerId", dbUser.id)
    .maybeSingle();

  if (docError) throw docError;
  if (!doc) throw new Error("Document not found");

  // 1. Delete from Storage
  await supabase.storage.from("pdfs").remove([doc.fileId]);

  // 2. Delete from DB
  const { error: delError } = await supabaseAdmin
    .from("Document")
    .delete()
    .eq("id", id)
    .eq("ownerId", dbUser.id);

  if (delError) throw delError;

  revalidatePath("/dashboard");
}

export async function getDashboardStats() {
  const supabaseServer = createSupabaseServerClient();
  const { data: authData, error: authErr } = await supabaseServer.auth.getUser();
  if (authErr || !authData?.user) return { totalDocs: 0, totalSize: 0, signatures: 0 };
  const userId = authData.user.id;

  try {
    const { data: dbUser, error: userError } = await supabaseAdmin
      .from("User")
      .select("id")
      .eq("clerkId", userId)
      .maybeSingle();

    if (userError) throw userError;
    if (!dbUser) return { totalDocs: 0, totalSize: 0, signatures: 0 };

    const [docsCountRes, sigCountRes] = await Promise.all([
      supabaseAdmin.from("Document").select("id", { count: "exact", head: true }).eq("ownerId", dbUser.id),
      supabaseAdmin.from("Signature").select("id", { count: "exact", head: true }).eq("userId", dbUser.id),
    ]);

    if (docsCountRes.error) throw docsCountRes.error;
    if (sigCountRes.error) throw sigCountRes.error;

    return {
      totalDocs: docsCountRes.count ?? 0,
      signatures: sigCountRes.count ?? 0,
      totalSize: 0,
    };
  } catch (error) {
    console.error("[getDashboardStats] DB error:", (error as Error).message);
    return { totalDocs: 0, totalSize: 0, signatures: 0 };
  }
}

export async function getDocument(id: string) {
  const supabaseServer = createSupabaseServerClient();
  const { data: authData, error: authErr } = await supabaseServer.auth.getUser();
  if (authErr || !authData?.user) throw new Error("Unauthorized");
  const userId = authData.user.id;

  const { data: dbUser, error: userError } = await supabaseAdmin
    .from("User")
    .select("id")
    .eq("clerkId", userId)
    .maybeSingle();

  if (userError) throw userError;
  if (!dbUser) throw new Error("User not found");

  const { data: document, error: docError } = await supabaseAdmin
    .from("Document")
    .select("*")
    .eq("id", id)
    .eq("ownerId", dbUser.id)
    .maybeSingle();

  if (docError) throw docError;
  if (!document) throw new Error("Document not found");

  return document;
}
