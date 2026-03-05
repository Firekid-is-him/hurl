import { ProgressCallback } from '../types/index.js'

export async function trackDownloadProgress(
  response: Response,
  onProgress: ProgressCallback
): Promise<ArrayBuffer> {
  const reader = response.body?.getReader()
  const total = parseInt(response.headers.get('content-length') ?? '0', 10)

  if (!reader) return new ArrayBuffer(0)

  const chunks: Uint8Array[] = []
  let loaded = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    chunks.push(value)
    loaded += value.byteLength
    onProgress({
      loaded,
      total,
      percent: total > 0 ? Math.round((loaded / total) * 100) : 0,
    })
  }

  
  const merged = new Uint8Array(loaded)
  let offset = 0
  for (const chunk of chunks) {
    merged.set(chunk, offset)
    offset += chunk.byteLength
  }

  return merged.buffer
}

export function wrapBodyWithUploadProgress(
  body: Exclude<BodyInit, FormData>,
  onProgress: ProgressCallback
): ReadableStream<Uint8Array> {

  let total = 0
  if (typeof body === 'string') {
    total = new TextEncoder().encode(body).byteLength
  } else if (body instanceof ArrayBuffer) {
    total = body.byteLength
  } else if (body instanceof Blob) {
    total = body.size
  }
 
  let loaded = 0

  
  const source: ReadableStream<Uint8Array> =
    body instanceof ReadableStream
      ? (body as ReadableStream<Uint8Array>)
      : (new Response(body as BodyInit).body as ReadableStream<Uint8Array>)

  return source.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        loaded += chunk.byteLength
        onProgress({
          loaded,
          total,
          percent: total > 0 ? Math.round((loaded / total) * 100) : 0,
        })
        controller.enqueue(chunk)
      },
    })
  )
}
