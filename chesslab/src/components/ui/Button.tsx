import type { ComponentProps } from 'react'

export const Button = ({ type = 'button', children, ...props }: ComponentProps<'button'>) => {
  return (
    <button className="form-button" type={type} {...props}>
      {children}
    </button>
  )
}
