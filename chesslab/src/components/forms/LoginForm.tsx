import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { authSchema, type LoginFormData } from '../../schemas/authSchema'
import { useLogin } from '../../hooks/useLogin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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
    <form className="flex flex-col gap-4 text-left" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          className="h-10 bg-card"
          placeholder="grandmaster@email.com"
          {...register('email')}
        />
        {errors.email && <p className="text-[13px] text-destructive">{errors.email.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          className="h-10 bg-card"
          placeholder="••••••••"
          {...register('password')}
        />
        {errors.password && (
          <p className="text-[13px] text-destructive">{errors.password.message}</p>
        )}
      </div>

      {mutation.isError && (
        <p className="text-[13px] text-destructive">{mutation.error.message}</p>
      )}

      <Button type="submit" disabled={mutation.isPending} className="h-10">
        {mutation.isPending ? 'A entrar...' : 'Entrar'}
      </Button>
    </form>
  )
}
