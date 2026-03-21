import { blobToDataUrl } from "../nodes/types/shared";

const DEFAULT_POLL_INTERVAL_MS = 3000;
const DEFAULT_POLL_TIMEOUT_MS = 10 * 60 * 1000;
const DEFAULT_302_BASE_URL = "https://api.302.ai";
const DEFAULT_STABLE_AUDIO_ROUTE = "/sd/v2beta/audio/stable-audio-2/text-to-audio?response_format=url";
const DEFAULT_WAVESPEED_RESULT_SUFFIX = "/result";
const ENABLE_302_DEBUG_LOG =
  import.meta.env.DEV || String(import.meta.env.VITE_302_DEBUG ?? "").toLowerCase() === "true";

type HttpMethod = "GET" | "POST";

type JsonRecord = Record<string, unknown>;

type RequestBody = JsonRecord | FormData | undefined;

interface RequestStrategy {
  url: string;
  contentType: "json" | "form";
  buildBody: () => RequestBody;
  resolveTaskId?: (payload: JsonRecord) => string | null;
  fetchResult?: (taskId: string, submitPayload: JsonRecord) => Promise<JsonRecord>;
}

interface ProviderEnvConfig {
  apiKey: string;
  baseUrl: string;
  routes: {
    chatCompletions: string;
    imageGenerations: string;
    imageEdits: string;
    videoGenerations: string;
    musicGenerations: string;
    taskStatusTemplate?: string;
  };
}

async function resolveStrategyResult<T>(
  taskId: string,
  strategy: RequestStrategy,
  submitPayload: JsonRecord,
  parseResult: (payload: JsonRecord) => T | null,
): Promise<T> {
  if (strategy.fetchResult) {
    const startedAt = Date.now();
    while (Date.now() - startedAt < DEFAULT_POLL_TIMEOUT_MS) {
      try {
        const resultPayload = await strategy.fetchResult(taskId, submitPayload);
        const direct = parseResult(resultPayload);
        if (direct) {
          return direct;
        }

        const dataRecord = resultPayload.data as JsonRecord | undefined;
        const status = extractTaskStatus(resultPayload);
        if (["failed", "error", "cancelled", "canceled"].includes(status)) {
          throw new Error(
            String(
              resultPayload.error ??
                resultPayload.message ??
                dataRecord?.error ??
                "302.AI 异步任务失败",
            ),
          );
        }
      } catch (error) {
        const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
        const shouldRetry =
          message.includes("http 500") ||
          message.includes("http 502") ||
          message.includes("http 503") ||
          message.includes("http 504") ||
          message.includes("internal server error") ||
          message.includes("404") ||
          message.includes("not found") ||
          message.includes("expired") ||
          message.includes("task_not_found");
        if (!shouldRetry) {
          throw error;
        }
      }

      await new Promise((resolve) => window.setTimeout(resolve, DEFAULT_POLL_INTERVAL_MS));
    }
    throw new Error("302.AI 任务轮询超时");
  }

  return await pollTaskResult(taskId, {
    parseResult,
  });
}

function isStableAudioModel(model: string) {
  return model.startsWith("stable-audio-");
}

function isSunoModel(model: string) {
  return model.startsWith("suno-");
}

function isHiggsLikeAudioModel(model: string) {
  return model.startsWith("udio-");
}

function toSunoMv(model: string) {
  if (model === "suno-v5") return "chirp-crow";
  if (model === "suno-v4.5") return "chirp-auk";
  if (model === "suno-v4") return "chirp-v4";
  return "chirp-v3-5";
}

function aspectRatioToVeoResolution(aspectRatio: string | undefined) {
  return aspectRatio === "9:16" ? "720p" : "720p";
}

function durationToJimengFrames(durationSeconds: number | undefined) {
  const seconds = durationSeconds ?? 5;
  return Math.max(1, Math.round(seconds * 24) + 1);
}

function aspectRatioToHailuoResolution(aspectRatio: string | undefined) {
  return aspectRatio === "9:16" ? "768P" : "1080P";
}

async function fetchBinaryAsDataUrl(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${getProviderEnvConfig().apiKey}` },
  });
  if (!response.ok) {
    throw new Error(`加载二进制结果失败: ${response.status}`);
  }
  const blob = await response.blob();
  return await blobToDataUrl(blob);
}

async function fetchJsonByAbsoluteUrl<T>(url: string): Promise<T> {
  const normalizedUrl = normalizeRemoteFetchUrl(url);
  const { apiKey } = getProviderEnvConfig();
  if (ENABLE_302_DEBUG_LOG) {
    console.info("[302] request", { method: "GET", url: normalizedUrl });
  }
  const response = await fetch(normalizedUrl, {
    method: "GET",
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    if (ENABLE_302_DEBUG_LOG) {
      console.error("[302] response error", {
        method: "GET",
        url: normalizedUrl,
        status: response.status,
        body: text,
      });
    }
    throw new Error(`HTTP ${response.status}: ${text || response.statusText}`);
  }
  const payload = (await response.json()) as T;
  if (ENABLE_302_DEBUG_LOG) {
    console.info("[302] response", { method: "GET", url: normalizedUrl, status: response.status, body: payload });
  }
  return payload;
}

function parseSize(size: string | undefined) {
  const [width, height] = (size ?? "").split("x").map((value) => Number(value));
  return {
    width: Number.isFinite(width) ? width : 1024,
    height: Number.isFinite(height) ? height : 1024,
  };
}

function normalizeSeedreamSize(size: string | undefined) {
  const { width, height } = parseSize(size);
  return Math.max(width, height) >= 3000 ? "4K" : "2K";
}

function normalizeKlingImageResolution(size: string | undefined) {
  const { width, height } = parseSize(size);
  const maxSide = Math.max(width, height);
  if (maxSide >= 3000) return "4k";
  if (maxSide >= 2000) return "2k";
  return "1k";
}

function normalizeViduResolution(size: string | undefined) {
  const { width, height } = parseSize(size);
  const maxSide = Math.max(width, height);
  if (maxSide >= 3000) return "4K";
  if (maxSide >= 2000) return "2K";
  return "1080p";
}

function sanitizeAssetUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const sanitized = value.trim().replace(/^["'`\s]+|["'`\s]+$/g, "");
  return sanitized.length > 0 ? sanitized : undefined;
}

function normalizeRemoteFetchUrl(url: string): string {
  const sanitized = sanitizeAssetUrl(url) ?? url;
  const { baseUrl } = getProviderEnvConfig();
  if (!baseUrl.startsWith("/")) return sanitized;
  try {
    const parsed = new URL(sanitized);
    if (parsed.hostname === "api.302.ai" || parsed.hostname === "api.302ai.cn") {
      return `${trimTrailingSlash(baseUrl)}${parsed.pathname}${parsed.search}`;
    }
  } catch {}
  return sanitized;
}

function normalizeSoraDuration(durationSeconds: number | undefined) {
  if (durationSeconds === 8 || durationSeconds === 12) return durationSeconds;
  return 4;
}

function normalizeWanDuration(durationSeconds: number | undefined) {
  if (durationSeconds === 10 || durationSeconds === 15) return durationSeconds;
  return 5;
}

function normalizeWanResolution(size: string | undefined, aspectRatio: string | undefined) {
  if (size === "1920x1080" || size === "1080x1920") return "1080p";
  if (size === "1280x720" || size === "720x1280") return "720p";
  return aspectRatio === "9:16" ? "720p" : "720p";
}

function getImageRequestStrategy(request: Provider302ImageRequest) {
  if (
    request.model === "gemini-3.1-flash-image-preview" ||
    request.model === "gemini-3-pro-image-preview"
  ) {
    return {
      url: `/google/v1/models/${encodeURIComponent(request.model)}?response_format=url`,
      contentType: "json" as const,
      buildBody: () => ({
        contents: [
          {
            parts: [
              { text: request.prompt },
              ...(request.referenceImageUrl ? [{ image_url: request.referenceImageUrl }] : []),
            ],
          },
        ],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
          ...(request.aspectRatio ? { imageConfig: { aspectRatio: request.aspectRatio } } : {}),
        },
      }),
    } satisfies RequestStrategy;
  }

  if (request.model === "doubao-seedream-5-0-260128") {
    return {
      url: "/doubao/images/generations",
      contentType: "json" as const,
      buildBody: () => ({
        model: request.model,
        prompt: request.prompt,
        size: normalizeSeedreamSize(request.size),
        response_format: "url",
        ...(request.referenceImageUrl ? { image: [request.referenceImageUrl] } : {}),
      }),
    } satisfies RequestStrategy;
  }

  if (request.model === "kling-image-o3") {
    return {
      url: "/klingai/mmu_omni_3_image",
      contentType: "json" as const,
      buildBody: () => ({
        prompt: request.prompt,
        aspect_ratio: request.aspectRatio ?? "1:1",
        img_resolution: normalizeKlingImageResolution(request.size),
        imageCount: 1,
        ...(request.referenceImageUrl ? { images: [request.referenceImageUrl] } : {}),
      }),
      resolveTaskId: (payload) =>
        ((payload.data as JsonRecord | undefined)?.task_id as string | undefined) ??
        extractTaskId(payload as TaskSubmitResponse),
      fetchResult: async (taskId) =>
        await fetchJson<JsonRecord>(
          buildUrl(getProviderEnvConfig().baseUrl, `/klingai/task/${encodeURIComponent(taskId)}/fetch`),
          "GET",
        ),
    } satisfies RequestStrategy;
  }

  if (request.model === "grok-imagine-image") {
    return {
      url: request.referenceImageUrl
        ? "/302/submit/grok-imagine-image-edit"
        : "/302/submit/grok-imagine-image",
      contentType: "json" as const,
      buildBody: () => ({
        prompt: request.prompt,
        aspect_ratio: request.aspectRatio ?? "1:1",
        ...(request.referenceImageUrl ? { image_url: request.referenceImageUrl } : {}),
      }),
    } satisfies RequestStrategy;
  }

  if (request.model === "z-image") {
    return {
      url: "/302/submit/z-image",
      contentType: "json" as const,
      buildBody: () => {
        const { width, height } = parseSize(request.size);
        return {
          prompt: request.prompt,
          image_size: { width, height },
          output_format: "png",
        };
      },
    } satisfies RequestStrategy;
  }

  if (request.model === "flux-2-klein-4b") {
    return {
      url: "/flux/v1/flux-2-klein-4b",
      contentType: "json" as const,
      buildBody: () => {
        const { width, height } = parseSize(request.size);
        return {
          prompt: request.prompt,
          width,
          height,
          sync: true,
          ...(request.referenceImageUrl ? { input_image: request.referenceImageUrl } : {}),
        };
      },
      resolveTaskId: (payload) => (payload.id as string | undefined) ?? extractTaskId(payload as TaskSubmitResponse),
      fetchResult: async (_taskId, submitPayload) => {
        const pollingUrl = submitPayload.polling_url;
        if (typeof pollingUrl !== "string" || pollingUrl.length === 0) {
          return submitPayload;
        }
        return await fetchJsonByAbsoluteUrl<JsonRecord>(pollingUrl);
      },
    } satisfies RequestStrategy;
  }

  if (request.model === "viduq2") {
    return {
      url: "/vidu/ent/v2/reference2image",
      contentType: "json" as const,
      buildBody: () => ({
        model: "viduq2",
        prompt: request.prompt,
        resolution: normalizeViduResolution(request.size),
        aspect_ratio: request.aspectRatio ?? "auto",
        images: request.referenceImageUrl ? [request.referenceImageUrl] : [],
      }),
      resolveTaskId: (payload) => (payload.task_id as string | undefined) ?? extractTaskId(payload as TaskSubmitResponse),
      fetchResult: async (taskId) =>
        await fetchJson<JsonRecord>(
          buildUrl(getProviderEnvConfig().baseUrl, `/vidu/ent/v2/tasks/${encodeURIComponent(taskId)}/creations`),
          "GET",
        ),
    } satisfies RequestStrategy;
  }

  return {
    url: request.referenceImageUrl ? getProviderEnvConfig().routes.imageEdits : getProviderEnvConfig().routes.imageGenerations,
    contentType: "json" as const,
    buildBody: () => ({
      model: request.model,
      prompt: request.prompt,
      size: request.size,
    }),
  } satisfies RequestStrategy;
}

function getVideoRequestStrategy(request: Provider302VideoRequest) {
  const startImageUrl = sanitizeAssetUrl(request.startImageUrl);
  const endImageUrl = sanitizeAssetUrl(request.endImageUrl);
  const referenceImageUrls = (request.referenceImageUrls ?? [])
    .map((url) => sanitizeAssetUrl(url))
    .filter((url): url is string => Boolean(url));

  if (
    request.model === "kling-o3" &&
    (request.mode === "image_to_video" || request.mode === "first_last_frame")
  ) {
    return {
      url: "/klingai/m2v_21_img2video_hq",
      contentType: "form" as const,
      buildBody: () => {
        const form = new FormData();
        if (startImageUrl) {
          form.append("input_image", startImageUrl);
        }
        if (request.mode === "first_last_frame" && endImageUrl) {
          form.append("tail_image", endImageUrl);
        }
        form.append("prompt", request.prompt);
        form.append("negative_prompt", "");
        form.append("cfg", "0.5");
        form.append("enable_audio", "false");
        return form;
      },
      resolveTaskId: (payload: JsonRecord) =>
        (((payload.data as JsonRecord | undefined)?.task as JsonRecord | undefined)?.id as string | undefined) ??
        extractTaskId(payload as TaskSubmitResponse),
      fetchResult: async (taskId: string) =>
        await fetchJson<JsonRecord>(
          buildUrl(getProviderEnvConfig().baseUrl, `/klingai/task/${encodeURIComponent(taskId)}/fetch`),
          "GET",
        ),
    };
  }

  if (request.model === "kling-o3" && request.mode === "multi_image_reference") {
    return {
      url: "/klingai/multi-image2video",
      contentType: "json" as const,
      buildBody: () => ({
        model_name: "kling-v1-6",
        image_list: referenceImageUrls
          .slice(0, 4)
          .map((image) => ({ image })),
        mode: "std",
        prompt: request.prompt,
        aspect_ratio: request.aspectRatio ?? "16:9",
        duration: request.durationSeconds === 10 ? 10 : 5,
        enable_audio: false,
      }),
      resolveTaskId: (payload) =>
        ((payload.data as JsonRecord | undefined)?.task_id as string | undefined) ??
        extractTaskId(payload as TaskSubmitResponse),
      fetchResult: async (taskId) =>
        await fetchJson<JsonRecord>(
          buildUrl(getProviderEnvConfig().baseUrl, `/klingai/task/${encodeURIComponent(taskId)}/fetch`),
          "GET",
        ),
    } satisfies RequestStrategy;
  }

  if (request.model === "jimeng-3.0") {
    return {
      url: "/doubao/drawing/jimengv30",
      contentType: "json" as const,
      buildBody: () => ({
        req_key: "jimeng_t2v_v30",
        prompt: request.prompt,
        ...(request.seed != null ? { seed: request.seed } : {}),
        frames: durationToJimengFrames(request.durationSeconds),
        aspect_ratio: request.aspectRatio ?? "16:9",
      }),
      resolveTaskId: (payload) => ((payload.data as JsonRecord | undefined)?.task_id as string | undefined) ?? extractTaskId(payload as TaskSubmitResponse),
      fetchResult: async (taskId) =>
        await fetchJson<JsonRecord>(
          buildUrl(getProviderEnvConfig().baseUrl, "/doubao/drawing/jimengv30_result"),
          "POST",
          {
            req_key: "jimeng_t2v_v30",
            task_id: taskId,
            req_json: JSON.stringify({ aigc_meta: {} }),
          },
        ),
    } satisfies RequestStrategy;
  }

  if (request.model === "hailuo-02") {
    return {
      url: "/minimaxi/v1/video_generation",
      contentType: "json" as const,
      buildBody: () => ({
        model: "MiniMax-Hailuo-02",
        prompt: request.prompt,
        duration: request.durationSeconds ?? 6,
        resolution: aspectRatioToHailuoResolution(request.aspectRatio),
      }),
    } satisfies RequestStrategy;
  }

  if (request.model === "pika-2.2") {
    return {
      url: "/pika/generate/2.2/pikascenes",
      contentType: "form" as const,
      buildBody: () => {
        const form = new FormData();
        (request.referenceImageUrls ?? []).forEach((imageUrl) => form.append("images", imageUrl));
        form.append("ingredientsMode", "reference");
        form.append("promptText", request.prompt);
        form.append("negativePrompt", "");
        if (request.seed != null) {
          form.append("seed", String(request.seed));
        }
        form.append("resolution", "1080p");
        form.append("duration", String(request.durationSeconds ?? 5));
        form.append("aspectRatio", request.aspectRatio ?? "16:9");
        return form;
      },
      resolveTaskId: (payload) => (payload.video_id as string | undefined) ?? extractTaskId(payload as TaskSubmitResponse),
      fetchResult: async (taskId) =>
        await fetchJson<JsonRecord>(
          buildUrl(getProviderEnvConfig().baseUrl, `/pika/task/${encodeURIComponent(taskId)}/fetch`),
          "GET",
        ),
    } satisfies RequestStrategy;
  }

  if (request.model === "runway-gen3") {
    return {
      url: "/runway/submit",
      contentType: "form" as const,
      buildBody: () => {
        const form = new FormData();
        form.append("text_prompt", request.prompt);
        form.append("seconds", String(request.durationSeconds ?? 10));
        if (request.seed != null) {
          form.append("seed", String(request.seed));
        }
        return form;
      },
      resolveTaskId: (payload) => ((payload.task as JsonRecord | undefined)?.id as string | undefined) ?? extractTaskId(payload as TaskSubmitResponse),
      fetchResult: async (taskId) =>
        await fetchJson<JsonRecord>(
          buildUrl(getProviderEnvConfig().baseUrl, `/runway/task/${encodeURIComponent(taskId)}/fetch`),
          "GET",
        ),
    } satisfies RequestStrategy;
  }

  if (request.model === "sora-2-pro" || request.model === "sora-2") {
    return {
      url:
        request.mode === "text_to_video"
          ? "/ws/api/v3/openai/sora-2/text-to-video-pro"
          : "/ws/api/v3/openai/sora-2/image-to-video-pro",
      contentType: "json" as const,
      buildBody: () => ({
        prompt: request.prompt,
        duration: normalizeSoraDuration(request.durationSeconds),
        ...(request.mode === "text_to_video"
          ? { size: request.aspectRatio === "9:16" ? "720*1280" : "1280*720" }
          : { resolution: "1080p" }),
        ...(request.mode === "image_to_video" && startImageUrl
          ? { image: startImageUrl }
          : {}),
        ...(request.mode === "first_last_frame" && startImageUrl && endImageUrl
          ? { image: startImageUrl, image_end: endImageUrl }
          : {}),
        ...(request.mode === "first_last_frame" && startImageUrl && !endImageUrl
          ? { image: startImageUrl }
          : {}),
        ...(request.mode === "multi_image_reference" && referenceImageUrls.length
          ? { image: referenceImageUrls[0] }
          : {}),
      }),
      resolveTaskId: (payload) => ((payload.data as JsonRecord | undefined)?.id as string | undefined) ?? extractTaskId(payload as TaskSubmitResponse),
      fetchResult: async (taskId, submitPayload) =>
        await fetchJsonByAbsoluteUrl<JsonRecord>(resolveWavespeedResultUrl(taskId, submitPayload)),
    } satisfies RequestStrategy;
  }

  if (request.model === "wan2.6-i2v" || request.model === "alibaba/wan-2.6/image-to-video") {
    return {
      url: "/ws/api/v3/alibaba/wan-2.6/image-to-video",
      contentType: "json" as const,
      buildBody: () => ({
        image: startImageUrl ?? referenceImageUrls[0],
        prompt: request.prompt,
        resolution: normalizeWanResolution(undefined, request.aspectRatio),
        duration: normalizeWanDuration(request.durationSeconds),
        shot_type: "single",
        enable_prompt_expansion: true,
        seed: request.seed ?? -1,
      }),
      resolveTaskId: (payload) => ((payload.data as JsonRecord | undefined)?.id as string | undefined) ?? extractTaskId(payload as TaskSubmitResponse),
      fetchResult: async (taskId, submitPayload) =>
        await fetchJsonByAbsoluteUrl<JsonRecord>(resolveWavespeedResultUrl(taskId, submitPayload)),
    } satisfies RequestStrategy;
  }

  if (request.model === "wan2.6-t2v" || request.model === "alibaba/wan-2.6/text-to-video") {
    return {
      url: "/ws/api/v3/alibaba/wan-2.6/text-to-video",
      contentType: "json" as const,
      buildBody: () => ({
        prompt: request.prompt,
        size: normalizeVideoSize(undefined, request.aspectRatio),
        duration: normalizeWanDuration(request.durationSeconds),
        shot_type: "single",
        enable_prompt_expansion: true,
        seed: request.seed ?? -1,
      }),
      resolveTaskId: (payload) => ((payload.data as JsonRecord | undefined)?.id as string | undefined) ?? extractTaskId(payload as TaskSubmitResponse),
      fetchResult: async (taskId, submitPayload) =>
        await fetchJsonByAbsoluteUrl<JsonRecord>(resolveWavespeedResultUrl(taskId, submitPayload)),
    } satisfies RequestStrategy;
  }

  if (request.model === "veo3.1-pro") {
    return {
      url: "/ws/api/v3/google/veo3",
      contentType: "json" as const,
      buildBody: () => ({
        aspect_ratio: request.aspectRatio ?? "16:9",
        duration: request.durationSeconds ?? 8,
        generate_audio: true,
        prompt: request.prompt,
        resolution: aspectRatioToVeoResolution(request.aspectRatio),
      }),
      resolveTaskId: (payload) => ((payload.data as JsonRecord | undefined)?.id as string | undefined) ?? extractTaskId(payload as TaskSubmitResponse),
      fetchResult: async (taskId, submitPayload) =>
        await fetchJsonByAbsoluteUrl<JsonRecord>(resolveWavespeedResultUrl(taskId, submitPayload)),
    } satisfies RequestStrategy;
  }

  return {
    url: getProviderEnvConfig().routes.videoGenerations,
    contentType: "json" as const,
    buildBody: () => ({
      model: request.model,
      input: {
        prompt: request.prompt,
        ...(request.mode === "first_last_frame" && startImageUrl
          ? { image_url: startImageUrl, last_image_url: endImageUrl }
          : {}),
        ...(request.mode === "image_to_video" && startImageUrl
          ? { image_url: startImageUrl }
          : {}),
        ...(request.mode === "multi_image_reference" && referenceImageUrls[0]
          ? { image_url: referenceImageUrls[0] }
          : {}),
      },
      parameters: {
        size: normalizeVideoSize(undefined, request.aspectRatio),
        duration: request.durationSeconds ? String(request.durationSeconds) : undefined,
        prompt_extend: true,
        ...(request.seed != null ? { seed: request.seed } : {}),
        mode: request.mode === "image_to_video" ? "first_last_frame" : request.mode,
        reference_image_urls: referenceImageUrls,
      },
    }),
  };
}

function getMusicRequestStrategy(request: Provider302MusicRequest) {
  if (isHiggsLikeAudioModel(request.model)) {
    return {
      url: "/302/v2/higgs_audio/smart_voice/task",
      contentType: "json" as const,
      buildBody: () => ({
        is_multi_speaker: false,
        input_text: request.prompt,
        system_prompt: "Generate audio following instruction.",
      }),
      resolveTaskId: (payload) => (payload.task_id as string | undefined) ?? extractTaskId(payload as TaskSubmitResponse),
      fetchResult: async (taskId) => {
        const url = buildUrl(getProviderEnvConfig().baseUrl, `/302/v2/higgs_audio/smart_voice/task?task_id=${encodeURIComponent(taskId)}`);
        const audioDataUrl = await fetchBinaryAsDataUrl(url);
        return { data: [{ audio_url: audioDataUrl, mime_type: "audio/wav" }] } as JsonRecord;
      },
    } satisfies RequestStrategy;
  }

  if (isStableAudioModel(request.model)) {
    return {
      url: DEFAULT_STABLE_AUDIO_ROUTE,
      contentType: "form" as const,
      buildBody: () => {
        const form = new FormData();
        form.append("prompt", request.prompt);
        form.append("duration", String(request.durationSeconds ?? 30));
        form.append("seed", String(request.seed ?? normalizeSeed(undefined)));
        form.append("steps", "50");
        form.append("cfg_scale", "7");
        form.append("model", request.model);
        form.append("output_format", "mp3");
        return form;
      },
    };
  }

  return {
    url: getProviderEnvConfig().routes.musicGenerations,
    contentType: "json" as const,
    buildBody: () =>
      isSunoModel(request.model) && !request.referenceAudioUrl
        ? {
            gpt_description_prompt: request.prompt,
            mv: toSunoMv(request.model),
            make_instrumental: true,
          }
        : {
            prompt: request.prompt,
            title: request.prompt.slice(0, 30) || "MovieClaw Demo",
            tags: "cinematic, soundtrack",
            mv: isSunoModel(request.model) ? toSunoMv(request.model) : "chirp-crow",
            make_instrumental: !request.referenceAudioUrl,
            metadata: {
              duration_seconds: request.durationSeconds,
              reference_audio_url: request.referenceAudioUrl,
              seed: request.seed,
              create_mode: request.referenceAudioUrl ? "custom" : "auto",
            },
          },
    resolveTaskId: (payload: JsonRecord) =>
      (typeof payload.data === "string" ? payload.data : null) ??
      extractTaskId(payload as TaskSubmitResponse),
    fetchResult: isSunoModel(request.model)
      ? async (taskId: string) =>
          await fetchJson<JsonRecord>(
            buildUrl(getProviderEnvConfig().baseUrl, `/suno/fetch/${encodeURIComponent(taskId)}`),
            "GET",
          )
      : undefined,
  };
}

interface TaskSubmitResponse {
  taskId?: string;
  id?: string;
  output?: {
    task_id?: string;
    task_status?: string;
    [key: string]: unknown;
  };
  data?: {
    taskId?: string;
    id?: string;
    [key: string]: unknown;
  } | string;
  [key: string]: unknown;
}

interface PollTaskOptions<T> {
  intervalMs?: number;
  timeoutMs?: number;
  parseResult: (payload: JsonRecord) => T | null;
}

export interface Provider302ImageRequest {
  model: string;
  prompt: string;
  negativePrompt?: string;
  size?: string;
  count?: number;
  aspectRatio?: string;
  seed?: number;
  referenceImageUrl?: string;
}

export interface Provider302ImageResult {
  images: Array<{ url: string; mimeType: string }>;
  seed: number;
  selectedIndex: number;
}

export interface Provider302VideoRequest {
  model: string;
  prompt: string;
  mode: "text_to_video" | "image_to_video" | "first_last_frame" | "multi_image_reference";
  durationSeconds?: number;
  aspectRatio?: string;
  seed?: number;
  startImageUrl?: string;
  endImageUrl?: string;
  referenceImageUrls?: string[];
}

export interface Provider302VideoResult {
  videoUrl: string;
  mimeType: string;
  seed: number;
}

export interface Provider302MusicRequest {
  model: string;
  prompt: string;
  durationSeconds?: number;
  seed?: number;
  referenceAudioUrl?: string;
}

export interface Provider302MusicResult {
  audioUrl: string;
  mimeType: string;
  seed: number;
}

export interface Provider302TextRequest {
  model: string;
  prompt: string;
  systemPrompt?: string;
}

export interface Provider302TextResult {
  text: string;
}

function trimTrailingSlash(value: string | undefined): string {
  return (value ?? "").replace(/\/$/, "");
}

function normalizeRoute(value: string | undefined, fallback: string): string {
  const route = (value ?? fallback).trim();
  return route.startsWith("/") ? route : `/${route}`;
}

function buildUrl(baseUrl: string, route: string): string {
  return `${trimTrailingSlash(baseUrl)}${route.startsWith("/") ? route : `/${route}`}`;
}

function getProviderEnvConfig(): ProviderEnvConfig {
  const apiKey = import.meta.env.VITE_302_API_KEY?.trim();
  const configuredBaseUrl = trimTrailingSlash(import.meta.env.VITE_302_BASE_URL) || DEFAULT_302_BASE_URL;
  const baseUrl =
    import.meta.env.DEV && /^https:\/\/api\.302\.ai\/?$/i.test(configuredBaseUrl)
      ? "/302-api"
      : configuredBaseUrl;
  const taskStatusRouteTemplate = import.meta.env.VITE_302_TASK_STATUS_ROUTE_TEMPLATE?.trim();

  if (!apiKey) {
    throw new Error("缺少 VITE_302_API_KEY，无法调用 302.AI");
  }

  return {
    apiKey,
    baseUrl,
    routes: {
      chatCompletions: normalizeRoute(
        import.meta.env.VITE_302_ROUTE_CHAT_COMPLETIONS,
        "/v1/chat/completions",
      ),
      imageGenerations: normalizeRoute(
        import.meta.env.VITE_302_ROUTE_IMAGE_GENERATIONS,
        "/v1/images/generations",
      ),
      imageEdits: normalizeRoute(
        import.meta.env.VITE_302_ROUTE_IMAGE_EDITS,
        "/v1/images/edits",
      ),
      videoGenerations: normalizeRoute(
        import.meta.env.VITE_302_ROUTE_VIDEO_GENERATIONS,
        "/302/video/submit",
      ),
      musicGenerations: normalizeRoute(
        import.meta.env.VITE_302_ROUTE_MUSIC_GENERATIONS,
        "/suno/submit/music",
      ),
      taskStatusTemplate: taskStatusRouteTemplate
        ? normalizeRoute(taskStatusRouteTemplate, taskStatusRouteTemplate)
        : undefined,
    },
  };
}

function buildHeaders(apiKey: string, contentType = "application/json") {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": contentType,
  };
}

async function fetchJson<T>(url: string, method: HttpMethod, body?: JsonRecord): Promise<T> {
  const { apiKey } = getProviderEnvConfig();
  const headers = buildHeaders(apiKey);
  if (ENABLE_302_DEBUG_LOG) {
    console.info("[302] request", { method, url, body });
  }
  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    if (ENABLE_302_DEBUG_LOG) {
      console.error("[302] response error", { method, url, status: response.status, body: text });
    }
    throw new Error(`HTTP ${response.status}: ${text || response.statusText}`);
  }

  const payload = (await response.json()) as T;
  if (ENABLE_302_DEBUG_LOG) {
    console.info("[302] response", { method, url, status: response.status, body: payload });
  }
  return payload;
}

async function fetchWithBody<T>(
  url: string,
  method: HttpMethod,
  body?: RequestBody,
  contentType: "json" | "form" = "json",
): Promise<T> {
  const { apiKey } = getProviderEnvConfig();
  const headers =
    contentType === "form"
      ? { Authorization: `Bearer ${apiKey}` }
      : buildHeaders(apiKey);
  if (ENABLE_302_DEBUG_LOG) {
    console.info("[302] request", {
      method,
      url,
      contentType,
      body:
        contentType === "form"
          ? "[FormData]"
          : body,
    });
  }
  const response = await fetch(url, {
    method,
    headers,
    body:
      contentType === "form"
        ? (body as FormData | undefined)
        : body
          ? JSON.stringify(body)
          : undefined,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    if (ENABLE_302_DEBUG_LOG) {
      console.error("[302] response error", { method, url, status: response.status, body: text });
    }
    throw new Error(`HTTP ${response.status}: ${text || response.statusText}`);
  }

  const payload = (await response.json()) as T;
  if (ENABLE_302_DEBUG_LOG) {
    console.info("[302] response", { method, url, status: response.status, body: payload });
  }
  return payload;
}

function resolveWavespeedResultUrl(taskId: string, submitPayload: JsonRecord): string {
  const data = submitPayload.data as JsonRecord | undefined;
  const urls = data?.urls as JsonRecord | undefined;
  const getUrl = urls?.get;
  if (typeof getUrl === "string" && getUrl.length > 0) {
    return getUrl;
  }
  return `${trimTrailingSlash(getProviderEnvConfig().baseUrl)}/ws/api/v3/predictions/${encodeURIComponent(taskId)}${DEFAULT_WAVESPEED_RESULT_SUFFIX}`;
}

function extractTaskId(payload: TaskSubmitResponse): string | null {
  const dataRecord =
    typeof payload.data === "string"
      ? null
      : (payload.data as JsonRecord | undefined);
  return (
    ((dataRecord?.task as JsonRecord | undefined)?.id as string | undefined) ??
    payload.output?.task_id ??
    payload.taskId ??
    payload.id ??
    (typeof payload.data === "string" ? payload.data : undefined) ??
    (dataRecord?.taskId as string | undefined) ??
    (dataRecord?.id as string | undefined) ??
    null
  );
}

function normalizeTaskStatus(value: unknown): string {
  const status = String(value ?? "").trim().toLowerCase();
  if (status === "99") {
    return "completed";
  }
  return status;
}

function extractTaskStatus(payload: JsonRecord): string {
  const dataRecord = payload.data as JsonRecord | undefined;
  const outputRecord = payload.output as JsonRecord | undefined;
  const taskRecord = dataRecord?.task as JsonRecord | undefined;
  const workRecord = Array.isArray(dataRecord?.works)
    ? (dataRecord.works[0] as JsonRecord | undefined)
    : undefined;
  const workTaskRecord = workRecord?.task as JsonRecord | undefined;
  const candidates = [
    taskRecord?.status,
    workTaskRecord?.status,
    dataRecord?.task_status,
    outputRecord?.task_status,
    dataRecord?.status,
    payload.state,
    payload.status,
  ];
  for (const value of candidates) {
    const normalized = normalizeTaskStatus(value);
    if (normalized.length > 0) {
      return normalized;
    }
  }
  return "";
}

function normalizeVideoSize(size: string | undefined, aspectRatio: string | undefined): string | undefined {
  if (size && size.includes("x")) {
    return size.replace("x", "*");
  }

  switch (aspectRatio) {
    case "9:16":
      return "720*1280";
    case "1:1":
      return "960*960";
    case "4:3":
      return "1088*832";
    case "3:4":
      return "832*1088";
    case "16:9":
    default:
      return "1280*720";
  }
}

function resolveTaskStatusUrl(taskId: string): string {
  const config = getProviderEnvConfig();
  if (!config.routes.taskStatusTemplate) {
    throw new Error("缺少 VITE_302_TASK_STATUS_ROUTE_TEMPLATE，无法轮询异步任务状态");
  }
  return buildUrl(
    config.baseUrl,
    config.routes.taskStatusTemplate.replaceAll("{taskId}", encodeURIComponent(taskId)),
  );
}

async function pollTaskResult<T>(taskId: string, options: PollTaskOptions<T>): Promise<T> {
  const startedAt = Date.now();
  const intervalMs = options.intervalMs ?? DEFAULT_POLL_INTERVAL_MS;
  const timeoutMs = options.timeoutMs ?? DEFAULT_POLL_TIMEOUT_MS;

  while (Date.now() - startedAt < timeoutMs) {
    const payload = await fetchJson<JsonRecord>(resolveTaskStatusUrl(taskId), "GET");
    const parsed = options.parseResult(payload);
    if (parsed) {
      return parsed;
    }

    const status = extractTaskStatus(payload);
    if (["failed", "error", "cancelled", "canceled"].includes(status)) {
      throw new Error(
        String(
          payload.error ??
            payload.message ??
            (payload.data as JsonRecord | undefined)?.error ??
            "302.AI 异步任务失败",
        ),
      );
    }

    await new Promise((resolve) => window.setTimeout(resolve, intervalMs));
  }

  throw new Error("302.AI 任务轮询超时");
}

async function fetchAssetAsDataUrl(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`加载参考资源失败: ${response.status}`);
  }
  const blob = await response.blob();
  return await blobToDataUrl(blob);
}

function pickMediaList(payload: JsonRecord): Array<{ url: string; mimeType: string }> {
  const dataRecord = payload.data as JsonRecord | undefined;
  const taskResultRecord = dataRecord?.task_result as JsonRecord | undefined;
  const works = Array.isArray(dataRecord?.works)
    ? (dataRecord.works as JsonRecord[]).map((work) => {
        const resourceRecord = work.resource as JsonRecord | undefined;
        return {
          url:
            (typeof resourceRecord?.resource === "string" ? resourceRecord.resource : undefined) ??
            (typeof work.video_url === "string" ? work.video_url : undefined) ??
            (typeof work.url === "string" ? work.url : undefined),
          mimeType: "video/mp4",
        };
      })
    : null;
  const candidates = Array.isArray(payload.candidates)
    ? (payload.candidates as JsonRecord[])
        .flatMap((candidate) => {
          const content = candidate.content as JsonRecord | undefined;
          return Array.isArray(content?.parts) ? (content.parts as JsonRecord[]) : [];
        })
        .map((part) => ({ url: part.url }))
    : null;
  const creations = Array.isArray(payload.creations)
    ? (payload.creations as JsonRecord[]).map((item) => ({ url: item.url }))
    : null;
  const raw =
    (Array.isArray(payload.data) ? payload.data : null) ??
    (Array.isArray(dataRecord?.data)
      ? (dataRecord.data as unknown[])
      : null) ??
    (Array.isArray(dataRecord?.outputs)
      ? (dataRecord.outputs as unknown[])
      : null) ??
    (Array.isArray(taskResultRecord?.videos)
      ? (taskResultRecord.videos as unknown[])
      : null) ??
    (Array.isArray(dataRecord?.results)
      ? (dataRecord.results as unknown[])
      : null) ??
    works ??
    (Array.isArray(payload.results) ? payload.results : null) ??
    (Array.isArray(payload.images) ? payload.images : null) ??
    candidates ??
    creations ??
    (Array.isArray(payload.image_urls)
      ? (payload.image_urls as string[]).map((url) => ({ url }))
      : null) ??
    [];

  return raw
    .map((item) => {
      if (typeof item === "string") {
        const directUrl = sanitizeAssetUrl(item);
        if (!directUrl) return null;
        return {
          url: directUrl,
          mimeType: "application/octet-stream",
        };
      }
      const record = item as JsonRecord;
      const url =
        typeof record.url === "string"
          ? record.url
          : typeof record.b64_json === "string"
            ? `data:image/png;base64,${record.b64_json}`
            : typeof record.audio_url === "string"
              ? record.audio_url
              : typeof record.video_url === "string"
                ? record.video_url
              : typeof record.image === "string"
                ? record.image
                : typeof record.image_url === "string"
                  ? record.image_url
                  : typeof record.url === "string"
                    ? record.url
                : null;
      const sanitizedUrl = sanitizeAssetUrl(url ?? undefined);
      if (!sanitizedUrl) return null;
      return {
        url: sanitizedUrl,
        mimeType:
          typeof record.mimeType === "string"
            ? record.mimeType
            : typeof record.mime_type === "string"
              ? record.mime_type
              : "application/octet-stream",
      };
    })
    .filter((item): item is { url: string; mimeType: string } => item !== null);
}

function normalizeSeed(seed: number | undefined) {
  return seed ?? Math.floor(Math.random() * 100000);
}

export async function generate302Text(request: Provider302TextRequest): Promise<Provider302TextResult> {
  const config = getProviderEnvConfig();
  const payload = await fetchJson<JsonRecord>(
    buildUrl(config.baseUrl, config.routes.chatCompletions),
    "POST",
    {
    model: request.model,
    messages: [
      ...(request.systemPrompt
        ? [{ role: "system", content: request.systemPrompt }]
        : []),
      { role: "user", content: request.prompt },
    ],
    },
  );

  const choices = payload.choices as Array<JsonRecord> | undefined;
  const message = choices?.[0]?.message as JsonRecord | undefined;
  const content = message?.content;
  if (typeof content === "string") {
    return { text: content };
  }
  if (Array.isArray(content)) {
    const text = content
      .map((item) => (item as JsonRecord).text)
      .filter((item): item is string => typeof item === "string")
      .join("\n");
    return { text };
  }
  throw new Error("302.AI 文本接口未返回可解析内容");
}

export async function generate302Image(request: Provider302ImageRequest): Promise<Provider302ImageResult> {
  const config = getProviderEnvConfig();
  const strategy = getImageRequestStrategy(request);
  const defaultBody = strategy.buildBody();
  const payload = await fetchWithBody<JsonRecord>(
    buildUrl(config.baseUrl, strategy.url),
    "POST",
    strategy.contentType === "json" && strategy.url === (request.referenceImageUrl ? config.routes.imageEdits : config.routes.imageGenerations) && request.referenceImageUrl
      ? {
          ...(defaultBody as JsonRecord),
          image: await fetchAssetAsDataUrl(request.referenceImageUrl),
        }
      : defaultBody,
    strategy.contentType,
  );

  const images = pickMediaList(payload).map((item) => ({
    url: item.url,
    mimeType: item.mimeType === "application/octet-stream" ? "image/png" : item.mimeType,
  }));
  if (images.length > 0) {
    return {
      images,
      seed: normalizeSeed(request.seed),
      selectedIndex: 0,
    };
  }

  const taskId = strategy.resolveTaskId?.(payload) ?? extractTaskId(payload as TaskSubmitResponse);
  if (!taskId) {
    throw new Error("302.AI 图片接口未返回结果或 taskId");
  }

  return await resolveStrategyResult(taskId, strategy, payload, (taskPayload) => {
      const items = pickMediaList(taskPayload).map((item) => ({
        url: item.url,
        mimeType: item.mimeType === "application/octet-stream" ? "image/png" : item.mimeType,
      }));
      if (items.length === 0) return null;
      return {
        images: items,
        seed: normalizeSeed(request.seed),
        selectedIndex: 0,
      };
  });
}

export async function generate302Video(request: Provider302VideoRequest): Promise<Provider302VideoResult> {
  const config = getProviderEnvConfig();
  const strategy = getVideoRequestStrategy(request);
  const payload = await fetchWithBody<JsonRecord>(
    buildUrl(config.baseUrl, strategy.url),
    "POST",
    strategy.buildBody(),
    strategy.contentType,
  );

  const direct = pickMediaList(payload)[0];
  if (direct) {
    return {
      videoUrl: direct.url,
      mimeType: direct.mimeType === "application/octet-stream" ? "video/mp4" : direct.mimeType,
      seed: normalizeSeed(request.seed),
    };
  }

  const taskId = strategy.resolveTaskId?.(payload) ?? extractTaskId(payload as TaskSubmitResponse);
  if (!taskId) {
    throw new Error("302.AI 视频接口未返回结果或 taskId");
  }

  return await resolveStrategyResult(
    taskId,
    strategy,
    payload,
    (taskPayload) => {
      const media = pickMediaList(taskPayload)[0];
      if (!media) return null;
      return {
        videoUrl: media.url,
        mimeType: media.mimeType === "application/octet-stream" ? "video/mp4" : media.mimeType,
        seed: normalizeSeed(request.seed),
      };
    },
  );
}

export async function generate302Music(request: Provider302MusicRequest): Promise<Provider302MusicResult> {
  const config = getProviderEnvConfig();
  const strategy = getMusicRequestStrategy(request);
  const payload = await fetchWithBody<JsonRecord>(
    buildUrl(config.baseUrl, strategy.url),
    "POST",
    strategy.buildBody(),
    strategy.contentType,
  );

  const direct = pickMediaList(payload)[0];
  if (direct) {
    return {
      audioUrl: direct.url,
      mimeType: direct.mimeType === "application/octet-stream" ? "audio/mpeg" : direct.mimeType,
      seed: normalizeSeed(request.seed),
    };
  }

  const taskId = strategy.resolveTaskId?.(payload) ?? extractTaskId(payload as TaskSubmitResponse);
  if (!taskId) {
    throw new Error("302.AI 音频接口未返回结果或 taskId");
  }

  return await resolveStrategyResult(
    taskId,
    strategy,
    payload,
    (taskPayload) => {
      const media = pickMediaList(taskPayload)[0];
      if (!media) return null;
      return {
        audioUrl: media.url,
        mimeType: media.mimeType === "application/octet-stream" ? "audio/mpeg" : media.mimeType,
        seed: normalizeSeed(request.seed),
      };
    },
  );
}
