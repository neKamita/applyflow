import { formatMoney } from './format'

export interface MoneyProps {
  amount: number
  currency: string
  locale: string
}

export function Money({ amount, currency, locale }: MoneyProps) {
  return <span className="tabular whitespace-nowrap">{formatMoney(amount, currency, locale)}</span>
}
