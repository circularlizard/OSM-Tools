import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    const variants = {
      default: 'bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90',
      secondary: 'bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:opacity-90',
    }
    const sizes = {
      sm: 'h-8 px-3 text-sm rounded-[var(--radius-sm)]',
      md: 'h-9 px-4 text-sm rounded-[var(--radius-md)]',
      lg: 'h-10 px-5 text-base rounded-[var(--radius-lg)]',
    }
    return (
      <button ref={ref} className={cn('inline-flex items-center justify-center', variants[variant], sizes[size], className)} {...props} />
    )
  }
)
Button.displayName = 'Button'
