import { X } from 'lucide-react'

interface ModalProps {
  title: string
  onClose: () => void
  children: React.ReactNode
}

export function Modal({ title, onClose, children }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center">
      {/* Capped height + internal scroll keeps the header (and its close
       * button) visible above the status bar even when a taller keyboard
       * shrinks the viewport or the content itself runs long. */}
      <div className="flex max-h-[calc(100dvh-env(safe-area-inset-top)-1rem)] w-full max-w-sm flex-col rounded-t-2xl bg-neutral-900 sm:rounded-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-neutral-800 px-5 pb-4 pt-5">
          <h2 className="text-base font-semibold text-neutral-50">{title}</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center text-neutral-500 hover:text-neutral-300"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
          {children}
        </div>
      </div>
    </div>
  )
}
