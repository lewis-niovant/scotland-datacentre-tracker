import type { IncomingMessage, ServerResponse } from 'node:http'
import { loadEnv, type Plugin } from 'vite'

/* Dev-only ephemeral-token minting for the voice guide.

   The OpenAI Realtime API must never see the real API key from the browser,
   so the browser asks this endpoint for a short-lived client secret instead.
   The key lives in app/.env.local (gitignored) as OPENAI_API_KEY. In the
   production build this middleware simply does not exist: the probe from
   useVoiceGuide 404s and the voice UI stays hidden. */

/* Keep in sync with REALTIME_MODEL in src/voice/useVoiceGuide.ts. */
const DEFAULT_MODEL = 'gpt-realtime-2.1-mini'
/* Sidecar text model for lightweight in-conversation lookups (ai_brief,
   research tools). Small, fast, minimal reasoning. */
const DEFAULT_QUICK_MODEL = 'gpt-5-mini'

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (c) => { body += c })
    req.on('end', () => resolve(body))
    req.on('error', reject)
  })
}

export default function realtimeToken(): Plugin {
  let apiKey = ''
  let model = DEFAULT_MODEL
  let quickModel = DEFAULT_QUICK_MODEL

  /* POST { system?, prompt, max_tokens? } → { text }. The realtime agent uses
     this as a fast sidecar brain: summarise a record, answer over the roster. */
  const quickLlm = async (req: IncomingMessage, res: ServerResponse) => {
    res.setHeader('content-type', 'application/json')
    if (req.method !== 'POST') { res.statusCode = 405; res.end(JSON.stringify({ error: 'POST only' })); return }
    if (!apiKey) { res.statusCode = 503; res.end(JSON.stringify({ error: 'OPENAI_API_KEY not set' })); return }
    try {
      const { system, prompt, max_tokens } = JSON.parse(await readBody(req) || '{}')
      if (!prompt) { res.statusCode = 400; res.end(JSON.stringify({ error: 'prompt required' })); return }
      const upstream = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          model: quickModel,
          input: [
            ...(system ? [{ role: 'system', content: String(system) }] : []),
            { role: 'user', content: String(prompt) },
          ],
          max_output_tokens: Math.min(Number(max_tokens) || 220, 400),
          reasoning: { effort: 'minimal' },
        }),
      })
      const j = await upstream.json() as {
        output_text?: string
        output?: Array<{ type: string; content?: Array<{ type: string; text?: string }> }>
        error?: { message?: string }
      }
      if (!upstream.ok) {
        res.statusCode = upstream.status
        res.end(JSON.stringify({ error: j.error?.message ?? 'upstream error' }))
        return
      }
      const text = j.output_text
        ?? j.output?.flatMap((o) => o.content ?? []).map((c) => c.text ?? '').join('').trim()
        ?? ''
      res.end(JSON.stringify({ text }))
    } catch (e) {
      res.statusCode = 502
      res.end(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }))
    }
  }

  const handler = async (req: IncomingMessage, res: ServerResponse) => {
    res.setHeader('content-type', 'application/json')
    if (req.method === 'GET') {
      res.end(JSON.stringify({ available: Boolean(apiKey), model }))
      return
    }
    if (req.method !== 'POST') {
      res.statusCode = 405
      res.end(JSON.stringify({ error: 'POST only' }))
      return
    }
    if (!apiKey) {
      res.statusCode = 503
      res.end(JSON.stringify({ error: 'OPENAI_API_KEY is not set — add it to app/.env.local and restart the dev server.' }))
      return
    }
    try {
      const upstream = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
        method: 'POST',
        headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          expires_after: { anchor: 'created_at', seconds: 600 },
          session: {
            type: 'realtime',
            model,
            audio: {
              input: {
                /* Low eagerness plus noise reduction: the guide was being cut
                   off mid-greeting by room noise and breath, which read as a
                   stunted, broken opening. It now waits for a real turn. */
                turn_detection: { type: 'semantic_vad', eagerness: 'low', interrupt_response: true },
                noise_reduction: { type: 'near_field' },
              },
              output: { voice: 'marin' },
            },
          },
        }),
      })
      res.statusCode = upstream.status
      res.end(await upstream.text())
    } catch (e) {
      res.statusCode = 502
      res.end(JSON.stringify({ error: `Could not reach OpenAI: ${e instanceof Error ? e.message : e}` }))
    }
  }

  /* Same as quickLlm but streams raw text chunks straight to the browser, so
     an artifact can render itself line by line while the model writes. */
  const quickLlmStream = async (req: IncomingMessage, res: ServerResponse) => {
    if (req.method !== 'POST') { res.statusCode = 405; res.end('POST only'); return }
    if (!apiKey) { res.statusCode = 503; res.end('OPENAI_API_KEY not set'); return }
    try {
      const { system, prompt, max_tokens } = JSON.parse(await readBody(req) || '{}')
      const upstream = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          model: quickModel,
          input: [
            ...(system ? [{ role: 'system', content: String(system) }] : []),
            { role: 'user', content: String(prompt) },
          ],
          max_output_tokens: Math.min(Number(max_tokens) || 400, 700),
          reasoning: { effort: 'minimal' },
          stream: true,
        }),
      })
      if (!upstream.ok || !upstream.body) {
        res.statusCode = upstream.status
        res.end(await upstream.text())
        return
      }
      res.setHeader('content-type', 'text/plain; charset=utf-8')
      res.setHeader('cache-control', 'no-cache')
      const reader = upstream.body.getReader()
      const dec = new TextDecoder()
      let buf = ''
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        buf += dec.decode(value, { stream: true })
        const lines = buf.split('\n')
        buf = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data:')) continue
          const payload = line.slice(5).trim()
          if (!payload || payload === '[DONE]') continue
          try {
            const ev = JSON.parse(payload) as { type?: string; delta?: string }
            if (ev.type === 'response.output_text.delta' && ev.delta) res.write(ev.delta)
          } catch { /* keep-alive or partial frame */ }
        }
      }
      res.end()
    } catch (e) {
      if (!res.headersSent) res.statusCode = 502
      res.end(e instanceof Error ? e.message : String(e))
    }
  }

  return {
    name: 'realtime-token',
    configResolved(config) {
      const env = loadEnv(config.mode, config.envDir ?? config.root, '')
      apiKey = env.OPENAI_API_KEY ?? process.env.OPENAI_API_KEY ?? ''
      model = env.OPENAI_REALTIME_MODEL ?? process.env.OPENAI_REALTIME_MODEL ?? DEFAULT_MODEL
      quickModel = env.OPENAI_QUICK_MODEL ?? process.env.OPENAI_QUICK_MODEL ?? DEFAULT_QUICK_MODEL
    },
    configureServer(server) {
      server.middlewares.use('/api/realtime-token', handler)
      server.middlewares.use('/api/quick-llm', quickLlm)
      server.middlewares.use('/api/quick-llm-stream', quickLlmStream)
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/realtime-token', handler)
      server.middlewares.use('/api/quick-llm', quickLlm)
      server.middlewares.use('/api/quick-llm-stream', quickLlmStream)
    },
  }
}
