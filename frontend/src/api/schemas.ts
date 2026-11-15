// zod/mini: the same validation as full Zod at a fraction of the size (about 4 KB vs 90 KB gzip).
import * as z from 'zod/mini'

// Our CSP forbids eval. Without jitless, Zod probes `new Function` on first parse and the browser
// reports a CSP violation (the error is caught, but the report is noise that hides real ones).
z.config({ jitless: true })

// Shapes of the gateway's JSON, read from the backend view records. Every response is parsed with
// one of these before any component sees it.

const isoDate = z.string().check(z.regex(/^\d{4}-\d{2}-\d{2}$/, 'expected a date like 2027-05-31'))
const isoInstant = z.iso.datetime({ offset: true })
const currency = z.string().check(z.regex(/^[A-Z]{3}$/))

export const tokenResponse = z.object({
  accessToken: z.string().check(z.minLength(1)),
  tokenType: z.literal('Bearer'),
  expiresIn: z.int().check(z.positive()),
})
export type TokenResponse = z.infer<typeof tokenResponse>

export const degree = z.enum(['BACHELOR', 'MASTER', 'PHD'])
export type Degree = z.infer<typeof degree>

export const program = z.object({
  id: z.string().check(z.minLength(1)),
  university: z.string(),
  name: z.string(),
  country: z.string(),
  degree,
  applicationFee: z.number().check(z.nonnegative()),
  currency,
  deadline: isoDate,
})
export type Program = z.infer<typeof program>

export const applicationStatus = z.enum(['SUBMITTED', 'PAID', 'PAYMENT_FAILED'])

export const application = z.object({
  id: z.uuid(),
  programId: z.string(),
  programName: z.string(),
  university: z.string(),
  status: applicationStatus,
  applicationFee: z.number().check(z.nonnegative()),
  currency,
  failureReason: z.nullable(z.string()),
  createdAt: isoInstant,
  updatedAt: isoInstant,
})
export type Application = z.infer<typeof application>

export const payment = z.object({
  id: z.uuid(),
  applicationId: z.uuid(),
  amount: z.number().check(z.nonnegative()),
  currency,
  status: z.enum(['COMPLETED', 'DECLINED']),
  failureReason: z.nullable(z.string()),
  providerReference: z.nullable(z.string()),
  createdAt: isoInstant,
})
export type Payment = z.infer<typeof payment>

export const notification = z.object({
  eventId: z.uuid(),
  applicationId: z.uuid(),
  recipient: z.string(),
  subject: z.string(),
  body: z.string(),
  sentAt: isoInstant,
})
export type Notification = z.infer<typeof notification>

/**
 * RFC 9457 problem details from application-service, or Spring's default error body
 * ({ error, message }) from the gateway. Both are optional: gateway 401 and 429 can be empty.
 */
export const errorBody = z.looseObject({
  title: z.optional(z.string()),
  detail: z.optional(z.string()),
  error: z.optional(z.string()),
  message: z.optional(z.string()),
})
