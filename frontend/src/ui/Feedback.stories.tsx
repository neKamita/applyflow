import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { Button } from './Button'
import { EmptyState } from './EmptyState'
import { ErrorState } from './ErrorState'
import { Money } from './Money'
import { DateText } from './DateText'
import { Panel } from './Panel'
import { Skeleton } from './Skeleton'

const meta = { title: 'UI/Feedback and values' } satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {
  render: () => (
    <EmptyState
      title="No programs match these filters"
      body="Try another country or degree, or clear the filters to see every program."
      action={<Button variant="secondary">Clear filters</Button>}
    />
  ),
}

export const Error: Story = {
  render: () => (
    <ErrorState
      title="Could not load programs"
      body="Check your connection and try again. Your filters are kept."
      onRetry={fn()}
      retryLabel="Retry"
    />
  ),
}

export const Loading: Story = {
  render: () => (
    <Panel className="flex flex-col gap-3 p-4">
      <Skeleton className="h-5 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-4 w-1/3" />
    </Panel>
  ),
}

export const Values: Story = {
  render: () => (
    <dl className="grid max-w-sm grid-cols-2 gap-x-6 gap-y-2 text-base">
      <dt className="text-ink-muted">Fee (en)</dt>
      <dd>
        <Money amount={75} currency="EUR" locale="en" />
      </dd>
      <dt className="text-ink-muted">Fee (ru)</dt>
      <dd>
        <Money amount={75} currency="EUR" locale="ru" />
      </dd>
      <dt className="text-ink-muted">No symbol</dt>
      <dd>
        <Money amount={250000} currency="UZS" locale="en" />
      </dd>
      <dt className="text-ink-muted">Deadline</dt>
      <dd>
        <DateText value="2027-05-31" locale="en" />
      </dd>
      <dt className="text-ink-muted">Submitted</dt>
      <dd>
        <DateText value="2026-11-15T14:02:00Z" locale="ru" withTime />
      </dd>
    </dl>
  ),
}
