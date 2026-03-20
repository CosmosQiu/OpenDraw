export type DocumentParseStatus = "ready" | "metadata_only";

export interface FrontendDocumentPayload {
  kind: "document";
  name: string;
  extension: "doc" | "md" | "txt";
  mimeType: string;
  textContent: string;
  sourceDataUrl?: string;
  metadata: {
    size: number;
    uploadedAt: string;
    parseStatus: DocumentParseStatus;
    parser: string;
  };
}

export interface GenerateTextSkillConfig {
  skillName: string;
  handlerKey: string;
  version: string;
  paramsSchema: string;
  editableConfig: Record<string, string>;
}

export function serializeDocumentPayload(
  payload: FrontendDocumentPayload,
): string {
  return JSON.stringify(payload);
}

export function parseDocumentPayload(
  value: string | null | undefined,
): FrontendDocumentPayload | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Partial<FrontendDocumentPayload>;
    if (parsed.kind !== "document") return null;
    if (!parsed.name || !parsed.extension || !parsed.mimeType) return null;
    return {
      kind: "document",
      name: parsed.name,
      extension: parsed.extension,
      mimeType: parsed.mimeType,
      textContent: parsed.textContent ?? "",
      sourceDataUrl: parsed.sourceDataUrl,
      metadata: {
        size: parsed.metadata?.size ?? 0,
        uploadedAt: parsed.metadata?.uploadedAt ?? new Date(0).toISOString(),
        parseStatus: parsed.metadata?.parseStatus ?? "metadata_only",
        parser: parsed.metadata?.parser ?? "movieclaw.frontend.placeholder",
      },
    };
  } catch {
    return null;
  }
}

export function buildDocumentPreviewText(
  payload: FrontendDocumentPayload | null,
  fallback?: string,
): string | undefined {
  if (payload) {
    const suffix = payload.metadata.parseStatus === "metadata_only" ? "（仅元数据）" : "";
    return `${payload.name}${suffix}`;
  }
  return fallback;
}
