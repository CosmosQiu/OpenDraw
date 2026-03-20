import { useMemo, useRef } from "react";

export interface AiChatFileItem {
  id: string;
  file: File;
}

export interface AiChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  attachments?: { id: string; name: string; sizeLabel: string }[];
}

interface AiChatOverlayProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  messages: AiChatMessage[];
  input: string;
  pendingFiles: AiChatFileItem[];
  onInputChange: (value: string) => void;
  onSend: () => void;
  onFilesSelected: (files: FileList | null) => void;
  onRemovePendingFile: (fileId: string) => void;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function sendAiChatMessage(_params: {
  text: string;
  files: File[];
}): Promise<string> {
  return "Agent 接口暂未接入，当前为前端占位对话界面。";
}

export function AiChatOverlay({
  isOpen,
  onToggle,
  onClose,
  messages,
  input,
  pendingFiles,
  onInputChange,
  onSend,
  onFilesSelected,
  onRemovePendingFile,
}: AiChatOverlayProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pendingFileSummaries = useMemo(
    () => pendingFiles.map(({ id, file }) => ({ id, name: file.name, sizeLabel: formatFileSize(file.size) })),
    [pendingFiles],
  );

  return (
    <>
      <button
        className={isOpen ? "AiChatLauncher AiChatLauncher_open" : "AiChatLauncher"}
        type="button"
        onClick={onToggle}
      >
        <span className="AiChatLauncher-badge">AI</span>
        <span className="AiChatLauncher-label">智能对话</span>
      </button>

      <aside className={isOpen ? "AiChatDrawer AiChatDrawer_open" : "AiChatDrawer"}>
        <div className="AiChatDrawer-header">
          <div>
            <div className="AiChatDrawer-title">AI 对话</div>
            <div className="AiChatDrawer-subtitle">当前为占位界面，后续可接入真实 agent</div>
          </div>
          <button className="AiChatDrawer-close" type="button" onClick={onClose}>
            关闭
          </button>
        </div>

        <div className="AiChatDrawer-messages">
          {messages.length === 0 ? (
            <div className="AiChatDrawer-empty">
              <div className="AiChatDrawer-empty-title">开始新的对话</div>
              <div className="AiChatDrawer-empty-text">支持输入文本、选择文件，并预留后续 agent 接入口。</div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={
                  message.role === "user"
                    ? "AiChatMessage AiChatMessage_user"
                    : "AiChatMessage AiChatMessage_assistant"
                }
              >
                <div className="AiChatMessage-role">
                  {message.role === "user" ? "你" : "AI"}
                </div>
                <div className="AiChatMessage-bubble">
                  <div className="AiChatMessage-text">{message.text}</div>
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="AiChatMessage-files">
                      {message.attachments.map((file) => (
                        <div key={file.id} className="AiChatMessage-file">
                          <span>{file.name}</span>
                          <span>{file.sizeLabel}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="AiChatDrawer-composer">
          {pendingFileSummaries.length > 0 && (
            <div className="AiChatDrawer-pendingFiles">
              {pendingFileSummaries.map((file) => (
                <div key={file.id} className="AiChatDrawer-pendingFile">
                  <div>
                    <div className="AiChatDrawer-pendingFileName">{file.name}</div>
                    <div className="AiChatDrawer-pendingFileSize">{file.sizeLabel}</div>
                  </div>
                  <button type="button" onClick={() => onRemovePendingFile(file.id)}>
                    移除
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="AiChatDrawer-actions">
            <button
              className="AiChatDrawer-upload"
              type="button"
              onClick={() => fileInputRef.current?.click()}
            >
              上传文件
            </button>
            <input
              ref={fileInputRef}
              className="AiChatDrawer-fileInput"
              type="file"
              multiple
              onChange={(e) => {
                onFilesSelected(e.target.files);
                e.currentTarget.value = "";
              }}
            />
          </div>

          <div className="AiChatDrawer-inputRow">
            <textarea
              value={input}
              placeholder="输入你的问题或任务..."
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSend();
                }
              }}
            />
            <button className="AiChatDrawer-send" type="button" onClick={onSend}>
              发送
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
