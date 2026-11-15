export type ApplicationStatus = 'SUBMITTED' | 'PAID' | 'PAYMENT_FAILED'

/** Each status has its own stamp shape so it never relies on colour alone. */
export const statusTone = {
  SUBMITTED: { text: 'text-stamp-submitted', soft: 'bg-stamp-submitted-soft', shape: 'circle' },
  PAID: { text: 'text-stamp-paid', soft: 'bg-stamp-paid-soft', shape: 'rect' },
  PAYMENT_FAILED: { text: 'text-stamp-failed', soft: 'bg-stamp-failed-soft', shape: 'notched' },
} as const satisfies Record<ApplicationStatus, { text: string; soft: string; shape: string }>

export type StampShape = (typeof statusTone)[ApplicationStatus]['shape']
