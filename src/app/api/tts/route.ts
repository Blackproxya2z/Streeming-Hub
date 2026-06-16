import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 15

// ─── ZAI Singleton ──────────────────────────────────────────────────────────

import { writeFile } from 'fs/promises'
import { join } from 'path'

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null
let zaiConfigWritten = false

async function ensureZAIConfig(): Promise<boolean> {
  if (zaiConfigWritten) return true
  const zaiConfig = process.env.ZAI_CONFIG
  if (!zaiConfig) return false
  try {
    const configStr = zaiConfig.trim()
    const tmpPath = join('/tmp', '.z-ai-config')
    const cwdPath = join(process.cwd(), '.z-ai-config')
    await writeFile(tmpPath, configStr, 'utf-8').catch(() => {})
    await writeFile(cwdPath, configStr, 'utf-8').catch(() => {})
    const homeDir = process.env.HOME || process.env.USERPROFILE || '/tmp'
    const homePath = join(homeDir, '.z-ai-config')
    await writeFile(homePath, configStr, 'utf-8').catch(() => {})
    zaiConfigWritten = true
    return true
  } catch {
    return false
  }
}

async function getZAI() {
  try {
    if (!zaiInstance) {
      await ensureZAIConfig()
      zaiInstance = await ZAI.create()
    }
    return zaiInstance
  } catch {
    return null
  }
}

// ─── TTS Text Cleanup ────────────────────────────────────────────────────────

function cleanTextForTTS(text: string, lang?: string): string {
  let clean = text
    // Remove emojis
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu, '')
    // Remove markdown bold
    .replace(/\*\*(.+?)\*\*/g, '$1')
    // Remove markdown links
    .replace(/\[(.+?)\]\((.+?)\)/g, '$1')
    // Remove bullet markers
    .replace(/[•\-]\s/g, '')
    // Remove numbered list markers
    .replace(/\d+[.)]\s/g, '')
    // Currency replacements
    .replace(/৳/g, 'টাকা')
    .replace(/BDT/gi, 'টাকা')
    // Payment method replacements for natural speech
    .replace(/\bbKash\b/gi, 'বিকাশ')
    .replace(/\bNagad\b/gi, 'নগদ')
    .replace(/\bWhatsApp\b/gi, 'হোয়াটসঅ্যাপ')
    // Newlines → spaces
    .replace(/↵/g, ' ')
    .replace(/\n/g, ' ')
    // Collapse multiple spaces
    .replace(/\s+/g, ' ')
    .trim()

  // Summarize long text for TTS: keep first 2-4 sentences (max ~300 chars)
  if (clean.length > 350) {
    const sentences = clean.match(/[^।\.\!\?]+[।\.\!\?]+/g)
    if (sentences && sentences.length > 3) {
      clean = sentences.slice(0, 3).join(' ').trim()
    } else {
      clean = clean.substring(0, 350).replace(/\s+\S*$/, '') + '...'
    }
  }

  return clean
}

// ─── ElevenLabs TTS (PRIMARY) ────────────────────────────────────────────────

async function synthesizeWithElevenLabs(
  text: string,
  lang?: string,
): Promise<Buffer | null> {
  const apiKey = process.env.ELEVENLABS_API_KEY
  const voiceId = process.env.ELEVENLABS_VOICE_ID

  if (!apiKey || !voiceId) {
    return null
  }

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.75,
            similarity_boost: 0.8,
            style: 0.3,
            use_speaker_boost: true,
          },
          language_code: lang === 'english' ? 'en' : 'bn',
        }),
      },
    )

    if (!response.ok) return null

    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch {
    return null
  }
}

// ─── ZAI TTS (BACKUP — uses z-ai-web-dev-sdk) ──────────────────────────────

async function synthesizeWithZAI(
  text: string,
  _lang?: string,
): Promise<Buffer | null> {
  try {
    const zai = await getZAI()
    if (!zai) return null
    const response = await zai.audio.tts.create({
      input: text,
      voice: 'tongtong',
      speed: 0.9,
      response_format: 'mp3',
      stream: false,
    })

    // ZAI TTS returns a standard Response object — use arrayBuffer()
    const arrayBuffer = await response.arrayBuffer()
    if (!arrayBuffer || arrayBuffer.byteLength === 0) return null

    return Buffer.from(new Uint8Array(arrayBuffer))
  } catch (err) {
    console.error('[tts] ZAI TTS error:', err instanceof Error ? err.message : err)
    return null
  }
}

// ─── POST Handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const { text, lang } = await request.json() as { text: string; lang?: 'bangla' | 'banglish' | 'english' }

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text required' }, { status: 400 })
    }

    const cleanText = cleanTextForTTS(text, lang)
    if (!cleanText) {
      return NextResponse.json({ error: 'Empty text after cleaning' }, { status: 400 })
    }

    // ── Priority 1: ElevenLabs TTS ──
    const elevenLabsAudio = await synthesizeWithElevenLabs(cleanText, lang)
    if (elevenLabsAudio) {
      return new NextResponse(new Uint8Array(elevenLabsAudio), {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': String(elevenLabsAudio.length),
          'Cache-Control': 'public, max-age=300',
          'X-TTS-Provider': 'elevenlabs',
        },
      })
    }

    // ── Priority 2: ZAI TTS ──
    const zaiAudio = await synthesizeWithZAI(cleanText, lang)
    if (zaiAudio) {
      return new NextResponse(new Uint8Array(zaiAudio), {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': String(zaiAudio.length),
          'Cache-Control': 'public, max-age=300',
          'X-TTS-Provider': 'zai',
        },
      })
    }

    // ── Priority 3: Browser TTS fallback hint ──
    return NextResponse.json(
      { error: 'Server TTS unavailable', fallback: true },
      { status: 503 },
    )
  } catch (error) {
    console.error('TTS route error:', error)
    return NextResponse.json(
      { error: 'TTS generation failed', fallback: true },
      { status: 500 },
    )
  }
}
