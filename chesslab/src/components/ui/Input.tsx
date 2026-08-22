import type { ComponentProps } from 'react'

export const Input = ({ type = 'text', ...props }: ComponentProps<'input'>) => {
  return <input className="form-input" type={type} {...props} />
}
