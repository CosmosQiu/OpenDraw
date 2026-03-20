import { useCallback, useMemo, useState } from "react";
import { T, useEditor } from "tldraw";
import { LoadDocumentIcon } from "../../components/icons/LoadDocumentIcon";
import {
  buildDocumentPreviewText,
  FrontendDocumentPayload,
  serializeDocumentPayload,
} from "../../documents/documentPayload";
import {
  NODE_HEADER_HEIGHT_PX,
  NODE_IMAGE_PREVIEW_HEIGHT_PX,
  NODE_ROW_HEIGHT_PX,
  NODE_WIDTH_PX,
} from "../../constants";
import { ShapePort } from "../../ports/Port";
import { sleep } from "../../utils/sleep";
import { NodeShape } from "../NodeShapeUtil";
import {
  ExecutionResult,
  InfoValues,
  NodeComponentProps,
  NodeDefinition,
  NodeRow,
  updateNode,
} from "./shared";

const ACCEPTED_DOCUMENT_EXTENSIONS = ["doc", "md", "txt"] as const;
type DocumentExtension = (typeof ACCEPTED_DOCUMENT_EXTENSIONS)[number];

export type LoadDocumentNode = T.TypeOf<typeof LoadDocumentNode>;
export const LoadDocumentNode = T.object({
  type: T.literal("load_document"),
  documentPayload: T.string.nullable(),
});

export class LoadDocumentNodeDefinition extends NodeDefinition<LoadDocumentNode> {
  static type = "load_document";
  static validator = LoadDocumentNode;
  title = "文档";
  heading = "文档";
  icon = (<LoadDocumentIcon />);
  category = "input";

  getDefault(): LoadDocumentNode {
    return {
      type: "load_document",
      documentPayload: null,
    };
  }

  getBodyHeightPx() {
    return NODE_ROW_HEIGHT_PX + NODE_IMAGE_PREVIEW_HEIGHT_PX;
  }

  getPorts(): Record<string, ShapePort> {
    return {
      output: {
        id: "output",
        x: NODE_WIDTH_PX,
        y: NODE_HEADER_HEIGHT_PX / 2,
        terminal: "start",
        dataType: "text",
      },
    };
  }

  async execute(
    _shape: NodeShape,
    node: LoadDocumentNode,
  ): Promise<ExecutionResult> {
    await sleep(300);
    return { output: node.documentPayload };
  }

  getOutputInfo(shape: NodeShape, node: LoadDocumentNode): InfoValues {
    return {
      output: {
        value: node.documentPayload,
        isOutOfDate: shape.props.isOutOfDate,
        dataType: "text",
      },
    };
  }

  Component = LoadDocumentNodeComponent;
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function getFileExtension(file: File): DocumentExtension | null {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!ext) return null;
  return ACCEPTED_DOCUMENT_EXTENSIONS.includes(ext as DocumentExtension)
    ? (ext as DocumentExtension)
    : null;
}

function selectDocumentFile(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".doc,.md,.txt,text/markdown,text/plain,application/msword";
    input.style.display = "none";

    const dispose = () => {
      input.removeEventListener("change", onChange);
      input.removeEventListener("cancel", onCancel);
      input.remove();
    };

    const onChange = (event: Event) => {
      const fileList = (event.target as HTMLInputElement).files;
      resolve(fileList && fileList.length > 0 ? fileList[0] : null);
      dispose();
    };

    const onCancel = () => {
      resolve(null);
      dispose();
    };

    document.body.appendChild(input);
    input.addEventListener("cancel", onCancel);
    input.addEventListener("change", onChange);
    input.click();
  });
}

async function createDocumentPayload(file: File): Promise<FrontendDocumentPayload | null> {
  const extension = getFileExtension(file);
  if (!extension) return null;

  const sourceDataUrl = await readFileAsDataUrl(file);
  const baseMetadata = {
    size: file.size,
    uploadedAt: new Date().toISOString(),
  };

  if (extension === "md" || extension === "txt") {
    const textContent = await readFileAsText(file);
    return {
      kind: "document",
      name: file.name,
      extension,
      mimeType: file.type || (extension === "md" ? "text/markdown" : "text/plain"),
      textContent,
      sourceDataUrl,
      metadata: {
        ...baseMetadata,
        parseStatus: "ready",
        parser: "movieclaw.frontend.text",
      },
    };
  }

  return {
    kind: "document",
    name: file.name,
    extension,
    mimeType: file.type || "application/msword",
    textContent: "",
    sourceDataUrl,
    metadata: {
      ...baseMetadata,
      parseStatus: "metadata_only",
      parser: "movieclaw.frontend.doc-placeholder",
    },
  };
}

function LoadDocumentNodeComponent({
  shape,
  node,
}: NodeComponentProps<LoadDocumentNode>) {
  const editor = useEditor();
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const payload = useMemo(() => {
    if (!node.documentPayload) return null;
    try {
      return JSON.parse(node.documentPayload) as FrontendDocumentPayload;
    } catch {
      return null;
    }
  }, [node.documentPayload]);

  const handleFile = useCallback(
    async (file: File) => {
      const payload = await createDocumentPayload(file);
      if (!payload) {
        setError("仅支持 doc、md、txt 格式");
        return;
      }
      setError(null);
      updateNode<LoadDocumentNode>(editor, shape, (n) => ({
        ...n,
        documentPayload: serializeDocumentPayload(payload),
      }));
    },
    [editor, shape],
  );

  const handleBrowse = useCallback(async () => {
    const file = await selectDocumentFile();
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) void handleFile(file);
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const previewText = buildDocumentPreviewText(payload);

  return (
    <>
      <NodeRow>
        <button
          className="LoadImageNode-browse"
          onClick={handleBrowse}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {node.documentPayload ? "重新选择..." : "浏览..."}
        </button>
        {node.documentPayload && (
          <button
            className="LoadImageNode-clear"
            onClick={() =>
              updateNode<LoadDocumentNode>(editor, shape, (n) => ({
                ...n,
                documentPayload: null,
              }))
            }
            onPointerDown={(e) => e.stopPropagation()}
            title="清空文档"
          >
            ×
          </button>
        )}
      </NodeRow>
      <div
        className={`NodeImagePreview LoadDocumentNode-preview ${isDragOver ? "NodeImagePreview_dragover" : ""}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {payload ? (
          <div className="LoadDocumentNode-content">
            <div className="LoadDocumentNode-name">{previewText}</div>
            <div className="LoadDocumentNode-meta">
              {payload.extension.toUpperCase()} · {payload.metadata.parseStatus === "ready" ? "已提取文本" : "仅元数据"}
            </div>
            <div className="LoadDocumentNode-snippet">
              {payload.textContent ? payload.textContent.slice(0, 180) : "当前文档仅保留文件内容与元数据占位，后续可由智能体或后端继续解析。"}
            </div>
          </div>
        ) : (
          <div className="NodeImagePreview-empty">
            <span>
              {isDragOver ? "将文档拖到这里" : error ?? "拖拽文档到此处或点击浏览"}
            </span>
          </div>
        )}
      </div>
    </>
  );
}
