import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { authSchema, type LoginFormData } from '../../schemas/authSchema'
import { useLogin } from '../../hooks/useLogin'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

export const LoginForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(authSchema),
  })

  const mutation = useLogin()

  const onSubmit = (data: LoginFormData) => {
    mutation.mutate(data)
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="form-field">
        <label htmlFor="email">Email</label>
        <Input id="email" type="email" placeholder="grandmaster@email.com" {...register('email')} />
        {errors.email && <p className="form-error">{errors.email.message}</p>}
      </div>

      <div className="form-field">
        <label htmlFor="password">Password</label>
        <Input id="password" type="password" placeholder="••••••••" {...register('password')} />
        {errors.password && <p className="form-error">{errors.password.message}</p>}
      </div>

      {mutation.isError && <p className="form-error">{mutation.error.message}</p>}

      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'A entrar...' : 'Entrar'}
      </Button>
    </form>
  )
}
