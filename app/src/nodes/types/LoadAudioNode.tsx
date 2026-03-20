import { useCallback, useState } from "react";
import { T, useEditor } from "tldraw";
import { LoadAudioIcon } from "../../components/icons/LoadAudioIcon";
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
  NodeMedia,
  NodeRow,
  updateNode,
} from "./shared";

export type LoadAudioNode = T.TypeOf<typeof LoadAudioNode>;
export const LoadAudioNode = T.object({
  type: T.literal("load_audio"),
  audioUrl: T.string.nullable(),
});

export class LoadAudioNodeDefinition extends NodeDefinition<LoadAudioNode> {
  static type = "load_audio";
  static validator = LoadAudioNode;
  title = "音频";
  heading = "音频";
  icon = (<LoadAudioIcon />);
  category = "input";

  getDefault(): LoadAudioNode {
    return {
      type: "load_audio",
      audioUrl: null,
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
        dataType: "audio",
      },
    };
  }

  async execute(
    _shape: NodeShape,
    node: LoadAudioNode,
  ): Promise<ExecutionResult> {
    await sleep(300);
    return { output: node.audioUrl };
  }

  getOutputInfo(shape: NodeShape, node: LoadAudioNode): InfoValues {
    return {
      output: {
        value: node.audioUrl,
        isOutOfDate: shape.props.isOutOfDate,
        dataType: "audio",
      },
    };
  }

  Component = LoadAudioNodeComponent;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function selectAudioFile(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "audio/*";
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

function LoadAudioNodeComponent({
  shape,
  node,
}: NodeComponentProps<LoadAudioNode>) {
  const editor = useEditor();
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("audio/")) return;
      const dataUrl = await readFileAsDataUrl(file);
      updateNode<LoadAudioNode>(editor, shape, (n) => ({
        ...n,
        audioUrl: dataUrl,
      }));
    },
    [editor, shape],
  );

  const handleBrowse = useCallback(async () => {
    const file = await selectAudioFile();
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
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

  return (
    <>
      <NodeRow>
        <button
          className="LoadImageNode-browse"
          onClick={handleBrowse}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {node.audioUrl ? "重新选择..." : "浏览..."}
        </button>
        {node.audioUrl && (
          <button
            className="LoadImageNode-clear"
            onClick={() =>
              updateNode<LoadAudioNode>(editor, shape, (n) => ({
                ...n,
                audioUrl: null,
              }))
            }
            onPointerDown={(e) => e.stopPropagation()}
            title="清空音频"
          >
            ×
          </button>
        )}
      </NodeRow>
      <div
        className={`NodeImagePreview ${isDragOver ? "NodeImagePreview_dragover" : ""}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {node.audioUrl ? (
          <NodeMedia src={node.audioUrl} alt="Loaded audio" mediaType="audio" />
        ) : (
          <div className="NodeImagePreview-empty">
            <span>
              {isDragOver ? "将音频拖到这里" : "拖拽音频到此处或点击浏览"}
            </span>
          </div>
        )}
      </div>
    </>
  );
}
