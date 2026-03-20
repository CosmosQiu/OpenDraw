import { afterEach, describe, expect, it, vi } from "vitest";

import {
  apiGenerate,
  apiGenerateImage,
  apiGenerateText,
  apiGenerateVideo,
  apiReverse,
} from "./pipelineApi";

describe("pipelineApi", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("apiGenerate returns parsed JSON on success", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        images: [{ url: "/api/images/gen_1", mimeType: "image/png" }],
        selectedIndex: 0,
        seed: 7,
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await apiGenerate({
      model: "flux:flux-dev",
      prompt: "cat",
      seed: 7,
    });

    expect(result).toEqual({ imageUrl: "/api/images/gen_1", seed: 7 });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/generate-image",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }),
    );
  });

  it("apiGenerate throws backend message on non-2xx", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      json: vi.fn().mockResolvedValue({ error: "prompt is required" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      apiGenerate({
        model: "flux:flux-dev",
        prompt: "",
      }),
    ).rejects.toThrow("prompt is required");
  });

  it("apiGenerate wraps network error", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("network down"));
    vi.stubGlobal("fetch", fetchMock);

    const result = await apiGenerate({
      model: "flux:flux-dev",
      prompt: "cat",
    });

    expect(result.imageUrl).toContain("data:image/svg+xml");
  });

  it("apiGenerateImage falls back to placeholder data when future endpoint is unavailable", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("offline"));
    vi.stubGlobal("fetch", fetchMock);

    const result = await apiGenerateImage({
      model: "flux:flux-dev",
      prompt: "cat astronaut",
      count: 2,
    });

    expect(result.placeholder).toBe(true);
    expect(result.images).toHaveLength(2);
    expect(result.selectedIndex).toBe(0);
  });

  it("apiGenerateVideo returns placeholder data when endpoint responds 404", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
      json: vi.fn().mockResolvedValue({ error: "missing" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await apiGenerateVideo({
      model: "runway:gen3",
      prompt: "cinematic forest",
      durationSeconds: 5,
    });

    expect(result.placeholder).toBe(true);
    expect(result.videoUrl).toContain("data:image/svg+xml");
  });

  it("apiReverse returns placeholder text when future endpoint is unavailable", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("offline"));
    vi.stubGlobal("fetch", fetchMock);

    const result = await apiReverse({
      model: "openai:gpt-4.1-mini",
      mediaUrl: "/api/images/ref_1",
      mediaType: "image",
    });

    expect(result.placeholder).toBe(true);
    expect(result.text).toContain("Placeholder reverse prompt");
  });

  it("apiGenerateText coerces input to string before request", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ text: "ok" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await apiGenerateText({
      input: 123 as unknown as string,
      prompt: "describe",
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.body).toBe(JSON.stringify({ input: "123", prompt: "describe" }));
  });
});
