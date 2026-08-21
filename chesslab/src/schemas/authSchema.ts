import * as z from 'zod'

export const authSchema = z.object({
    email : z.email("Email not Valid!"),
    password: z.string('Password deve conter no minimo 8 caracteres!')
})