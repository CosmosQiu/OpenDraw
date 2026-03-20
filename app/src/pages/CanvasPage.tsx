// ==================== 画布编辑器页面 ====================
// 原有的画布编辑器功能，作为独立页面组件
// 通过react-router接收projectId参数
// =========================================================

import { useMemo, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Editor,
  Vec,
  TLComponents,
  Tldraw,
  TldrawOptions,
} from "tldraw";
import { CanvasProjectService } from "../agent/canvas/CanvasProjectService";
import {
  loadCanvasBridgeLatestSave,
  loadCanvasBridgeProject,
  loadCanvasBridgeUser,
} from "../agent/canvas/localProjectBridge";
import { getProjectId } from "../agent/canvas/room";
import {
  registerCanvasSkill,
  unregisterCanvasSkill,
} from "../agent/skill/CanvasSkillRegistry";
import { OnCanvasNodePicker } from "../components/OnCanvasNodePicker";
import { CanvasProjectHeader } from "../components/CanvasProjectHeader";
import { PipelineRegions } from "../components/PipelineRegions";
import { overrides, PipelineToolbar } from "../components/PipelineToolbar";
import {
  AiChatFileItem,
  AiChatMessage,
  AiChatOverlay,
  sendAiChatMessage,
} from "../components/AiChatOverlay";
import { MovieClawStylePanel } from "../components/MovieClawStylePanel";
import { MovieClawSidebarModal } from "../components/MovieClawSidebarModal";
import { ConnectionBindingUtil } from "../connection/ConnectionBindingUtil";
import { ConnectionShapeUtil } from "../connection/ConnectionShapeUtil";
import { keepConnectionsAtBottom } from "../connection/keepConnectionsAtBottom";
import { NodeShapeUtil } from "../nodes/NodeShapeUtil";
import { PointingPort } from "../ports/PointingPort";

const shapeUtils = [NodeShapeUtil, ConnectionShapeUtil];
const bindingUtils = [ConnectionBindingUtil];

const components: TLComponents = {
  InFrontOfTheCanvas: () => (
    <>
      <OnCanvasNodePicker />
      <PipelineRegions />
    </>
  ),
  StylePanel: MovieClawStylePanel,
  Toolbar: PipelineToolbar,
};

const options: Partial<TldrawOptions> = {
  actionShortcutsLocation: "menu",
  maxPages: 1,
};

function formatPendingFiles(files: AiChatFileItem[]) {
  return files.map(({ id, file }) => ({
    id,
    name: file.name,
    sizeLabel:
      file.size < 1024
        ? `${file.size} B`
        : file.size < 1024 * 1024
          ? `${(file.size / 1024).toFixed(1)} KB`
          : `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
  }));
}

export default function CanvasPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const activeProjectId = projectId?.trim() || "default";
  const [editor, setEditor] = useState<Editor | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarScreenPoint, setSidebarScreenPoint] = useState<Vec | null>(null);
  const [sidebarPagePoint, setSidebarPagePoint] = useState<Vec | null>(null);
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<AiChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [pendingFiles, setPendingFiles] = useState<AiChatFileItem[]>([]);
  const [latestSaveAt, setLatestSaveAt] = useState<string | null>(null);

  // 使用URL中的projectId或从room获取
  const persistenceKey = useMemo(() => getProjectId(activeProjectId), [activeProjectId]);
  const project = useMemo(() => loadCanvasBridgeProject(activeProjectId), [activeProjectId]);
  const user = useMemo(() => loadCanvasBridgeUser(), []);
  const latestSave = useMemo(
    () => loadCanvasBridgeLatestSave(activeProjectId) ?? (latestSaveAt ? { savedAt: latestSaveAt, nodeCount: 0, connectionCount: 0 } : null),
    [activeProjectId, latestSaveAt],
  );

  // 处理双击事件，显示侧边栏
  useEffect(() => {
    if (!editor) return;

    const handleDoubleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target === editor.getContainer() || target?.closest(".tl-canvas")) {
        const screenPoint = new Vec(e.clientX, e.clientY);
        setSidebarScreenPoint(screenPoint);
        setSidebarPagePoint(editor.screenToPage(screenPoint));
        setSidebarOpen(true);
      }
    };

    const container = editor.getContainer();
    container.addEventListener("dblclick", handleDoubleClick);

    return () => {
      container.removeEventListener("dblclick", handleDoubleClick);
    };
  }, [editor]);

  useEffect(() => {
    if (!editor) return;

    const projectService = new CanvasProjectService(editor);
    registerCanvasSkill(editor);

    const timer = window.setInterval(() => {
      const record = projectService.saveProject({ source: "autosave" });
      setLatestSaveAt(record.savedAt);
    }, 5000);

    return () => {
      window.clearInterval(timer);
      unregisterCanvasSkill();
    };
  }, [editor]);

  const handleSidebarClose = () => {
    setSidebarOpen(false);
    setSidebarScreenPoint(null);
    setSidebarPagePoint(null);
  };

  const handleManualSave = () => {
    if (!editor) return;
    const record = new CanvasProjectService(editor).saveProject({ source: "manual" });
    setLatestSaveAt(record.savedAt);
  };

  const handleExport = () => {
    if (!editor) return;
    new CanvasProjectService(editor).downloadProjectSnapshot({ source: "manual" });
  };

  const handleSendChat = async () => {
    const text = chatInput.trim();
    if (!text && pendingFiles.length === 0) return;

    const files = pendingFiles;
    const attachments = formatPendingFiles(files);
    const userMessage: AiChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: text || "[发送了文件]",
      attachments,
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setPendingFiles([]);

    const assistantText = await sendAiChatMessage({
      text,
      files: files.map((item) => item.file),
    });

    setChatMessages((prev) => [
      ...prev,
      {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        text: assistantText,
      },
    ]);
  };

  const handleBackToProjects = () => {
    navigate("/projects");
  };

  return (
    <div style={{ position: "fixed", inset: 0 }}>
      <CanvasProjectHeader
        project={project}
        user={user}
        latestSave={latestSave}
        onSave={handleManualSave}
        onExport={handleExport}
        onBack={handleBackToProjects}
      />
      <div className="movie-claw-canvas" style={{ width: "100%", height: "100%" }}>
        <Tldraw
          persistenceKey={persistenceKey}
          options={options}
          overrides={overrides}
          shapeUtils={shapeUtils}
          bindingUtils={bindingUtils}
          components={components}
          onMount={(editor) => {
            (window as any).editor = editor;
            setEditor(editor);
            editor.user.updateUserPreferences({
              isSnapMode: true,
              locale: "zh-cn",
            });
            editor.getStateDescendant("select")!.addChild(PointingPort);
            keepConnectionsAtBottom(editor);
          }}
        />
      </div>

      <AiChatOverlay
        isOpen={isAiChatOpen}
        onToggle={() => setIsAiChatOpen((value) => !value)}
        onClose={() => setIsAiChatOpen(false)}
        messages={chatMessages}
        input={chatInput}
        pendingFiles={pendingFiles}
        onInputChange={setChatInput}
        onSend={() => {
          void handleSendChat();
        }}
        onFilesSelected={(files) => {
          if (!files) return;
          setPendingFiles((prev) => [
            ...prev,
            ...Array.from(files).map((file, index) => ({
              id: `${Date.now()}-${index}-${file.name}`,
              file,
            })),
          ]);
        }}
        onRemovePendingFile={(fileId) => {
          setPendingFiles((prev) => prev.filter((file) => file.id !== fileId));
        }}
      />

      {editor && (
        <MovieClawSidebarModal
          isOpen={sidebarOpen}
          onClose={handleSidebarClose}
          editor={editor}
          screenPoint={sidebarScreenPoint}
          pagePoint={sidebarPagePoint}
        />
      )}
    </div>
  );
}
