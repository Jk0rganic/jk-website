import { requireAdminSession } from "@/lib/admin/require-admin";
import { getWordpressConfig } from "@/lib/fetch/baseUrl";

type WordpressMediaResponse = {
  id: number;
  source_url?: string;
};

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function createAuthHeader(consumerKey: string, consumerSecret: string): string {
  return `Basic ${Buffer.from(`${consumerKey}:${consumerSecret}`).toString(
    "base64",
  )}`;
}

function sanitizeFilename(name: string): string {
  return name.replace(/["\\]/g, "");
}

export async function POST(request: Request) {
  const { error, status } = await requireAdminSession();

  if (error) {
    return Response.json({ error }, { status });
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return Response.json(
      { error: "Invalid multipart form data" },
      { status: 400 },
    );
  }

  const file = formData.get("file");

  if (!(file instanceof File)) {
    return Response.json({ error: "Image file is required" }, { status: 400 });
  }

  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return Response.json(
      { error: "Only image uploads are allowed" },
      { status: 400 },
    );
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return Response.json(
      { error: "Image must be 5MB or smaller" },
      { status: 400 },
    );
  }

  try {
    const { BASE_URL, CONSUMER_KEY, CONSUMER_SECRET } = getWordpressConfig();

    if (!CONSUMER_KEY || !CONSUMER_SECRET) {
      throw new Error("Missing WordPress media credentials");
    }

    const response = await fetch(`${BASE_URL}/wp-json/wp/v2/media`, {
      method: "POST",
      headers: {
        Authorization: createAuthHeader(CONSUMER_KEY, CONSUMER_SECRET),
        "Content-Disposition": `attachment; filename="${sanitizeFilename(
          file.name,
        )}"`,
        "Content-Type": file.type || "application/octet-stream",
      },
      body: await file.arrayBuffer(),
      cache: "no-store",
    });

    if (!response.ok) {
      let message = `WordPress media upload failed (${response.status})`;

      try {
        const data = await response.json();
        if (data && typeof data.message === "string") {
          message = data.message;
        }
      } catch {
        const text = await response.text();
        if (text) {
          message = text;
        }
      }

      throw new Error(message);
    }

    const media = (await response.json()) as WordpressMediaResponse;

    return Response.json(
      {
        media: {
          id: media.id,
          sourceUrl: media.source_url ?? null,
        },
      },
      { status: 201 },
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to upload media";
    return Response.json({ error: message }, { status: 500 });
  }
}
