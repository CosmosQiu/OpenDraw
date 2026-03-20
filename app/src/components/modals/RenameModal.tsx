// ==================== 重命名模态框 ====================

import { useState, useRef, useEffect } from "react";
import ModalBase from "./ModalBase";
import type { Project } from "../../project/projectTypes";

interface RenameModalProps {
  project: Project;
  onConfirm: (newName: string) => void;
  onClose: () => void;
}

export default function RenameModal({ project, onConfirm, onClose }: RenameModalProps) {
  const [name, setName] = useState(project.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  return (
    <ModalBase open title="重命名项目" onClose={onClose} size="sm">
      <div className="mb-6">
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && name.trim() && onConfirm(name.trim())}
          className="input-base"
        />
      </div>
      <div className="flex justify-end gap-2.5">
        <button className="btn-secondary" onClick={onClose}>取消</button>
        <button
          className="btn-primary"
          onClick={() => name.trim() && onConfirm(name.trim())}
          disabled={!name.trim()}
        >
          保存
        </button>
      </div>
    </ModalBase>
  );
}
