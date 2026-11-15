import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { EmptyState } from '../ui/EmptyState'

export function NotFoundPage() {
  const { t } = useTranslation()
  return (
    <EmptyState
      title={t('notFound.title')}
      body={t('notFound.body')}
      action={
        <Link to="/programs" className="font-medium text-ink underline">
          {t('notFound.action')}
        </Link>
      }
    />
  )
}
