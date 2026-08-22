import * as z from 'zod'

export const authSchema = z.object({
  email: z.email('Email inválido'),
  password: z.string().min(8, 'A password deve ter no mínimo 8 caracteres'),
})

export type LoginFormData = z.infer<typeof authSchema>
