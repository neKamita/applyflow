import { createLink } from '@tanstack/react-router'
import { clsx } from 'clsx'
import type { AnchorHTMLAttributes, Ref } from 'react'
import { buttonClass, type ButtonSize, type ButtonVariant } from '../ui/button-styles'

interface StyledAnchorProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  ref?: Ref<HTMLAnchorElement>
}

function StyledAnchor({ variant, size, className, children, ref, ...rest }: StyledAnchorProps) {
  return (
    <a ref={ref} className={clsx(buttonClass(variant, size), className)} {...rest}>
      {children}
    </a>
  )
}

/** A router link that looks like a button: navigation stays a link for assistive technology. */
export const ButtonLink = createLink(StyledAnchor)
