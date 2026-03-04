import { ProgressCallback } from '../types/index.js'

export async function trackDownloadProgress(
  response: Response,
  onProgress: ProgressCallback
): Promise<string> {
  const reader = response.body?.getReader()
  const total = parseInt(response.headers.get('content-length') ?? '0', 10)

  if (!reader) return response.text()

  const chunks: Uint8Array[] = []
  let loaded = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    chunks.push(value)
    loaded += value.length
    onProgress({
      loaded,
      total,
      percent: total > 0 ? Math.round((loaded / total) * 100) : 0,
    })
  }

  const all = new Uint8Array(loaded)
  let offset = 0
  for (const chunk of chunks) {
    all.set(chunk, offset)
    offset += chunk.length
  }

  return new TextDecoder().decode(all)
}

export function wrapFormDataWithProgress(formData: FormData, onProgress: ProgressCallback): FormData {
  return formData
}
