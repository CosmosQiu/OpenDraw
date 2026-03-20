import { useEffect } from "react";
import { Editor, Vec } from "tldraw";
import { MovieClawSidebar } from "./MovieClawSidebar.tsx";

interface MovieClawSidebarModalProps {
  isOpen: boolean;
  onClose: () => void;
  editor: Editor;
  screenPoint: Vec | null;
  pagePoint: Vec | null;
}

export function MovieClawSidebarModal({
  isOpen,
  onClose,
  editor,
  screenPoint,
  pagePoint,
}: MovieClawSidebarModalProps) {
  const modalWidth = 200;
  const viewportPadding = 16;
  const desiredLeft = (screenPoint?.x ?? 0) + 16;
  const desiredTop = (screenPoint?.y ?? 0) + 16;
  const maxLeft = Math.max(viewportPadding, window.innerWidth - modalWidth - viewportPadding);
  const clampedLeft = Math.min(Math.max(desiredLeft, viewportPadding), maxLeft);
  const maxTop = Math.max(viewportPadding, window.innerHeight - viewportPadding);
  const clampedTop = Math.min(Math.max(desiredTop, viewportPadding), maxTop);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const modal = document.querySelector(".movie-claw-sidebar-modal");
      if (modal && !modal.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="movie-claw-sidebar-modal"
      style={{ left: clampedLeft, top: clampedTop }}
    >
      <MovieClawSidebar editor={editor} onClose={onClose} pagePoint={pagePoint} />
    </div>
  );
}
