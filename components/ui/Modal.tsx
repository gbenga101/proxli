'use client'

import { useEffect, useRef, useState } from 'react'
import Button from './Button'

type ModalProps = {
  open: boolean
  title: string
  description?: string
  variant?: 'confirm' | 'prompt'
  promptLabel?: string
  promptPlaceholder?: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: (value?: string) => void
  onCancel: () => void
}

export default function Modal({
  open,
  title,
  description,
  variant = 'confirm',
  promptLabel,
  promptPlaceholder,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  onConfirm,
  onCancel,
}: ModalProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!open) return
    setValue('')
    if (variant === 'prompt') {
      const t = setTimeout(() => textareaRef.current?.focus(), 0)
      return () => clearTimeout(t)
    }
  }, [open, variant])

  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onCancel])

  if (!open) return null

  function handleConfirm() {
    if (variant === 'prompt' && !value.trim()) return
    onConfirm(variant === 'prompt' ? value.trim() : undefined)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.6)] px-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-xl border border-border shadow-lg w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-heading font-semibold text-text-primary mb-1">{title}</h3>
        {description && <p className="text-sm text-text-secondary mb-4">{description}</p>}

        {variant === 'prompt' && (
          <div className="mb-4">
            {promptLabel && (
              <label className="text-sm font-medium text-text-primary block mb-1.5">
                {promptLabel}
              </label>
            )}
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={promptPlaceholder}
              rows={3}
              className="w-full px-4 py-2.5 rounded-lg border border-border text-text-primary focus:outline-none focus:border-primary"
            />
          </div>
        )}

        <div className="flex justify-end gap-3 mt-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            variant={danger ? 'danger' : 'primary'}
            size="sm"
            onClick={handleConfirm}
            disabled={variant === 'prompt' && !value.trim()}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}