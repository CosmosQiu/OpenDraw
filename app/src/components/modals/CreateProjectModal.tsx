// ==================== 创建项目模态框 ====================

import { useState, useRef, useEffect } from "react";
import ModalBase from "./ModalBase";
import { GRADIENT_PRESETS } from "../../project/projectTypes";
import type { Project } from "../../project/projectTypes";
import { cn } from "../../utils";

// ==================== 类型 ====================

const TYPE_OPTIONS: { value: Project["type"]; label: string }[] = [
  { value: "personal", label: "个人" },
  { value: "team", label: "团队" },
  { value: "free", label: "免费体验" },
];

interface CreateProjectData {
  name: string;
  type: Project["type"];
  gradient: string;
}

interface CreateProjectModalProps {
  onConfirm: (data: CreateProjectData) => void;
  onClose: () => void;
}

export default function CreateProjectModal({ onConfirm, onClose }: CreateProjectModalProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<Project["type"]>("personal");
  const [gradientIdx, setGradientIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim()) return;
    onConfirm({ name: name.trim(), type, gradient: GRADIENT_PRESETS[gradientIdx] });
  };

  return (
    <ModalBase open title="新建项目" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {/* 名称 */}
        <div className="mb-4">
          <label className="block text-[13px] text-[#a0a0a0] mb-1.5">项目名称</label>
          <input
            ref={inputRef}
            type="text"
            placeholder="输入项目名称..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-base"
          />
        </div>

        {/* 类型 */}
        <div className="mb-4">
          <label className="block text-[13px] text-[#a0a0a0] mb-1.5">项目类型</label>
          <div className="flex gap-2">
            {TYPE_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-[6px] border text-[13px] cursor-pointer transition-all",
                  type === opt.value
                    ? "border-accent bg-accent/15 text-accent-2"
                    : "border-border-2 bg-bg-3 text-[#a0a0a0] hover:border-accent hover:text-accent-2",
                )}
              >
                <input
                  type="radio"
                  value={opt.value}
                  checked={type === opt.value}
                  onChange={() => setType(opt.value)}
                  className="hidden"
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        {/* 封面色 */}
        <div className="mb-6">
          <label className="block text-[13px] text-[#a0a0a0] mb-1.5">封面颜色</label>
          <div className="flex gap-2 flex-wrap">
            {GRADIENT_PRESETS.map((g, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setGradientIdx(i)}
                className={cn(
                  "w-9 h-9 rounded-md border-2 cursor-pointer transition-all duration-150",
                  gradientIdx === i ? "border-white scale-110" : "border-transparent hover:scale-105",
                )}
                style={{ background: g }}
              />
            ))}
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="flex justify-end gap-2.5">
          <button type="button" className="btn-secondary" onClick={onClose}>取消</button>
          <button type="submit" className="btn-primary" disabled={!name.trim()}>创建项目</button>
        </div>
      </form>
    </ModalBase>
  );
}
