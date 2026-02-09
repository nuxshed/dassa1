const apiurl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface apioptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  token?: string | null;
}

export const apicall = async (endpoint: string, options: apioptions = {}) => {
  const { method = 'GET', body, token } = options

  const headers: HeadersInit = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const config: RequestInit = { method, headers }
  if (body) config.body = JSON.stringify(body)

  const res = await fetch(`${apiurl}${endpoint}`, config)
  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.message || data.error?.[0]?.message || 'request failed')
  }

  return data
};
