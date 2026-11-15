import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './Button'
import { Checkbox } from './Checkbox'
import { Money } from './Money'
import { NavLink } from './NavLink'
import { PageShell } from './PageShell'
import { Panel } from './Panel'
import { Select } from './Select'
import { Stamp } from './Stamp'
import { StatusBadge } from './StatusBadge'
import { TextField } from './TextField'
import { Timeline } from './Timeline'
import { Wordmark } from './Wordmark'
import { DateText } from './DateText'

// Composition check for the visual review: the components on the two screens that carry the
// world, with realistic content. Not a screen implementation; those come in Phases 4-6.
const meta = { title: 'Composition/Shell', parameters: { layout: 'fullscreen' } } satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const programs = [
  {
    id: 'tum-msc-informatics',
    university: 'Technical University of Munich',
    name: 'MSc Informatics',
    meta: 'Munich, Germany · Master',
    fee: 75,
    currency: 'EUR',
    deadline: '2027-05-31',
    open: true,
  },
  {
    id: 'wiut-bsc-se',
    university: 'Westminster International University in Tashkent',
    name: 'BSc Software Engineering with a Foundation Year in Computing and Applied Mathematics',
    meta: 'Tashkent, Uzbekistan · Bachelor',
    fee: 25,
    currency: 'USD',
    deadline: '2027-08-01',
    open: true,
  },
  {
    id: 'polimi-bsc-ce',
    university: 'Politecnico di Milano',
    name: 'BSc Computer Engineering',
    meta: 'Milan, Italy · Bachelor',
    fee: 30,
    currency: 'EUR',
    deadline: '2026-04-15',
    open: false,
  },
]

function Shell({ children, current }: { children: React.ReactNode; current: 'programs' | 'applications' }) {
  return (
    <PageShell
      skipLinkLabel="Skip to content"
      brand={
        <a href="#programs" className="text-on-cover no-underline">
          <Wordmark label="ApplyFlow" />
        </a>
      }
      nav={
        <nav aria-label="Main" className="flex gap-1">
          <NavLink href="#programs" current={current === 'programs'}>
            Programs
          </NavLink>
          <NavLink href="#applications" current={current === 'applications'}>
            My applications
          </NavLink>
        </nav>
      }
      actions={
        <>
          <NavLink href="#ru" lang="ru">
            RU
          </NavLink>
          <NavLink href="#account">aziz</NavLink>
        </>
      }
      footer="Demo project. Not affiliated with the listed universities. Payments are simulated."
    >
      {children}
    </PageShell>
  )
}

export const Catalog: Story = {
  render: () => (
    <Shell current="programs">
      <h1 className="text-2xl font-semibold">Find a program</h1>
      <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_12rem_12rem] sm:items-end">
        <TextField label="Search university or program" type="search" />
        <Select label="Country" options={[{ value: '', label: 'All countries' }]} />
        <Select label="Degree" options={[{ value: '', label: 'Any degree' }]} />
      </div>
      <div className="mt-2 flex items-center justify-between">
        <Checkbox label="Open programs only" />
        <p className="text-sm text-ink-muted">28 programs</p>
      </div>
      <Panel className="mt-4 divide-y divide-line">
        {programs.map((program) => (
          <article key={program.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-6">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-ink-muted">{program.university}</p>
              <h2 className="text-lg font-semibold text-ink">{program.name}</h2>
              <p className="text-sm text-ink-muted">{program.meta}</p>
            </div>
            <div className="flex items-center justify-between gap-6 sm:justify-end">
              <div className="text-sm">
                <p>
                  Fee <Money amount={program.fee} currency={program.currency} locale="en" />
                </p>
                <p className="text-ink-muted">
                  {program.open ? 'Closes ' : 'Closed '}
                  <DateText value={program.deadline} locale="en" />
                </p>
              </div>
              {program.open ? (
                <Button size="sm">Apply</Button>
              ) : (
                <span className="text-sm font-medium text-ink-muted">Closed</span>
              )}
            </div>
          </article>
        ))}
      </Panel>
    </Shell>
  ),
}

export const Tracker: Story = {
  render: () => (
    <Shell current="applications">
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Panel className="p-5 sm:p-6">
          <p className="text-sm text-ink-muted">Technical University of Munich</p>
          <h1 className="text-2xl font-semibold">MSc Informatics</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Reference <span className="font-mono text-ink">55740D4E</span>
          </p>
          <div className="my-8 grid place-items-center rounded-control bg-sunken py-8">
            <Stamp status="PAID" title="Paid" date="15 Nov 2026" code="TUM-MSC-INFORMATICS" animate />
          </div>
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
        </Panel>
        <Panel className="h-fit p-5">
          <h2 className="text-base font-semibold">Other applications</h2>
          <ul className="mt-3 flex flex-col gap-3">
            <li className="flex flex-col gap-1">
              <span className="text-sm">MSc Artificial Intelligence · KAIST</span>
              <StatusBadge status="SUBMITTED" label="Awaiting payment" />
            </li>
            <li className="flex flex-col gap-1">
              <span className="text-sm">MSc Computer Science · Birmingham</span>
              <StatusBadge status="PAYMENT_FAILED" label="Payment failed" />
            </li>
          </ul>
        </Panel>
      </div>
    </Shell>
  ),
}
