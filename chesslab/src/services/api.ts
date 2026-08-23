const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
const REQUEST_TIMEOUT_MS = 30_000

interface RequestOptions {
  method?: string
  body?: unknown
  headers?: Record<string, string>
}

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers } = options

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError(0, 'O servidor demorou demasiado a responder.')
    }
    throw new ApiError(0, 'Não foi possível ligar ao servidor. Está o backend a correr?')
  } finally {
    clearTimeout(timeout)
  }

  if (!response.ok) {
    throw new ApiError(response.status, await extractErrorMessage(response))
  }

  return (await response.json()) as T
}

async function extractErrorMessage(response: Response): Promise<string> {
  try {
    const data = await response.json()

    if (typeof data.detail === 'string') {
      return data.detail
    }

    if (Array.isArray(data.detail) && data.detail.length > 0) {
      return data.detail[0].msg ?? 'Dados inválidos.'
    }
  } catch {
    // resposta sem corpo JSON
  }

  return 'Ocorreu um erro inesperado. Tenta novamente.'
}
