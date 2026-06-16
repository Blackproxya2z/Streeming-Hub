import { NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { readFile } from 'fs/promises'
import { join } from 'path'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 15

interface Diagnostics {
  envConfigSet: boolean
  envConfigLength: number
  envConfigValid?: boolean
  envConfigKeys?: string[]
  envConfigBaseUrl?: string
  envConfigApiKey?: string
  envConfigError?: string
  cwd: string
  homeDir: string
  configPaths: Record<string, { exists: boolean; length?: number; valid?: boolean; error?: string }>
  zaiInstanceCreated: boolean
  zaiChatSuccess?: boolean
  zaiResponse?: string
  zaiError?: string
  zaiErrorCause?: string
  zaiErrorStack?: string
  directFetchTest?: Record<string, unknown>
}

export async function GET() {
  const diagnostics: Diagnostics = {
    envConfigSet: false,
    envConfigLength: 0,
    cwd: '',
    homeDir: '',
    configPaths: {},
    zaiInstanceCreated: false,
  }

  // 1. Check env var
  const envConfig = process.env.ZAI_CONFIG?.trim()
  diagnostics.envConfigSet = !!envConfig
  diagnostics.envConfigLength = envConfig?.length || 0
  if (envConfig) {
    try {
      const parsed = JSON.parse(envConfig)
      diagnostics.envConfigValid = true
      diagnostics.envConfigKeys = Object.keys(parsed)
      diagnostics.envConfigBaseUrl = parsed.baseUrl
      diagnostics.envConfigApiKey = parsed.apiKey
    } catch (e) {
      diagnostics.envConfigValid = false
      diagnostics.envConfigError = e instanceof Error ? e.message : 'unknown'
    }
  }

  // 2. Check filesystem paths
  const homeDir = process.env.HOME || process.env.USERPROFILE || '/tmp'
  const configPaths = [
    join(process.cwd(), '.z-ai-config'),
    join(homeDir, '.z-ai-config'),
    '/etc/.z-ai-config',
  ]
  diagnostics.cwd = process.cwd()
  diagnostics.homeDir = homeDir
  for (const p of configPaths) {
    try {
      const content = await readFile(p, 'utf-8')
      diagnostics.configPaths[p] = { exists: true, length: content.length, valid: !!JSON.parse(content).baseUrl }
    } catch (e) {
      diagnostics.configPaths[p] = { exists: false, error: e instanceof Error ? e.message : 'unknown' }
    }
  }

  // 3. Try to create ZAI instance directly
  try {
    const config = envConfig ? JSON.parse(envConfig) : null
    if (config && config.baseUrl && config.apiKey) {
      const ZaiCtor = ZAI as unknown as new (c: typeof config) => {
        chat: {
          completions: {
            create: (b: { messages: Array<{ role: string; content: string }> }) => Promise<{
              choices: Array<{ message: { content: string } }>
            }>
          }
        }
      }
      const zai = new ZaiCtor(config)
      diagnostics.zaiInstanceCreated = true

      // 4. Try a simple chat completion
      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'assistant', content: 'You are a helpful assistant. Reply in Bengali.' },
          { role: 'user', content: 'বল হ্যালো' },
        ],
      })
      diagnostics.zaiChatSuccess = true
      diagnostics.zaiResponse = completion?.choices?.[0]?.message?.content?.substring(0, 200)
    } else {
      diagnostics.zaiInstanceCreated = false
      diagnostics.zaiError = 'No valid config'
    }
  } catch (e) {
    diagnostics.zaiInstanceCreated = false
    diagnostics.zaiChatSuccess = false
    diagnostics.zaiError = e instanceof Error ? e.message : String(e)
    if (e instanceof Error && 'cause' in e) {
      const cause = (e as Error & { cause?: unknown }).cause
      diagnostics.zaiErrorCause = cause instanceof Error ? cause.message : String(cause)
    }
    diagnostics.zaiErrorStack = e instanceof Error ? e.stack?.substring(0, 500) : undefined
  }

  // 5. Direct fetch test to ZAI API (bypass SDK)
  try {
    const config = envConfig ? JSON.parse(envConfig) : null
    if (config && config.baseUrl) {
      const startTime = Date.now()
      const res = await fetch(`${config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
          'X-Z-AI-From': 'Z',
          ...(config.chatId ? { 'X-Chat-Id': config.chatId } : {}),
          ...(config.userId ? { 'X-User-Id': config.userId } : {}),
          ...(config.token ? { 'X-Token': config.token } : {}),
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'hi' }],
          thinking: { type: 'disabled' },
        }),
        signal: AbortSignal.timeout(10000),
      })
      diagnostics.directFetchTest = {
        status: res.status,
        statusText: res.statusText,
        timeMs: Date.now() - startTime,
        ok: res.ok,
      }
      if (!res.ok) {
        const text = await res.text()
        diagnostics.directFetchTest!.errorBody = text.substring(0, 500)
      }
    }
  } catch (e) {
    diagnostics.directFetchTest = {
      error: e instanceof Error ? e.message : String(e),
      cause: e instanceof Error && 'cause' in e
        ? String((e as Error & { cause?: unknown }).cause)
        : undefined,
    }
  }

  return NextResponse.json(diagnostics, { headers: { 'Cache-Control': 'no-cache' } })
}
