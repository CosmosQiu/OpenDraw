import { describe, expect, it, vi } from "vitest";

import { apiReverse } from "../../api/pipelineApi";
import { ReverseNodeDefinition } from "./ReverseNode";

vi.mock("../nodeTypes", () => ({}));

vi.mock("../../api/pipelineApi", () => ({
  apiReverse: vi.fn(),
}));

describe("ReverseNodeDefinition.execute", () => {
  it("passes media input to reverse API and stores text output", async () => {
    const apiReverseMock = vi.mocked(apiReverse);
    apiReverseMock.mockResolvedValue({
      text: "cinematic close-up of a fox in snow",
    });

    const editor = {
      updateShape: vi.fn(),
    } as any;

    const definition = new ReverseNodeDefinition(editor);
    const shape = {
      id: "shape:reverse",
      type: "node",
      props: {
        node: {
          type: "reverse",
          model: "openai:gpt-4.1-mini",
          lastResultText: null,
        },
        isOutOfDate: false,
      },
    } as any;

    const result = await definition.execute(shape, shape.props.node, {
      media: "/api/videos/input.mp4",
    });

    expect(apiReverseMock).toHaveBeenCalledWith({
      model: "openai:gpt-4.1-mini",
      mediaUrl: "/api/videos/input.mp4",
      mediaType: "video",
    });
    expect(editor.updateShape).toHaveBeenCalledWith(
      expect.objectContaining({
        props: expect.objectContaining({
          node: expect.objectContaining({
            lastResultText: "cinematic close-up of a fox in snow",
          }),
        }),
      }),
    );
    expect(result).toEqual({ output: "cinematic close-up of a fox in snow" });
  });
});
