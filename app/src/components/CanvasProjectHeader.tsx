import { CanvasBridgeProject, CanvasBridgeSaveSummary, CanvasBridgeUser } from "../agent/canvas/localProjectBridge";

interface CanvasProjectHeaderProps {
  project: CanvasBridgeProject | null;
  user: CanvasBridgeUser | null;
  latestSave: CanvasBridgeSaveSummary | null;
  onSave: () => void;
  onExport: () => void;
  onBack: () => void;
}

function formatDateTime(value?: string) {
  if (!value) return "未保存";
  return new Date(value).toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function CanvasProjectHeader({ project, user, latestSave, onSave, onExport, onBack }: CanvasProjectHeaderProps) {
  return (
    <div className="CanvasProjectHeader">
      <div className="CanvasProjectHeader-left">
        <button className="CanvasProjectHeader-back" onClick={onBack}>
          返回项目页
        </button>
        <div className="CanvasProjectHeader-meta">
          <div className="CanvasProjectHeader-titleRow">
            <strong>{project?.name ?? "未命名项目"}</strong>
            <span>{project?.type ?? "画布"}</span>
          </div>
          <div className="CanvasProjectHeader-subtitle">
            <span>项目ID：{project?.canvasProjectId ?? "default"}</span>
            <span>最近保存：{formatDateTime(latestSave?.savedAt)}</span>
            {latestSave && (
              <span>
                节点 {latestSave.nodeCount} / 连线 {latestSave.connectionCount}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="CanvasProjectHeader-right">
        <div className="CanvasProjectHeader-user">
          <div className="CanvasProjectHeader-avatar">{user?.avatarText ?? "访"}</div>
          <div className="CanvasProjectHeader-userText">
            <strong>{user?.displayName ?? "访客"}</strong>
            <span>{user?.email ?? "未登录"}</span>
          </div>
        </div>
        <button className="CanvasProjectHeader-secondary" onClick={onExport}>
          导出 JSON
        </button>
        <button className="CanvasProjectHeader-primary" onClick={onSave}>
          保存项目
        </button>
      </div>
    </div>
  );
}
