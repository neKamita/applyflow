import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import type { Program } from '../../api/schemas'
import { ButtonLink } from '../../app/ButtonLink'
import { daysUntil, formatDate, formatMoney, formatRelativeDays } from '../../ui/format'
import { isOpen } from './filter'

export interface ProgramRowProps {
  program: Program
  locale: string
  now: Date
}

export function ProgramRow({ program, locale, now }: ProgramRowProps) {
  const { t } = useTranslation()
  const open = isOpen(program, now)
  const deadline = formatDate(program.deadline, locale)

  return (
    <article className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-6">
      <div className="min-w-0 flex-1">
        <p className="text-sm break-words text-ink-muted">{program.university}</p>
        <h2 className="text-lg font-semibold break-words text-ink">
          <Link
            to="/programs/$programId"
            params={{ programId: program.id }}
            className="text-ink no-underline hover:underline"
          >
            {program.name}
          </Link>
        </h2>
        <p className="text-sm text-ink-muted">
          {program.country} · {t(`degree.${program.degree}`)}
        </p>
      </div>
      <div className="flex items-center justify-between gap-6 sm:shrink-0">
        {/* Fixed width keeps fee and deadline in one aligned column down the list. */}
        <div className="text-sm sm:w-56">
          <p className="tabular">
            {t('catalog.fee', { amount: formatMoney(program.applicationFee, program.currency, locale) })}
          </p>
          <p className="text-ink-muted tabular">
            {open
              ? t('catalog.closes', {
                  date: deadline,
                  when: formatRelativeDays(daysUntil(program.deadline, now), locale),
                })
              : t('catalog.closed', { date: deadline })}
          </p>
        </div>
        {open ? (
          <ButtonLink
            to="/programs/$programId/apply"
            params={{ programId: program.id }}
            size="sm"
            aria-label={t('catalog.applyTo', { name: program.name })}
          >
            {t('catalog.apply')}
          </ButtonLink>
        ) : (
          <span className="text-sm font-medium text-ink-muted">{t('catalog.closedBadge')}</span>
        )}
      </div>
    </article>
  )
}
