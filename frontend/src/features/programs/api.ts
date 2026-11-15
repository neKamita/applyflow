import { queryOptions } from '@tanstack/react-query'
import * as z from 'zod/mini'
import { apiFetch } from '../../api/client'
import { program } from '../../api/schemas'

export const programsQuery = () =>
  queryOptions({
    queryKey: ['programs'],
    queryFn: async ({ signal }) =>
      (await apiFetch('/api/programs', { schema: z.array(program), signal })).data,
  })

export const programQuery = (id: string) =>
  queryOptions({
    queryKey: ['programs', id],
    queryFn: async ({ signal }) =>
      (await apiFetch(`/api/programs/${encodeURIComponent(id)}`, { schema: program, signal })).data,
  })
