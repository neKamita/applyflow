import { useTranslation } from 'react-i18next'
import { EmptyState } from '../../ui/EmptyState'

// Stand-ins for screens built in Phases 4-6, so routing and guards can be tested now.
export function ApplicationsPlaceholder() {
  const { t } = useTranslation()
  return (
    <>
      <h1 className="text-2xl font-semibold">{t('placeholder.applications')}</h1>
      <EmptyState title={t('placeholder.applicationsBody')} />
    </>
  )
}
