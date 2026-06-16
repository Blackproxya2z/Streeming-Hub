import { NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { readFile } from 'fs/promises'
import { join } from 'path'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 15

export async function GET() {
  const diagnostics: Record<string, unknown> = {}

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
  diagnostics.configPaths = {}
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
    diagnostics.zaiErrorStack = e instanceof Error ? e.stack?.substring(0, 500) : undefined
  }

  return NextResponse.json(diagnostics, { headers: { 'Cache-Control': 'no-cache' } })
}
