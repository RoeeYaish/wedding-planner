import React, { forwardRef } from 'react'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost'
}

const Button = forwardRef<HTMLButtonElement, Props>(
  ({ variant = 'primary', className = '', children, ...rest }, ref) => {
    const base = variant === 'primary' ? 'btn-primary' : 'px-2 py-1 rounded';
    return (
      <button ref={ref} className={`${base} ${className}`} {...rest}>
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
