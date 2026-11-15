import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import * as z from 'zod/mini'
import { isApiError } from '../../api/errors'
import { session } from '../../session/session'
import { safeReturnTo } from '../../session/returnTo'
import { Button } from '../../ui/Button'
import { Checkbox } from '../../ui/Checkbox'
import { Panel } from '../../ui/Panel'
import { TextField } from '../../ui/TextField'
import { requestToken, type Credentials } from './api'

const schema = z.object({
  username: z.string().check(z.trim(), z.minLength(1)),
  password: z.string().check(z.minLength(1)),
})

export interface LoginPageProps {
  returnTo: string | undefined
  /** True when the user was sent here because their session ended. */
  expired: boolean
}

export function LoginPage({ returnTo, expired }: LoginPageProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const alertRef = useRef<HTMLDivElement>(null)
  const [showPassword, setShowPassword] = useState(false)
  const {
    register,
    handleSubmit,
    resetField,
    setFocus,
    formState: { errors },
  } = useForm<Credentials>({ resolver: zodResolver(schema), defaultValues: { username: '', password: '' } })

  const login = useMutation({
    mutationFn: requestToken,
    onSuccess: (token, credentials) => {
      session.signIn(token, credentials.username.trim())
      void navigate({ href: safeReturnTo(returnTo, window.location.origin), replace: true })
    },
    onError: () => {
      resetField('password')
    },
  })

  const failure = login.error
  const message = failure
    ? isApiError(failure) && failure.status === 401
      ? t('login.invalid')
      : isApiError(failure) && failure.kind === 'network'
        ? t('login.network')
        : t('login.unexpected')
    : expired
      ? t('login.sessionExpired')
      : null

  useEffect(() => {
    if (failure) alertRef.current?.focus()
  }, [failure])

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-semibold">{t('login.title')}</h1>
      <Panel className="mt-5 p-5 sm:p-6">
        {message && (
          <div
            ref={alertRef}
            role={failure ? 'alert' : 'status'}
            tabIndex={-1}
            className="mb-5 rounded-control bg-stamp-failed-soft px-3 py-2.5 text-base text-ink"
          >
            <p>{message}</p>
            {failure && isApiError(failure) && failure.correlationId && failure.status !== 401 && (
              <p className="mt-1 text-sm text-ink-muted">
                {t('login.reference', { id: failure.correlationId })}
              </p>
            )}
          </div>
        )}
        <form
          noValidate
          className="flex flex-col gap-5"
          onSubmit={(event) => {
            void handleSubmit((values) => {
              login.mutate(values)
            })(event)
          }}
        >
          <TextField
            label={t('login.username')}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            error={
              errors.username ? t('login.required', { field: t('login.username').toLowerCase() }) : undefined
            }
            {...register('username')}
          />
          <TextField
            label={t('login.password')}
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            error={
              errors.password ? t('login.required', { field: t('login.password').toLowerCase() }) : undefined
            }
            {...register('password')}
          />
          <Checkbox
            label={t('login.showPassword')}
            checked={showPassword}
            onChange={(event) => {
              setShowPassword(event.target.checked)
              setFocus('password')
            }}
          />
          <Button type="submit" loading={login.isPending}>
            {login.isPending ? t('login.submitting') : t('login.submit')}
          </Button>
        </form>
      </Panel>
      <p className="mt-4 text-sm text-ink-muted">{t('login.demoHint')}</p>
    </div>
  )
}
