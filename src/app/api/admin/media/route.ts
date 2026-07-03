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

function createAuthHeader(username: string, appPassword: string): string {
  return `Basic ${Buffer.from(`${username}:${appPassword}`).toString(
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
    const { BASE_URL, WORDPRESS_USERNAME, WORDPRESS_APP_PASSWORD } =
      getWordpressConfig();

    if (!WORDPRESS_USERNAME || !WORDPRESS_APP_PASSWORD) {
      throw new Error(
        "Missing WordPress media credentials. Set WORDPRESS_USERNAME and WORDPRESS_APP_PASSWORD for a WordPress user that can upload files.",
      );
    }

    const response = await fetch(`${BASE_URL}/wp-json/wp/v2/media`, {
      method: "POST",
      headers: {
        Authorization: createAuthHeader(
          WORDPRESS_USERNAME,
          WORDPRESS_APP_PASSWORD,
        ),
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
