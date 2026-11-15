import { useQueryClient } from '@tanstack/react-query'
import { Link, Outlet, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { session } from '../session/session'
import { useSession } from '../session/useSession'
import { PageShell } from '../ui/PageShell'
import { Wordmark } from '../ui/Wordmark'
import { RouterNavLink } from './RouterNavLink'

export function AppShell() {
  const { t } = useTranslation()
  const current = useSession()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  function signOut() {
    session.signOut()
    queryClient.clear()
    void navigate({ to: '/programs' })
  }

  return (
    <PageShell
      skipLinkLabel={t('app.skipLink')}
      brand={
        <Link to="/programs" className="text-on-cover no-underline">
          <Wordmark label={t('app.name')} />
        </Link>
      }
      nav={
        <nav aria-label={t('nav.label')} className="flex gap-1">
          <RouterNavLink to="/programs">{t('nav.programs')}</RouterNavLink>
          {current && <RouterNavLink to="/applications">{t('nav.applications')}</RouterNavLink>}
        </nav>
      }
      actions={
        current ? (
          <>
            <span className="hidden text-sm text-on-cover-muted sm:inline">
              {t('nav.signedInAs', { username: current.username })}
            </span>
            <button
              type="button"
              onClick={signOut}
              className="inline-flex min-h-11 items-center rounded-control px-3 text-base text-on-cover-muted hover:bg-cover-raised hover:text-on-cover"
            >
              {t('nav.signOut')}
            </button>
          </>
        ) : (
          <RouterNavLink to="/login">{t('nav.signIn')}</RouterNavLink>
        )
      }
      footer={
        <>
          <p>{t('app.footer')}</p>
          <p className="mt-1">{t('app.credits')}</p>
        </>
      }
    >
      <Outlet />
    </PageShell>
  )
}
