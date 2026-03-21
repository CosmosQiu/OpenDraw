export interface ProviderModelOption {
  value: string;
  label: string;
  providerModel: string;
}

export const IMAGE_MODEL_OPTIONS: ProviderModelOption[] = [
  {
    value: "gemini-3.1-flash-image-preview",
    label: "gemini-3.1-flash-image-preview",
    providerModel: "gemini-3.1-flash-image-preview",
  },
  {
    value: "doubao-seedream-5-0-260128",
    label: "doubao-seedream-5-0-260128",
    providerModel: "doubao-seedream-5-0-260128",
  },
  {
    value: "kling-image-o3",
    label: "可灵图片O3",
    providerModel: "kling-image-o3",
  },
  {
    value: "grok-imagine-image",
    label: "Grok-Imagine-Image",
    providerModel: "grok-imagine-image",
  },
  {
    value: "z-image",
    label: "Z-Image",
    providerModel: "z-image",
  },
  {
    value: "flux-2-klein-4b",
    label: "Flux-2-Klein-4B",
    providerModel: "flux-2-klein-4b",
  },
  {
    value: "viduq2",
    label: "Viduq2（图片生成）",
    providerModel: "viduq2",
  },
  {
    value: "gemini-3-pro-image-preview",
    label: "gemini-3-pro-image-preview",
    providerModel: "gemini-3-pro-image-preview",
  },
  {
    value: "gpt-image-1-mini",
    label: "gpt-image-1-mini",
    providerModel: "gpt-image-1-mini",
  },
];

export const VIDEO_MODEL_OPTIONS: ProviderModelOption[] = [
  { value: "viduq3-turbo", label: "viduq3-turbo", providerModel: "viduq3-turbo" },
  { value: "jimeng-3.0", label: "即梦视频生成 3.0", providerModel: "jimeng-3.0" },
  { value: "kling-o3", label: "Kling O3 视频生成", providerModel: "kling-o3" },
  {
    value: "doubao-seedance-1-5-pro-251215",
    label: "doubao-seedance-1-5-pro-251215",
    providerModel: "doubao-seedance-1-5-pro-251215",
  },
  { value: "wan2.6-t2v", label: "wan2.6-t2v", providerModel: "wan2.6-t2v" },
  { value: "wan2.6-i2v", label: "wan2.6-i2v", providerModel: "wan2.6-i2v" },
  { value: "hailuo-02", label: "MiniMax-Hailuo-2.3", providerModel: "hailuo-02" },
  { value: "veo3.1-pro", label: "veo3.1-pro", providerModel: "veo3.1-pro" },
  { value: "sora-2-pro", label: "Sora-2-pro（官方格式）", providerModel: "sora-2-pro" },
  { value: "wanx2.1-t2v-turbo", label: "wanx2.1-t2v-turbo", providerModel: "wanx2.1-t2v-turbo" },
  { value: "wanx2.1-t2v-plus", label: "wanx2.1-t2v-plus", providerModel: "wanx2.1-t2v-plus" },
  { value: "wan2.2-t2v-plus", label: "wan2.2-t2v-plus", providerModel: "wan2.2-t2v-plus" },
  { value: "wan2.5-t2v-preview", label: "wan2.5-t2v-preview", providerModel: "wan2.5-t2v-preview" },
  { value: "pika-2.2", label: "Pika 2.2", providerModel: "pika-2.2" },
  { value: "runway-gen3", label: "Runway Gen-3", providerModel: "runway-gen3" },
  { value: "luma-dream-machine", label: "Luma Dream Machine", providerModel: "luma-dream-machine" },
];

export const MUSIC_MODEL_OPTIONS: ProviderModelOption[] = [
  { value: "Suno V5", label: "Suno V5", providerModel: "suno-v5" },
  { value: "Suno V4.5", label: "Suno V4.5", providerModel: "suno-v4.5" },
  { value: "Suno V4", label: "Suno V4", providerModel: "suno-v4" },
  { value: "Suno V3.5", label: "Suno V3.5", providerModel: "suno-v3.5" },
  { value: "Stable Audio 2.5", label: "Stable Audio 2.5", providerModel: "stable-audio-2.5" },
  { value: "Stable Audio 2", label: "Stable Audio 2", providerModel: "stable-audio-2" },
  { value: "Udio 1.5", label: "Udio 1.5", providerModel: "udio-1.5" },
  { value: "Udio 1.0", label: "Udio 1.0", providerModel: "udio-1.0" },
];

function buildModelMap(options: ProviderModelOption[]) {
  return new Map(options.map((option) => [option.value, option.providerModel]));
}

const imageModelMap = buildModelMap(IMAGE_MODEL_OPTIONS);
const videoModelMap = buildModelMap(VIDEO_MODEL_OPTIONS);
const musicModelMap = buildModelMap(MUSIC_MODEL_OPTIONS);

export function resolve302ImageModel(model: string) {
  return imageModelMap.get(model) ?? model;
}

export function resolve302VideoModel(model: string) {
  return videoModelMap.get(model) ?? model;
}

export function resolve302MusicModel(model: string) {
  return musicModelMap.get(model) ?? model;
}
