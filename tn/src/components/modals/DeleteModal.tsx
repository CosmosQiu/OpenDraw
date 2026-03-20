import ModalBase from "./ModalBase"
import type { Project } from "@/data/constants"

interface DeleteModalProps {
  project: Project
  onConfirm: () => void
  onClose: () => void
}

export default function DeleteModal({ project, onConfirm, onClose }: DeleteModalProps) {
  return (
    <ModalBase open title="删除项目" onClose={onClose} size="sm">
      <p className="text-[14px] text-[#a0a0a0] leading-relaxed mb-6">
        确定要删除{" "}
        <strong className="text-white">"{project.name}"</strong>{" "}
        吗？此操作不可撤销。
      </p>
      <div className="flex justify-end gap-2.5">
        <button className="btn-secondary" onClick={onClose}>取消</button>
        <button className="btn-danger" onClick={onConfirm}>确认删除</button>
      </div>
    </ModalBase>
  )
}
