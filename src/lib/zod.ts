import { object, string, optional } from "zod"
 
export const signInSchema = object({
  email: string({ required_error: "Email is required" })
    .min(1, "Email is required")
    .email("Invalid email"),
  password: string({ required_error: "Password is required" })
    .min(1, "Password is required")
    .min(8, "Password must be more than 8 characters")
    .max(32, "Password must be less than 32 characters"),
})

export const auctionHouseSignupSchema = object({
  name: string({ required_error: "Auction house name is required" })
    .min(1, "Auction house name is required")
    .min(3, "Name must be at least 3 characters")
    .max(100, "Name must be less than 100 characters"),
  slug: string({ required_error: "Slug is required" })
    .min(1, "Slug is required")
    .min(3, "Slug must be at least 3 characters")
    .max(50, "Slug must be less than 50 characters")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  description: optional(string())
    .nullable(),
  domain: optional(string()
    .regex(/^[a-z0-9.-]+\.[a-z]{2,}$/i, "Invalid domain format")
    .or(string().length(0)))
    .nullable(),
  logoUrl: optional(string().url("Invalid logo URL").or(string().length(0)))
    .nullable(),
})
