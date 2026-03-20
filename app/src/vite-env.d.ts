/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_302_API_KEY?: string;
  readonly VITE_302_BASE_URL?: string;
  readonly VITE_302_ROUTE_CHAT_COMPLETIONS?: string;
  readonly VITE_302_ROUTE_IMAGE_GENERATIONS?: string;
  readonly VITE_302_ROUTE_IMAGE_EDITS?: string;
  readonly VITE_302_ROUTE_VIDEO_GENERATIONS?: string;
  readonly VITE_302_ROUTE_MUSIC_GENERATIONS?: string;
  readonly VITE_302_TASK_STATUS_ROUTE_TEMPLATE?: string;
  readonly VITE_WORKER_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
