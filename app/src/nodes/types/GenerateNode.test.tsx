import { describe, expect, it, vi } from "vitest";

import { apiGenerateImage } from "../../api/pipelineApi";
import { GenerateNodeDefinition } from "./GenerateNode";

vi.mock("../nodeTypes", () => ({}));

vi.mock("../../api/pipelineApi", () => ({
  apiGenerateImage: vi.fn(),
}));

describe("GenerateNodeDefinition.execute", () => {
  it("builds params from inputs and updates selected image output", async () => {
    const apiGenerateImageMock = vi.mocked(apiGenerateImage);
    apiGenerateImageMock.mockResolvedValue({
      images: [
        { url: "/api/images/gen_a", mimeType: "image/png" },
        { url: "/api/images/gen_b", mimeType: "image/png" },
      ],
      selectedIndex: 1,
      seed: 11,
    });

    const editor = {
      updateShape: vi.fn(),
    } as any;

    const definition = new GenerateNodeDefinition(editor);
    const shape = {
      id: "shape:generate",
      type: "node",
      props: {
        node: {
          type: "generate",
          model: "flux:flux-dev",
          resolution: "1024x768",
          aspectRatio: "4:3",
          count: 2,
          steps: 28,
          cfgScale: 9,
          seed: 11,
          lastResultUrl: null,
          lastResultMimeType: null,
          lastResultUrlsJson: null,
          selectedResultIndex: 0,
        },
        isOutOfDate: false,
      },
    } as any;

    const result = await definition.execute(
      shape,
      shape.props.node,
      {
        prompt: ["cat", null, "cinematic"],
        negative: "low quality",
        image: "/api/images/ref_1",
      },
    );

    expect(apiGenerateImageMock).toHaveBeenCalledWith({
      model: "flux:flux-dev",
      prompt: "cat, cinematic",
      negativePrompt: "low quality",
      width: 1024,
      height: 768,
      aspectRatio: "4:3",
      count: 2,
      steps: 28,
      cfgScale: 9,
      seed: 11,
      referenceImageUrl: "/api/images/ref_1",
    });
    expect(editor.updateShape).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "shape:generate",
        type: "node",
        props: expect.objectContaining({
          isOutOfDate: true,
          node: expect.objectContaining({
            lastResultUrl: "/api/images/gen_b",
            lastResultMimeType: "image/png",
            lastResultUrlsJson: JSON.stringify([
              "/api/images/gen_a",
              "/api/images/gen_b",
            ]),
            selectedResultIndex: 1,
          }),
        }),
      }),
    );
    expect(result).toEqual({ output: "/api/images/gen_b" });
  });

  it("falls back to default prompt when input prompt is missing", async () => {
    const apiGenerateImageMock = vi.mocked(apiGenerateImage);
    apiGenerateImageMock.mockResolvedValue({
      images: [{ url: "/api/images/gen_default", mimeType: "image/png" }],
      selectedIndex: 0,
      seed: 1,
    });

    const editor = {
      updateShape: vi.fn(),
    } as any;

    const definition = new GenerateNodeDefinition(editor);
    const shape = {
      id: "shape:generate-default",
      type: "node",
      props: {
        node: {
          type: "generate",
          model: "flux:flux-dev",
          resolution: "1024x768",
          aspectRatio: "4:3",
          count: 1,
          steps: 20,
          cfgScale: 7,
          seed: 1,
          lastResultUrl: null,
          lastResultMimeType: null,
          lastResultUrlsJson: null,
          selectedResultIndex: 0,
        },
        isOutOfDate: false,
      },
    } as any;

    await definition.execute(shape, shape.props.node, {});

    expect(apiGenerateImageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: "default",
      }),
    );
  });
});
