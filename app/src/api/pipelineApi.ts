const API_BASE_URL =
  (import.meta.env.VITE_WORKER_API_BASE_URL as string | undefined)?.replace(
    /\/$/,
    "",
  ) ?? "";

const API_ERROR_PREFIX = "__pipeline_api_error__:";

function buildApiUrl(path: string) {
  return API_BASE_URL ? `${API_BASE_URL}${path}` : path;
}

export interface GenerateImageParams {
  model: string;
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  aspectRatio?: string;
  count?: number;
  steps?: number;
  cfgScale?: number;
  seed?: number;
  referenceImageUrl?: string;
}

export interface GeneratedImage {
  url: string;
  mimeType: string;
}

export interface GenerateImageResult {
  images: GeneratedImage[];
  selectedIndex: number;
  seed: number;
  placeholder?: boolean;
}

export interface GenerateVideoParams {
  model: string;
  mode?: "text_to_video" | "first_last_frame" | "multi_image_reference";
  prompt: string;
  width?: number;
  height?: number;
  aspectRatio?: string;
  durationSeconds?: number;
  referenceImageUrl?: string;
  startImageUrl?: string;
  endImageUrl?: string;
  referenceImageUrls?: string[];
  seed?: number;
}

export interface GenerateVideoResult {
  videoUrl: string;
  mimeType: string;
  seed: number;
  placeholder?: boolean;
}

export interface GenerateMusicParams {
  model: string;
  prompt: string;
  durationSeconds?: number;
  referenceAudioUrl?: string;
  seed?: number;
}

export interface GenerateMusicResult {
  audioUrl: string;
  mimeType: string;
  seed: number;
  placeholder?: boolean;
}

export interface ReverseParams {
  model: string;
  mediaUrl: string;
  mediaType: "image" | "video" | "audio";
}

export interface ReverseResult {
  text: string;
  placeholder?: boolean;
}

export interface GenerateParams {
  model: string;
  prompt: string;
  negativePrompt?: string;
  steps?: number;
  cfgScale?: number;
  seed?: number;
  referenceImageUrl?: string;
}

export interface GenerateResult {
  imageUrl: string;
  seed: number;
}

function createSvgDataUrl(title: string, subtitle: string, accent: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1024" height="768" viewBox="0 0 1024 768">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#111827" />
          <stop offset="100%" stop-color="${accent}" />
        </linearGradient>
      </defs>
      <rect width="1024" height="768" fill="url(#bg)" rx="36" />
      <rect x="40" y="40" width="944" height="688" rx="28" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.16)" />
      <text x="80" y="130" fill="#ffffff" font-size="40" font-family="Arial, sans-serif" font-weight="700">${escapeXml(title)}</text>
      <foreignObject x="80" y="180" width="864" height="420">
        <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:Arial,sans-serif;color:#e5e7eb;font-size:28px;line-height:1.5;white-space:normal;word-break:break-word;">
          ${escapeXml(subtitle)}
        </div>
      </foreignObject>
      <text x="80" y="680" fill="#d1d5db" font-size="24" font-family="Arial, sans-serif">MovieClaw placeholder result</text>
    </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeSeed(seed?: number) {
  return seed ?? Math.floor(Math.random() * 100000);
}

async function parseError(response: Response, fallback: string) {
  const err = await response.json().catch(() => ({ error: response.statusText }));
  return (err as { error?: string; msg?: string }).error ??
    (err as { msg?: string }).msg ??
    fallback;
}

function createImagePlaceholderResult(
  params: GenerateImageParams,
): GenerateImageResult {
  const seed = normalizeSeed(params.seed);
  const count = Math.max(1, Math.min(4, params.count ?? 1));
  return {
    images: Array.from({ length: count }, (_, index) => ({
      url: createSvgDataUrl(
        `Image ${index + 1}`,
        params.prompt || "Placeholder image generation result",
        ["#7c3aed", "#2563eb", "#db2777", "#059669"][index % 4]!,
      ),
      mimeType: "image/svg+xml",
    })),
    selectedIndex: 0,
    seed,
    placeholder: true,
  };
}

function createVideoPlaceholderResult(
  params: GenerateVideoParams,
): GenerateVideoResult {
  const seed = normalizeSeed(params.seed);
  const modeLabel =
    params.mode === "first_last_frame"
      ? "First/Last Frame"
      : params.mode === "multi_image_reference"
        ? `Multi Reference (${params.referenceImageUrls?.length ?? 0})`
        : "Text to Video";
  return {
    videoUrl: createSvgDataUrl(
      `Video ${params.durationSeconds ?? 5}s · ${modeLabel}`,
      params.prompt || "Placeholder video generation result",
      "#0f766e",
    ),
    mimeType: "image/svg+xml",
    seed,
    placeholder: true,
  };
}

function createSilentWavDataUrl() {
  return "data:audio/wav;base64,UklGRlIAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YSwAAAAAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA";
}

function createMusicPlaceholderResult(
  params: GenerateMusicParams,
): GenerateMusicResult {
  const seed = normalizeSeed(params.seed);
  return {
    audioUrl: createSilentWavDataUrl(),
    mimeType: "audio/wav",
    seed,
    placeholder: true,
  };
}

function createReversePlaceholderResult(params: ReverseParams): ReverseResult {
  return {
    text: `Placeholder reverse prompt for ${params.mediaType} input using model ${params.model}. Source: ${params.mediaUrl.slice(0, 80)}${params.mediaUrl.length > 80 ? "..." : ""}`,
    placeholder: true,
  };
}

export async function apiGenerateImage(
  params: GenerateImageParams,
): Promise<GenerateImageResult> {
  try {
    const response = await fetch(buildApiUrl("/api/generate-image"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      if (response.status === 404 || response.status >= 500) {
        return createImagePlaceholderResult(params);
      }
      throw new Error(
        `${API_ERROR_PREFIX}${await parseError(response, "Image generation failed")}`,
      );
    }

    return (await response.json()) as GenerateImageResult;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.startsWith(API_ERROR_PREFIX)
    ) {
      throw new Error(error.message.slice(API_ERROR_PREFIX.length));
    }
    return createImagePlaceholderResult(params);
  }
}

export async function apiGenerateVideo(
  params: GenerateVideoParams,
): Promise<GenerateVideoResult> {
  try {
    const response = await fetch(buildApiUrl("/api/generate-video"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      if (response.status === 404 || response.status >= 500) {
        return createVideoPlaceholderResult(params);
      }
      throw new Error(
        `${API_ERROR_PREFIX}${await parseError(response, "Video generation failed")}`,
      );
    }

    return (await response.json()) as GenerateVideoResult;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.startsWith(API_ERROR_PREFIX)
    ) {
      throw new Error(error.message.slice(API_ERROR_PREFIX.length));
    }
    return createVideoPlaceholderResult(params);
  }
}

export async function apiGenerateMusic(
  params: GenerateMusicParams,
): Promise<GenerateMusicResult> {
  try {
    const response = await fetch(buildApiUrl("/api/generate-music"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      if (response.status === 404 || response.status >= 500) {
        return createMusicPlaceholderResult(params);
      }
      throw new Error(
        `${API_ERROR_PREFIX}${await parseError(response, "Music generation failed")}`,
      );
    }

    return (await response.json()) as GenerateMusicResult;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.startsWith(API_ERROR_PREFIX)
    ) {
      throw new Error(error.message.slice(API_ERROR_PREFIX.length));
    }
    return createMusicPlaceholderResult(params);
  }
}

export async function apiReverse(params: ReverseParams): Promise<ReverseResult> {
  try {
    const response = await fetch(buildApiUrl("/api/reverse"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      if (response.status === 404 || response.status >= 500) {
        return createReversePlaceholderResult(params);
      }
      throw new Error(
        `${API_ERROR_PREFIX}${await parseError(response, "Reverse prompt failed")}`,
      );
    }

    return (await response.json()) as ReverseResult;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.startsWith(API_ERROR_PREFIX)
    ) {
      throw new Error(error.message.slice(API_ERROR_PREFIX.length));
    }
    return createReversePlaceholderResult(params);
  }
}

export async function apiGenerate(
  params: GenerateParams,
): Promise<GenerateResult> {
  const result = await apiGenerateImage({
    ...params,
    count: 1,
  });
  return {
    imageUrl: result.images[result.selectedIndex]?.url ?? "",
    seed: result.seed,
  };
}

export interface GenerateTextParams {
  input?: string;
  mode?:
    | "character_bio"
    | "scene_description"
    | "sequence_description"
    | "storyboard_script"
    | "smart_analysis";
  document?: string;
  prompt: string;
  skillConfigJson?: string;
}

export interface GenerateTextResult {
  text: string;
}

export async function apiGenerateText(
  params: GenerateTextParams,
): Promise<GenerateTextResult> {
  const coercedParams = {
    ...params,
    input: params.input != null ? String(params.input) : undefined,
  };
  try {
    const response = await fetch(buildApiUrl("/api/generate-text"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(coercedParams),
    });

    if (!response.ok) {
      throw new Error(await parseError(response, "Text generation failed"));
    }

    return (await response.json()) as GenerateTextResult;
  } catch (e) {
    throw new Error(
      `Backend unavailable: ${e instanceof Error ? e.message : e}`,
    );
  }
}
