import type { Meta, StoryObj } from '@storybook/react-vite'
import { Stamp } from './Stamp'
import { StatusBadge } from './StatusBadge'
import { Timeline } from './Timeline'

const meta = { title: 'UI/Status' } satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Badges: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <StatusBadge status="SUBMITTED" label="Awaiting payment" />
      <StatusBadge status="PAID" label="Paid" />
      <StatusBadge status="PAYMENT_FAILED" label="Payment failed" />
      <StatusBadge status="SUBMITTED" label="Ожидает оплаты" />
    </div>
  ),
}

export const Stamps: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-10">
      <Stamp status="SUBMITTED" title="Awaiting payment" date="15 Nov 2026" />
      <Stamp status="PAID" title="Paid" date="15 Nov 2026" code="TUM-MSC-INFORMATICS" />
      <Stamp status="PAYMENT_FAILED" title="Declined" date="15 Nov 2026" code="KAIST-MSC-AI" />
    </div>
  ),
}

export const StampLanding: Story = {
  render: () => <Stamp status="PAID" title="Paid" date="15 Nov 2026" code="TUM-MSC-INFORMATICS" animate />,
}

export const StampsRussian: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-10">
      <Stamp status="SUBMITTED" title="Ожидает оплаты" date="15 нояб. 2026" />
      <Stamp status="PAID" title="Оплачено" date="15 нояб. 2026" code="TUM-MSC-INFORMATICS" />
      <Stamp status="PAYMENT_FAILED" title="Отклонено" date="15 нояб. 2026" />
    </div>
  ),
}

export const ApplicationTimeline: Story = {
  render: () => (
    <div className="max-w-md">
      <Timeline
        label="Application history"
        items={[
          { id: 's', title: 'Submitted', meta: '15 Nov 2026, 14:02', state: 'done' },
          {
            id: 'p',
            title: 'Fee paid €75.00',
            meta: '15 Nov 2026, 14:02',
            detail: 'Receipt PRV-8F21',
            state: 'done',
          },
          {
            id: 'n',
            title: 'Email sent: “Application fee paid”',
            meta: 'to a***@example.com',
            state: 'done',
          },
        ]}
      />
    </div>
  ),
}

export const PendingAndFailed: Story = {
  render: () => (
    <div className="flex max-w-md flex-col gap-8">
      <Timeline
        label="Application history"
        items={[
          { id: 's', title: 'Submitted', meta: '15 Nov 2026, 14:02', state: 'done' },
          { id: 'p', title: 'Waiting for payment confirmation', state: 'pending' },
        ]}
      />
      <Timeline
        label="Application history"
        items={[
          { id: 's', title: 'Submitted', meta: '15 Nov 2026, 14:02', state: 'done' },
          { id: 'p', title: 'Payment declined', detail: 'Card declined by the issuer', state: 'failed' },
        ]}
      />
    </div>
  ),
}
