import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { registerSchema, type RegisterFormData } from '../../schemas/registerSchema'
import { useRegister } from '../../hooks/useRegister'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'

export const RegisterForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const mutation = useRegister()

  const onSubmit = (data: RegisterFormData) => {
    mutation.mutate(data)
  }

  return (
    <form className="flex flex-col gap-4 text-left" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="full_name">Nome completo</Label>
        <Input
          id="full_name"
          type="text"
          className="h-10 bg-card"
          placeholder="O teu nome"
          {...register('full_name')}
        />
        {errors.full_name && (
          <p className="text-[13px] text-destructive">{errors.full_name.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          className="h-10 bg-card"
          placeholder="exemplo@email.com"
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
        {mutation.isPending ? 'A criar conta...' : 'Criar conta'}
      </Button>
    </form>
  )
}
