import * as z from 'zod'

export const onboardingSchema = z.object({
  chesscom_username: z
    .string()
    .trim()
    .min(2, 'Indica o teu username do Chess.com')
    .max(30, 'Username demasiado longo'),
  main_goal: z.string().optional(),
  peak_rating: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || /^\d{1,4}$/.test(value), 'Rating inválido'),
})

export type OnboardingFormData = z.infer<typeof onboardingSchema>
