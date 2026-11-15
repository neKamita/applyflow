import { useTranslation } from 'react-i18next'

/** The active interface locale, for Intl formatting. */
export function useLocale(): string {
  return useTranslation().i18n.language
}
