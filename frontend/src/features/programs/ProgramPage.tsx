import { useQuery } from '@tanstack/react-query'
import { getRouteApi, Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { isApiError } from '../../api/errors'
import { ButtonLink } from '../../app/ButtonLink'
import { useLocale } from '../../app/useLocale'
import { EmptyState } from '../../ui/EmptyState'
import { ErrorState } from '../../ui/ErrorState'
import { daysUntil, formatDate, formatMoney, formatRelativeDays } from '../../ui/format'
import { Panel } from '../../ui/Panel'
import { Skeleton } from '../../ui/Skeleton'
import { programQuery } from './api'
import { isOpen } from './filter'

const route = getRouteApi('/programs/$programId')

export function ProgramPage() {
  const { t } = useTranslation()
  const locale = useLocale()
  const { programId } = route.useParams()
  const query = useQuery({ ...programQuery(programId), retry: false })
  const now = useMemo(() => new Date(), [])

  const back = (
    <Link
      to="/programs"
      className="inline-flex min-h-11 items-center gap-1.5 text-base text-ink no-underline hover:underline"
    >
      <ArrowLeft aria-hidden className="size-4" />
      {t('program.back')}
    </Link>
  )

  if (query.isPending) {
    return (
      <div aria-busy="true" className="flex max-w-2xl flex-col gap-3">
        {back}
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="mt-4 h-32 w-full" />
      </div>
    )
  }

  if (query.isError) {
    const notFound = isApiError(query.error) && query.error.status === 404
    return (
      <div className="max-w-2xl">
        {back}
        {notFound ? (
          <EmptyState title={t('program.notFoundTitle')} body={t('program.notFoundBody')} />
        ) : (
          <ErrorState
            title={t('program.errorTitle')}
            body={t('program.errorBody')}
            retryLabel={t('program.retry')}
            onRetry={() => {
              void query.refetch()
            }}
          />
        )}
      </div>
    )
  }

  const program = query.data
  const open = isOpen(program, now)
  const deadline = formatDate(program.deadline, locale)

  return (
    <div className="max-w-2xl">
      {back}
      <p className="mt-4 text-base break-words text-ink-muted">{program.university}</p>
      <h1 className="text-2xl font-semibold break-words">{program.name}</h1>
      <p className="mt-1 text-base text-ink-muted">
        {program.country} · {t(`degree.${program.degree}`)}
      </p>

      <Panel className="mt-6 p-5">
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-base">
          <dt className="text-ink-muted">{t('program.fee')}</dt>
          <dd className="font-medium tabular">
            {formatMoney(program.applicationFee, program.currency, locale)}
          </dd>
          <dt className="text-ink-muted">{t('program.deadline')}</dt>
          <dd className="tabular">
            <time dateTime={program.deadline}>{t('program.deadlineUtc', { date: deadline })}</time>
            {open && (
              <span className="block text-sm text-ink-muted">
                {formatRelativeDays(daysUntil(program.deadline, now), locale)}
              </span>
            )}
          </dd>
        </dl>
        <p className="mt-4 text-sm text-ink-muted">{t('program.illustrative')}</p>
      </Panel>

      <div className="mt-6 flex flex-col items-start gap-2">
        {open ? (
          <>
            <ButtonLink to="/programs/$programId/apply" params={{ programId: program.id }}>
              {t('program.apply')}
            </ButtonLink>
            <p className="text-sm text-ink-muted">{t('program.payNote')}</p>
          </>
        ) : (
          <p className="font-medium text-ink">{t('program.closed', { date: deadline })}</p>
        )}
      </div>
    </div>
  )
}
