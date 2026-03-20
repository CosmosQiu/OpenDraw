import { beforeEach, describe, expect, it, vi } from "vitest";
import { CanvasProjectService } from "./CanvasProjectService";

function createEditorMock() {
  return {
    getSnapshot: vi.fn(() => ({ document: { id: "doc" } })),
    getCurrentPageShapes: vi.fn(() => [
      { type: "node" },
      { type: "node" },
      { type: "connection" },
    ]),
  } as any;
}

describe("CanvasProjectService", () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState({}, "", "/?room=test-room");
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:movieclaw-test"),
      revokeObjectURL: vi.fn(),
    });
  });

  it("saves current project snapshot into localStorage", () => {
    const editor = createEditorMock();
    const service = new CanvasProjectService(editor);

    const result = service.saveProject({ source: "manual" });

    expect(result.projectId).toBe("movie-claw:test-room");
    expect(result.source).toBe("manual");
    expect(result.saveMode).toBe("local_storage");
    expect(result.summary).toEqual({ nodeCount: 2, connectionCount: 1 });
    expect(service.listProjectSaves()).toHaveLength(1);
  });

  it("exports a downloadable snapshot record", () => {
    const editor = createEditorMock();
    const service = new CanvasProjectService(editor);
    const appendSpy = vi.spyOn(document.body, "appendChild");
    const removeSpy = vi.spyOn(document.body, "removeChild");

    const result = service.downloadProjectSnapshot({ source: "agent_skill" });

    expect(result.projectId).toBe("movie-claw:test-room");
    expect(result.saveMode).toBe("file_download");
    expect(appendSpy).toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalled();
  });
});
