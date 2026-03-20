import { describe, expect, it, vi } from "vitest";

import { apiGenerateText } from "../../api/pipelineApi";
import { serializeDocumentPayload } from "../../documents/documentPayload";
import { GenerateTextNodeDefinition } from "./GenerateTextNode";

vi.mock("../nodeTypes", () => ({}));

vi.mock("../../api/pipelineApi", () => ({
  apiGenerateText: vi.fn(),
}));

describe("GenerateTextNodeDefinition.execute", () => {
  it("forwards serialized document payload mode and skill config", async () => {
    const apiGenerateTextMock = vi.mocked(apiGenerateText);
    apiGenerateTextMock.mockResolvedValue({ text: "generated text" });

    const documentPayload = serializeDocumentPayload({
      kind: "document",
      name: "story.md",
      extension: "md",
      mimeType: "text/markdown",
      textContent: "Once upon a time",
      metadata: {
        size: 12,
        uploadedAt: "2026-03-20T00:00:00.000Z",
        parseStatus: "ready",
        parser: "movieclaw.frontend.text",
      },
    });

    const editor = {
      updateShape: vi.fn(),
    } as any;

    const definition = new GenerateTextNodeDefinition(editor);
    const shape = {
      id: "shape:generate-text",
      type: "node",
      props: {
        node: {
          type: "generate_text",
          mode: "scene_description",
          skillConfigJson: JSON.stringify({
            skillName: "scene-describer",
            handlerKey: "generate_text.scene_description",
            version: "v1",
            paramsSchema: "document+prompt",
            editableConfig: { detailLevel: "high" },
          }),
          lastResultText: null,
        },
        isOutOfDate: false,
      },
    } as any;

    const result = await definition.execute(shape, shape.props.node, {
      document: documentPayload,
      prompt: "describe it",
    });

    expect(apiGenerateTextMock).toHaveBeenCalledWith({
      input: "Once upon a time",
      mode: "scene_description",
      document: documentPayload,
      prompt: "describe it",
      skillConfigJson: JSON.stringify({
        skillName: "scene-describer",
        handlerKey: "generate_text.scene_description",
        version: "v1",
        paramsSchema: "document+prompt",
        editableConfig: { detailLevel: "high" },
      }),
    });
    expect(editor.updateShape).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "shape:generate-text",
        props: expect.objectContaining({
          isOutOfDate: true,
          node: expect.objectContaining({
            lastResultText: "generated text",
          }),
        }),
      }),
    );
    expect(result).toEqual({ output: "generated text" });
  });

  it("uses mode default prompt and undefined document input when ports are empty", async () => {
    const apiGenerateTextMock = vi.mocked(apiGenerateText);
    apiGenerateTextMock.mockResolvedValue({ text: "fallback" });

    const editor = {
      updateShape: vi.fn(),
    } as any;

    const definition = new GenerateTextNodeDefinition(editor);
    const shape = {
      id: "shape:generate-text-default",
      type: "node",
      props: {
        node: {
          type: "generate_text",
          mode: "character_bio",
          skillConfigJson: JSON.stringify({
            skillName: "character-bio-writer",
            handlerKey: "generate_text.character_bio",
            version: "v1",
            paramsSchema: "document+prompt",
            editableConfig: { outputStyle: "narrative" },
          }),
          lastResultText: null,
        },
        isOutOfDate: false,
      },
    } as any;

    await definition.execute(shape, shape.props.node, {
      document: null,
      prompt: null,
    });

    expect(apiGenerateTextMock).toHaveBeenCalledWith({
      input: undefined,
      mode: "character_bio",
      document: undefined,
      prompt: "请根据文档内容生成完整的角色小传。",
      skillConfigJson: JSON.stringify({
        skillName: "character-bio-writer",
        handlerKey: "generate_text.character_bio",
        version: "v1",
        paramsSchema: "document+prompt",
        editableConfig: { outputStyle: "narrative" },
      }),
    });
  });
});
