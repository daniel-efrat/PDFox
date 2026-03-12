"use server";

import { supabase, supabaseAdmin } from "@/lib/supabase";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { revalidatePath } from "next/cache";
import { Annotation } from "@/types/editor";

const ANNOTATION_MARKER = "__PDFOX_ANNOTATIONS__:";

/**
 * Ensures a user exists in our database based on their Clerk profile.
 */
async function getOrCreateUser() {
  const supabaseServer = createSupabaseServerClient();
  const { data: authData, error: authErr } =
    await supabaseServer.auth.getUser();
  if (authErr || !authData?.user) throw new Error("Unauthorized");

  const user = authData.user;

  const email = user.email ?? "";
  const name = user.user_metadata?.full_name || user.email || "User";

  // 1) Try fetch existing user row.
  const { data: existing, error: existingErr } = await supabaseAdmin
    .from("User")
    .select("id, clerkId")
    .eq("clerkId", user.id)
    .maybeSingle();

  if (existingErr) {
    console.error("[getOrCreateUser] select error", existingErr);
    throw new Error("Failed to create user");
  }
  if (existing) return existing;

  // 2) Create the user row.
  // Use the Supabase auth user id as our DB id to keep it stable.
  const { data: inserted, error: insertErr } = await supabaseAdmin
    .from("User")
    .insert({
      id: user.id,
      clerkId: user.id,
      email,
      name,
      image: user.user_metadata?.avatar_url,
    })
    .select("id, clerkId")
    .maybeSingle();

  if (insertErr || !inserted) {
    console.error("[getOrCreateUser] insert error", insertErr);
    throw new Error("Failed to create user");
  }

  return inserted;
}

export async function uploadDocument(formData: FormData) {
  const supabaseServer = createSupabaseServerClient();
  const { data: authData, error: authErr } =
    await supabaseServer.auth.getUser();
  if (authErr || !authData?.user) throw new Error("Unauthorized");
  const userId = authData.user.id;

  const file = formData.get("file") as File;
  if (!file) throw new Error("No file provided");

  const dbUser = await getOrCreateUser();

  // 1. Upload to Supabase Storage
  const fileExtension = file.name.split(".").pop();
  const fileId = `${userId}/${crypto.randomUUID()}.${fileExtension}`;

  const { error: storageError } = await supabaseAdmin.storage
    .from("pdfs")
    .upload(fileId, file);

  if (storageError) {
    console.error("Supabase Storage Error:", storageError);
    throw new Error("Failed to upload file to storage");
  }

  // Get Public URL
  const {
    data: { publicUrl },
  } = supabaseAdmin.storage.from("pdfs").getPublicUrl(fileId);

  // 2. Save to Supabase Postgres
  const { data: document, error: docError } = await supabaseAdmin
    .from("Document")
    .insert({
      id: crypto.randomUUID(),
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
  const { data: authData, error: authErr } =
    await supabaseServer.auth.getUser();
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
  const { data: authData, error: authErr } =
    await supabaseServer.auth.getUser();
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
  const { data: authData, error: authErr } =
    await supabaseServer.auth.getUser();
  if (authErr || !authData?.user)
    return { totalDocs: 0, totalSize: 0, signatures: 0 };
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
      supabaseAdmin
        .from("Document")
        .select("id", { count: "exact", head: true })
        .eq("ownerId", dbUser.id),
      supabaseAdmin
        .from("Signature")
        .select("id", { count: "exact", head: true })
        .eq("userId", dbUser.id),
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
  const { data: authData, error: authErr } =
    await supabaseServer.auth.getUser();
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

export async function getDocumentAnnotations(id: string): Promise<Annotation[]> {
  const document = await getDocument(id);
  const rawAnnotations = (document as { annotations?: unknown })?.annotations;
  if (Array.isArray(rawAnnotations)) return rawAnnotations as Annotation[];

  const description = (document as { description?: unknown })?.description;
  if (typeof description !== "string") return [];
  if (!description.startsWith(ANNOTATION_MARKER)) return [];

  try {
    const parsed = JSON.parse(description.slice(ANNOTATION_MARKER.length));
    return Array.isArray(parsed) ? (parsed as Annotation[]) : [];
  } catch {
    return [];
  }
}

export async function saveDocumentAnnotations(
  id: string,
  annotations: Annotation[],
) {
  const supabaseServer = createSupabaseServerClient();
  const { data: authData, error: authErr } =
    await supabaseServer.auth.getUser();
  if (authErr || !authData?.user) throw new Error("Unauthorized");
  const userId = authData.user.id;

  const { data: dbUser, error: userError } = await supabaseAdmin
    .from("User")
    .select("id")
    .eq("clerkId", userId)
    .maybeSingle();

  if (userError) throw userError;
  if (!dbUser) throw new Error("User not found");

  const directSavePayload: Record<string, unknown> = {
    annotations,
    updatedAt: new Date().toISOString(),
  };

  const directSave = await supabaseAdmin
    .from("Document")
    .update(directSavePayload)
    .eq("id", id)
    .eq("ownerId", dbUser.id);

  if (!directSave.error) {
    revalidatePath(`/editor/${id}`);
    return;
  }

  const fallbackSave = await supabaseAdmin
    .from("Document")
    .update({
      description: `${ANNOTATION_MARKER}${JSON.stringify(annotations)}`,
      updatedAt: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("ownerId", dbUser.id);

  if (fallbackSave.error) throw fallbackSave.error;

  revalidatePath(`/editor/${id}`);
}

export type SignatureSlotType = "SIGNATURE" | "INITIALS";
export type SignatureImageUploadMode = "PNG_TRANSPARENT" | "PHOTO_WHITE_BG";

function resolveWithoutBgApiKey(): string | null {
  const candidates = [
    process.env.WITHOUTBG_API_KEY,
    process.env.WITHOUT_BG_API_KEY,
    process.env.WITHOUTBG_KEY,
    process.env.WITHOUTBG_API,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }

  return null;
}

export interface SavedSignatureSlot {
  id: string;
  slot: SignatureSlotType;
  data: string;
  imageUrl: string | null;
  updatedAt: string | null;
}

export async function getUserSignatureSlots(): Promise<SavedSignatureSlot[]> {
  const supabaseServer = createSupabaseServerClient();
  const { data: authData, error: authErr } =
    await supabaseServer.auth.getUser();
  if (authErr || !authData?.user) throw new Error("Unauthorized");
  const userId = authData.user.id;

  const { data: dbUser, error: userError } = await supabaseAdmin
    .from("User")
    .select("id")
    .eq("clerkId", userId)
    .maybeSingle();

  if (userError) throw userError;
  if (!dbUser) throw new Error("User not found");

  const { data, error } = await supabaseAdmin
    .from("Signature")
    .select("id, title, data, imageUrl, updatedAt")
    .eq("userId", dbUser.id)
    .in("title", ["SIGNATURE", "INITIALS"])
    .order("updatedAt", { ascending: false });

  if (error) throw error;

  const latestBySlot = new Map<SignatureSlotType, SavedSignatureSlot>();
  for (const row of data ?? []) {
    const slot = String(row.title).toUpperCase() as SignatureSlotType;
    if (slot !== "SIGNATURE" && slot !== "INITIALS") continue;
    if (latestBySlot.has(slot)) continue;

    latestBySlot.set(slot, {
      id: row.id,
      slot,
      data: row.data ?? "",
      imageUrl: row.imageUrl ?? null,
      updatedAt: row.updatedAt ?? null,
    });
  }

  return Array.from(latestBySlot.values());
}

export async function saveUserSignatureSlot(
  slot: SignatureSlotType,
  data: string,
  imageUrl: string | null,
) {
  const supabaseServer = createSupabaseServerClient();
  const { data: authData, error: authErr } =
    await supabaseServer.auth.getUser();
  if (authErr || !authData?.user) throw new Error("Unauthorized");
  const userId = authData.user.id;

  const { data: dbUser, error: userError } = await supabaseAdmin
    .from("User")
    .select("id")
    .eq("clerkId", userId)
    .maybeSingle();

  if (userError) throw userError;
  if (!dbUser) throw new Error("User not found");

  const normalizedSlot = slot === "INITIALS" ? "INITIALS" : "SIGNATURE";
  const now = new Date().toISOString();

  const { data: existingRows, error: existingError } = await supabaseAdmin
    .from("Signature")
    .select("id")
    .eq("userId", dbUser.id)
    .eq("title", normalizedSlot)
    .order("updatedAt", { ascending: false });

  if (existingError) throw existingError;

  const primaryExistingId = existingRows?.[0]?.id ?? null;

  if (primaryExistingId) {
    const { error: updateError } = await supabaseAdmin
      .from("Signature")
      .update({
        data,
        imageUrl,
        isDefault: true,
        updatedAt: now,
      })
      .eq("id", primaryExistingId)
      .eq("userId", dbUser.id);

    if (updateError) throw updateError;

    if ((existingRows?.length ?? 0) > 1) {
      const duplicateIds = existingRows!.slice(1).map((r) => r.id);
      const { error: dedupeError } = await supabaseAdmin
        .from("Signature")
        .delete()
        .in("id", duplicateIds)
        .eq("userId", dbUser.id);
      if (dedupeError) throw dedupeError;
    }
  } else {
    const { error: insertError } = await supabaseAdmin
      .from("Signature")
      .insert({
        id: crypto.randomUUID(),
        userId: dbUser.id,
        title: normalizedSlot,
        data,
        imageUrl,
        isDefault: true,
        createdAt: now,
        updatedAt: now,
      });

    if (insertError) throw insertError;
  }

  revalidatePath("/dashboard");
}

export async function deleteUserSignatureSlot(slot: SignatureSlotType) {
  const supabaseServer = createSupabaseServerClient();
  const { data: authData, error: authErr } =
    await supabaseServer.auth.getUser();
  if (authErr || !authData?.user) throw new Error("Unauthorized");
  const userId = authData.user.id;

  const { data: dbUser, error: userError } = await supabaseAdmin
    .from("User")
    .select("id")
    .eq("clerkId", userId)
    .maybeSingle();

  if (userError) throw userError;
  if (!dbUser) throw new Error("User not found");

  const normalizedSlot = slot === "INITIALS" ? "INITIALS" : "SIGNATURE";
  const { error } = await supabaseAdmin
    .from("Signature")
    .delete()
    .eq("userId", dbUser.id)
    .eq("title", normalizedSlot);

  if (error) throw error;
  revalidatePath("/dashboard");
}

export async function processSignatureUploadImage(
  imageDataUrl: string,
  mode: SignatureImageUploadMode,
): Promise<string> {
  const supabaseServer = createSupabaseServerClient();
  const { data: authData, error: authErr } =
    await supabaseServer.auth.getUser();
  if (authErr || !authData?.user) throw new Error("Unauthorized");

  if (typeof imageDataUrl !== "string" || !imageDataUrl.startsWith("data:image/")) {
    throw new Error("Invalid image payload");
  }

  if (mode === "PNG_TRANSPARENT") {
    return imageDataUrl;
  }

  const apiKey = resolveWithoutBgApiKey();
  if (!apiKey) {
    throw new Error(
      "withoutBG API key is not configured. Expected one of: WITHOUTBG_API_KEY, WITHOUT_BG_API_KEY, WITHOUTBG_KEY, WITHOUTBG_API. Restart dev server after updating env.",
    );
  }

  const commaIndex = imageDataUrl.indexOf(",");
  if (commaIndex < 0) {
    throw new Error("Invalid image format");
  }
  const imageBase64 = imageDataUrl.slice(commaIndex + 1);

  const response = await fetch(
    "https://api.withoutbg.com/v1.0/image-without-background-base64",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify({
        image_base64: imageBase64,
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`withoutBG request failed: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as {
    img_without_background_base64?: string;
  };
  if (!data?.img_without_background_base64) {
    throw new Error("withoutBG response is missing image data");
  }

  return `data:image/png;base64,${data.img_without_background_base64}`;
}
