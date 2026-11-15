import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocale } from '../../app/useLocale'
import { Button } from '../../ui/Button'
import { Checkbox } from '../../ui/Checkbox'
import { EmptyState } from '../../ui/EmptyState'
import { ErrorState } from '../../ui/ErrorState'
import { Panel } from '../../ui/Panel'
import { Select } from '../../ui/Select'
import { Skeleton } from '../../ui/Skeleton'
import { TextField } from '../../ui/TextField'
import { programsQuery } from './api'
import { filterPrograms, type CatalogSearch } from './filter'
import { ProgramRow } from './ProgramRow'

const route = getRouteApi('/programs/')

export function CatalogPage() {
  const { t } = useTranslation()
  const locale = useLocale()
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const programs = useQuery(programsQuery())
  const now = useMemo(() => new Date(), [])

  /** Values set to undefined, '' or false are removed from the URL. */
  function update(patch: { [K in keyof CatalogSearch]?: CatalogSearch[K] | '' | undefined }) {
    void navigate({
      // Drop empty values so the URL stays short and shareable.
      search: (previous) =>
        Object.fromEntries(
          Object.entries({ ...previous, ...patch }).filter(
            ([, value]) => value !== undefined && value !== '' && value !== false,
          ),
        ),
      replace: true,
    })
  }

  const countries = useMemo(
    () =>
      [...new Set((programs.data ?? []).map((p) => p.country))].sort((a, b) => a.localeCompare(b, locale)),
    [programs.data, locale],
  )
  const visible = useMemo(
    () => filterPrograms(programs.data ?? [], search, now),
    [programs.data, search, now],
  )
  const filtered = Boolean(search.q ?? search.country ?? search.degree ?? search.open)

  return (
    <>
      <h1 className="text-2xl font-semibold">{t('catalog.title')}</h1>
      <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_12rem_12rem] sm:items-end">
        <TextField
          label={t('catalog.search')}
          type="search"
          value={search.q ?? ''}
          onChange={(event) => {
            update({ q: event.target.value })
          }}
        />
        <Select
          label={t('catalog.country')}
          value={search.country ?? ''}
          options={[
            { value: '', label: t('catalog.allCountries') },
            ...countries.map((c) => ({ value: c, label: c })),
          ]}
          onChange={(event) => {
            update({ country: event.target.value })
          }}
        />
        <Select
          label={t('catalog.degree')}
          value={search.degree ?? ''}
          options={[
            { value: '', label: t('catalog.anyDegree') },
            ...(['BACHELOR', 'MASTER', 'PHD'] as const).map((d) => ({ value: d, label: t(`degree.${d}`) })),
          ]}
          onChange={(event) => {
            const value = event.target.value
            update({
              degree: value === 'BACHELOR' || value === 'MASTER' || value === 'PHD' ? value : undefined,
            })
          }}
        />
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4">
        <Checkbox
          label={t('catalog.openOnly')}
          checked={search.open === true}
          onChange={(event) => {
            update({ open: event.target.checked })
          }}
        />
        {programs.isSuccess && (
          <p role="status" className="text-sm text-ink-muted">
            {t('catalog.count', { count: visible.length })}
          </p>
        )}
      </div>

      {programs.isPending && (
        <Panel aria-busy="true" aria-label={t('catalog.loading')} className="mt-4 divide-y divide-line">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col gap-2 p-4">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-1/4" />
            </div>
          ))}
        </Panel>
      )}

      {programs.isError && (
        <ErrorState
          title={t('catalog.errorTitle')}
          body={t('catalog.errorBody')}
          retryLabel={t('catalog.retry')}
          onRetry={() => {
            void programs.refetch()
          }}
        />
      )}

      {programs.isSuccess && visible.length === 0 && (
        <EmptyState
          title={t('catalog.emptyTitle')}
          body={t('catalog.emptyBody')}
          action={
            filtered ? (
              <Button
                variant="secondary"
                onClick={() => {
                  void navigate({ search: {}, replace: true })
                }}
              >
                {t('catalog.clear')}
              </Button>
            ) : undefined
          }
        />
      )}

      {visible.length > 0 && (
        <Panel className="mt-4 divide-y divide-line">
          {visible.map((program) => (
            <ProgramRow key={program.id} program={program} locale={locale} now={now} />
          ))}
        </Panel>
      )}
    </>
  )
}
