import { X } from 'lucide-react'

interface ModalProps {
  title: string
  onClose: () => void
  children: React.ReactNode
}

export function Modal({ title, onClose, children }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center">
      <div className="w-full max-w-sm rounded-t-2xl bg-neutral-900 p-5 sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-neutral-50">{title}</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-300">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
