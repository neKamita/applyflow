import { apiFetch } from '../../api/client'
import { tokenResponse, type TokenResponse } from '../../api/schemas'

export interface Credentials {
  username: string
  password: string
}

export async function requestToken(credentials: Credentials): Promise<TokenResponse> {
  const { data } = await apiFetch('/auth/token', { method: 'POST', body: credentials, schema: tokenResponse })
  return data
}
