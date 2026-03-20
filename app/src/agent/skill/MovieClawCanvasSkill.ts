import { Editor } from "tldraw";
import { CanvasNodeService } from "../canvas/CanvasNodeService";
import { CanvasProjectService } from "../canvas/CanvasProjectService";
import { MovieClawCanvasSkillApi } from "../canvas/contracts";

export class MovieClawCanvasSkill implements MovieClawCanvasSkillApi {
  private readonly nodeService: CanvasNodeService;
  private readonly projectService: CanvasProjectService;

  constructor(private readonly editor: Editor) {
    this.nodeService = new CanvasNodeService(editor);
    this.projectService = new CanvasProjectService(editor);
  }

  listAvailableNodes() {
    return this.nodeService.listAvailableNodes();
  }

  listCanvasNodes() {
    return this.nodeService.listCanvasNodes();
  }

  createNode(input: Parameters<CanvasNodeService["createNode"]>[0]) {
    return this.nodeService.createNode(input);
  }

  updateNode(input: Parameters<CanvasNodeService["updateNode"]>[0]) {
    return this.nodeService.updateNode(input);
  }

  deleteNode(nodeId: Parameters<CanvasNodeService["deleteNode"]>[0]) {
    return this.nodeService.deleteNode(nodeId);
  }

  connectNodes(input: Parameters<CanvasNodeService["connectNodes"]>[0]) {
    return this.nodeService.connectNodes(input);
  }

  disconnectNodes(input: Parameters<CanvasNodeService["disconnectNodes"]>[0]) {
    return this.nodeService.disconnectNodes(input);
  }

  getCanvasSnapshot() {
    return this.projectService.getSnapshot();
  }

  saveProject(input?: Parameters<CanvasProjectService["saveProject"]>[0]) {
    return this.projectService.saveProject(input);
  }

  downloadProjectSnapshot(
    input?: Parameters<CanvasProjectService["downloadProjectSnapshot"]>[0],
  ) {
    return this.projectService.downloadProjectSnapshot(input);
  }

  listProjectSaves() {
    return this.projectService.listProjectSaves();
  }

  getEditor() {
    return this.editor;
  }
}
