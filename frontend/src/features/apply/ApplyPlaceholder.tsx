import { useTranslation } from 'react-i18next'
import { EmptyState } from '../../ui/EmptyState'

// Replaced by the application form in Phase 5.
export function ApplyPlaceholder() {
  const { t } = useTranslation()
  return (
    <>
      <h1 className="text-2xl font-semibold">{t('apply.title')}</h1>
      <EmptyState title={t('apply.placeholder')} />
    </>
  )
}
