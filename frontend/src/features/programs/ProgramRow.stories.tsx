import type { Meta, StoryObj } from '@storybook/react-vite'
import { createMemoryHistory, createRootRoute, createRouter, RouterProvider } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import type { Program } from '../../api/schemas'
import { Panel } from '../../ui/Panel'
import { ProgramRow } from './ProgramRow'
import '../../app/i18n'

// Links need a router; this one renders the story at "/" and nothing else.
function WithRouter({ children }: { children: ReactNode }) {
  const router = createRouter({
    routeTree: createRootRoute({ component: () => <>{children}</> }),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })
  return <RouterProvider router={router} />
}

const now = new Date('2026-11-15T12:00:00Z')
const base: Program = {
  id: 'tum-msc-informatics',
  university: 'Technical University of Munich',
  name: 'MSc Informatics',
  country: 'Germany',
  degree: 'MASTER',
  applicationFee: 75,
  currency: 'EUR',
  deadline: '2027-05-31',
}

const worstCase: Program[] = [
  base,
  {
    ...base,
    id: 'bologna',
    university: 'University of Bologna',
    name: 'MSc Electronic Engineering - Curriculum Electronic Technologies for Big-data and Internet of Things (E-BIT)',
    country: 'Italy',
    applicationFee: 95,
  },
  {
    ...base,
    id: 'unbroken',
    university: 'Universität-für-Bodenkultur-Wien-Institut-für-Ingenieurbiologie-und-Landschaftsbau',
    name: 'MSc Ingenieurbiologieundlandschaftsbauundumweltplanungundnachhaltigkeitsmanagement',
    country: 'Switzerland',
    currency: 'CHF',
    applicationFee: 150,
  },
  {
    ...base,
    id: 'today',
    name: 'MSc Closes Today',
    deadline: '2026-11-15',
    currency: 'SEK',
    applicationFee: 950,
  },
  { ...base, id: 'closed', name: 'BSc Computer Engineering', degree: 'BACHELOR', deadline: '2026-04-15' },
]

const meta = {
  title: 'Programs/ProgramRow',
  parameters: { layout: 'padded' },
  render: () => (
    <WithRouter>
      <Panel className="divide-y divide-line">
        {worstCase.map((program) => (
          <ProgramRow key={program.id} program={program} locale="en" now={now} />
        ))}
      </Panel>
    </WithRouter>
  ),
} satisfies Meta

export default meta

export const WorstCase: StoryObj<typeof meta> = {}
