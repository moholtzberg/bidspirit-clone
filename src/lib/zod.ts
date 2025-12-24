import { z } from "zod"
 
export const signInSchema = z.object({
  email: z.string({ required_error: "Email is required" })
    .min(1, "Email is required")
    .email("Invalid email"),
  password: z.string({ required_error: "Password is required" })
    .min(1, "Password is required")
    .min(8, "Password must be more than 8 characters")
    .max(32, "Password must be less than 32 characters"),
})

export const auctionHouseSignupSchema = z.object({
  name: z.string({ required_error: "Auction house name is required" })
    .min(1, "Auction house name is required")
    .min(3, "Name must be at least 3 characters")
    .max(100, "Name must be less than 100 characters"),
  slug: z.string({ required_error: "Slug is required" })
    .min(1, "Slug is required")
    .min(3, "Slug must be at least 3 characters")
    .max(50, "Slug must be less than 50 characters")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  description: z.string().optional().nullable(),
  domain: z.string()
    .regex(/^[a-z0-9.-]+\.[a-z]{2,}$/i, "Invalid domain format")
    .or(z.string().length(0))
    .optional()
    .nullable(),
  logoUrl: z.string().url("Invalid logo URL").or(z.string().length(0)).optional().nullable(),
  // User creation fields (required if not logged in)
  userEmail: z.string().email("Invalid email address").optional(),
  userName: z.string().min(1, "Name is required").optional(),
  userFirstName: z.string().optional(),
  userLastName: z.string().optional(),
  userPassword: z.string().min(8, "Password must be at least 8 characters").optional(),
})

// Bid increment structure
const bidIncrementSchema = z.object({
  from: z.number().min(0),
  increment: z.number().min(0),
})

// Payment method structure
const paymentMethodSchema = z.object({
  method: z.string(),
  percentage: z.number().min(0).max(100),
  vat: z.boolean().default(false),
})

// Auction house settings schema
export const auctionHouseSettingsSchema = z.object({
  // Basic Information
  mainLanguage: z.string().optional().nullable(),
  nameInEnglish: z.string().optional().nullable(),
  addressInEnglish: z.string().optional().nullable(),
  disclaimerInEnglish: z.string().optional().nullable(),
  
  // Contact Information
  email: z.string().email("Invalid email address").optional().nullable(),
  phone: z.string().optional().nullable(),
  phoneForWhatsapp: z.string().optional().nullable(),
  
  // Localization
  secondLanguage: z.string().optional().nullable(),
  defaultCurrency: z.string().optional().nullable(),
  secondCurrency: z.string().optional().nullable(),
  
  // Pricing
  defaultItemStartPrice: z.coerce.number().min(0).optional().nullable(),
  buyersPremium: z.coerce.number().min(0).max(100).optional().nullable(),
  addVat: z.boolean().default(false),
  
  // Email Notifications
  emailOnAbsenteeBid: z.boolean().default(false),
  emailOnAbsenteeBidCancel: z.boolean().default(false),
  emailToNotifyBidsUpdate: z.string().email("Invalid email address").optional().nullable(),
  
  // Bidding Rules
  russianUsersRequireApproval: z.boolean().default(false),
  
  // Payment Methods
  paymentMethods: z.array(paymentMethodSchema).optional().default([]),
  addPaymentButtonToInvoices: z.boolean().default(false),
  
  // Legal Documents
  termsOfSaleInEnglish: z.string().optional().nullable(),
  privacyPolicyInEnglish: z.string().optional().nullable(),
  disclaimerForSellersInEnglish: z.string().optional().nullable(),
  
  // Bid Increments
  bidIncrements: z.array(bidIncrementSchema).optional().default([]),
  
  // Email Templates
  emailSignatureInEnglish: z.string().optional().nullable(),
  photoIdRequestEmailTemplateInEnglish: z.string().optional().nullable(),
  bidLimitEmailTemplateInEnglish: z.string().optional().nullable(),
  
  // Invoice Settings
  additionalTextForInvoicesInEnglish: z.string().optional().nullable(),
  additionalTextForConsignorStatementsInEnglish: z.string().optional().nullable(),
  taxNumber: z.string().optional().nullable(),
  invoiceProvider: z.string().optional().nullable(),
})

// Auction settings schema (nested within each auction)
export const auctionSettingsSchema = z.object({
  // Default Auction Settings
  defaultAuctionDurationDays: z.coerce.number().min(1).optional().nullable(),
  defaultPreviewPeriodDays: z.coerce.number().min(0).optional().nullable(),
  autoStartAuctions: z.boolean().default(false),
  autoCloseAuctions: z.boolean().default(false),
  staggeredLotClosing: z.boolean().default(false),
  lotClosingIntervalSeconds: z.coerce.number().min(0).optional().nullable(),
  requireRegistrationToBid: z.boolean().default(false),
  allowAbsenteeBids: z.boolean().default(true),
  extendBiddingOnLastMinuteBid: z.boolean().default(false),
  biddingExtensionSeconds: z.coerce.number().min(0).optional().nullable(),
  minimumBidIncrement: z.coerce.number().min(0).optional().nullable(),
  allowProxyBidding: z.boolean().default(true),
  maxProxyBidAmount: z.coerce.number().min(0).optional().nullable(),
  defaultAuctionStatus: z.enum(['UPCOMING', 'LIVE', 'ENDED', 'CANCELLED']).optional().nullable(),
  
  // Catalog Settings
  displayStartPriceInCatalog: z.boolean().default(true),
  enableAbsenteeBids: z.boolean().default(true),
  buyersPremium: z.coerce.number().min(0).max(100).optional().nullable(),
  daysToAllowPostAuctionSale: z.coerce.number().min(0).optional().nullable(),
  
  // Live Auction Settings
  baseLiveAuctionStartPriceOnAbsenteeBids: z.boolean().default(false),
  
  // Automatic Auction Settings
  automaticAuctionInitialTimerSeconds: z.coerce.number().min(1).optional().nullable(),
  automaticAuctionTimerResetSeconds: z.coerce.number().min(1).optional().nullable(),
  
  // Currency
  currency: z.string().optional().nullable(),
})
