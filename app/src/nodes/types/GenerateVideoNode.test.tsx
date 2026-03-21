import { describe, expect, it, vi } from "vitest";

import { apiGenerateVideo } from "../../api/pipelineApi";
import { GenerateVideoNodeDefinition } from "./GenerateVideoNode";

vi.mock("../nodeTypes", () => ({}));

vi.mock("../../api/pipelineApi", () => ({
  apiGenerateVideo: vi.fn(),
}));

describe("GenerateVideoNodeDefinition.execute", () => {
  it("builds params from inputs and stores generated video output", async () => {
    const apiGenerateVideoMock = vi.mocked(apiGenerateVideo);
    apiGenerateVideoMock.mockResolvedValue({
      videoUrl: "/api/videos/gen_clip.mp4",
      mimeType: "video/mp4",
      seed: 42,
    });

    const editor = {
      updateShape: vi.fn(),
    } as any;

    const definition = new GenerateVideoNodeDefinition(editor);
    const shape = {
      id: "shape:generate-video",
      type: "node",
      props: {
        node: {
          type: "generate_video",
          model: "kling-o3",
          mode: "multi_image_reference",
          referenceImageCount: 1,
          resolution: "1280x720",
          aspectRatio: "16:9",
          durationSeconds: 5,
          seed: 11,
          lastResultUrl: null,
          lastResultMimeType: null,
        },
        isOutOfDate: false,
      },
    } as any;

    const result = await definition.execute(shape, shape.props.node, {
      prompt: ["city", "timelapse"],
      reference_image_1: "/api/images/ref_1",
    });

    expect(apiGenerateVideoMock).toHaveBeenCalledWith({
      model: "kling-o3",
      mode: "multi_image_reference",
      prompt: "city, timelapse",
      width: 1280,
      height: 720,
      aspectRatio: "16:9",
      durationSeconds: 5,
      referenceImageUrl: "/api/images/ref_1",
      referenceImageUrls: ["/api/images/ref_1"],
      startImageUrl: undefined,
      endImageUrl: undefined,
    });
    expect(editor.updateShape).toHaveBeenCalledWith(
      expect.objectContaining({
        props: expect.objectContaining({
          node: expect.objectContaining({
            lastResultUrl: "/api/videos/gen_clip.mp4",
            lastResultMimeType: "video/mp4",
          }),
        }),
      }),
    );
    expect(result).toEqual({ output: "/api/videos/gen_clip.mp4" });
  });
});
