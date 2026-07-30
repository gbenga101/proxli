type InputProps = {
  label: string
  name: string
  type?: string
  placeholder?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  error?: string
  required?: boolean
}

export default function Input({
  label,
  name,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  required = false,
}: InputProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label
        htmlFor={name}
        className="text-sm font-medium text-text-primary"
      >
        {label}
        {required && <span className="text-error ml-1">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className={`w-full px-4 py-2.5 rounded-lg border text-text-primary text-base placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary transition-colors duration-200 ${
          error
            ? 'border-error focus:ring-error'
            : 'border-border focus:border-primary'
        }`}
      />
      {error && (
        <span className="text-sm text-error">{error}</span>
      )}
    </div>
  )
}