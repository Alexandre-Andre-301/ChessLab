import * as z from 'zod'

export const registerSchema = z.object({
  full_name: z.string().min(5, 'O nome deve ter pelo menos 5 caracteres'),
  email: z.email('Email inválido'),
  password: z.string().min(8, 'A password deve ter no mínimo 8 caracteres'),
})

export type RegisterFormData = z.infer<typeof registerSchema>
