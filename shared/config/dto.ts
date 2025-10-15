import * as z from "zod"

export const UserRegister = z.object({
  email: z.string(),
  password: z.string(),
})
