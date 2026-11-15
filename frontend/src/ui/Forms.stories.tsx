import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Checkbox } from './Checkbox'
import { RadioGroup } from './RadioGroup'
import { Select } from './Select'
import { TextField } from './TextField'

const meta = { title: 'UI/Form controls' } satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const countries = [
  { value: '', label: 'All countries' },
  { value: 'Germany', label: 'Germany' },
  { value: 'Italy', label: 'Italy' },
  { value: 'Uzbekistan', label: 'Uzbekistan' },
]

type Method = 'tok_visa' | 'tok_declined' | 'tok_unavailable'

function PaymentMethods({ error }: { error?: string }) {
  const [value, setValue] = useState<Method | undefined>('tok_visa')
  return (
    <RadioGroup<Method>
      legend="Demo payment method"
      name="payment"
      value={value}
      onChange={setValue}
      hint="These are simulated; no money moves."
      {...(error ? { error } : {})}
      options={[
        { value: 'tok_visa', label: 'Approved card', description: 'The fee is charged.' },
        { value: 'tok_declined', label: 'Declined card', description: 'The bank refuses the charge.' },
        {
          value: 'tok_unavailable',
          label: 'Provider unavailable',
          description: 'The payment provider does not answer.',
        },
      ]}
    />
  )
}

export const Fields: Story = {
  render: () => (
    <div className="flex max-w-md flex-col gap-5">
      <TextField label="Email for updates" type="email" defaultValue="aziz@example.com" />
      <TextField label="Search university or program" placeholder="e.g. Informatics" />
      <TextField
        label="Email for updates"
        type="email"
        defaultValue="aziz@"
        hint="We send status updates here."
        error="Enter a full email address, like name@example.com."
      />
      <TextField label="Username" disabled defaultValue="aziz" />
      <Select label="Country" options={countries} />
      <Checkbox label="Open programs only" defaultChecked />
    </div>
  ),
}

export const PaymentMethod: Story = { render: () => <PaymentMethods /> }

export const Russian: Story = {
  render: () => (
    <div className="flex max-w-md flex-col gap-5">
      <TextField
        label="Электронная почта для уведомлений"
        type="email"
        defaultValue="aziz@"
        error="Введите полный адрес, например name@example.com."
      />
      <Select
        label="Страна"
        options={[
          { value: '', label: 'Все страны' },
          { value: 'Germany', label: 'Германия' },
        ]}
      />
      <Checkbox label="Только открытые программы" />
    </div>
  ),
}
