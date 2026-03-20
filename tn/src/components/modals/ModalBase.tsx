import * as Dialog from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ModalBaseProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: "sm" | "md"
}

export default function ModalBase({ open, onClose, title, children, size = "md" }: ModalBaseProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-[3px] z-[1000] animate-fade-in" />
        <Dialog.Content
          className={cn(
            "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1001]",
            "bg-bg-2 border border-border-2 rounded-[14px] p-7 shadow-lg",
            "animate-slide-up outline-none",
            "max-h-[90vh] overflow-y-auto",
            size === "sm" ? "w-[360px]" : "w-[420px]",
            "max-w-[90vw]",
          )}
        >
          {/* 标题栏 */}
          <div className="flex items-center justify-between mb-5">
            <Dialog.Title className="text-[17px] font-semibold text-white">
              {title}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="w-[30px] h-[30px] rounded-[6px] border-none bg-bg-3 text-[#a0a0a0] flex items-center justify-center cursor-pointer hover:bg-bg-4 hover:text-white transition-all">
                <X size={16} />
              </button>
            </Dialog.Close>
          </div>

          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
