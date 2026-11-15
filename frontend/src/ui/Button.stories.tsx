import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent } from 'storybook/test'
import { Button } from './Button'

const meta = {
  title: 'UI/Button',
  component: Button,
  args: { children: 'Submit and pay €75.00', onClick: fn() },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {}
export const Secondary: Story = { args: { variant: 'secondary', children: 'Clear filters' } }
export const Ghost: Story = { args: { variant: 'ghost', children: 'Sign out' } }
export const Small: Story = { args: { size: 'sm', variant: 'secondary', children: 'Retry' } }
export const Russian: Story = { args: { children: 'Отправить и оплатить 75,00 €' } }

export const Loading: Story = {
  args: { loading: true, children: 'Submitting…' },
  play: async ({ args, canvas }) => {
    const button = canvas.getByRole('button')
    await expect(button).toHaveAttribute('aria-busy', 'true')
    await userEvent.click(button)
    button.focus()
    await userEvent.keyboard('{Enter}')
    await expect(args.onClick).not.toHaveBeenCalled()
  },
}

export const Disabled: Story = {
  args: { disabled: true, children: 'Applications closed' },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button'))
    await expect(args.onClick).not.toHaveBeenCalled()
  },
}
