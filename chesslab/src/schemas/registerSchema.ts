import * as z from"zod"

export const registerSchema = z.object({
    fullName : z.string(),

    email : z.email("Email invalid!"),

    password : z.string().min(8,'Password too small')
    

})