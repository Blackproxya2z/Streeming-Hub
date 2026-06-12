import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

// ─── ZAI Singleton ──────────────────────────────────────────────────────────

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null

async function getZAI() {
  if (!zaiInstance) zaiInstance = await ZAI.create()
  return zaiInstance
}

// ─── Rate Limiting (max 10 requests per minute per IP) ─────────────────────

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 })
    return true
  }

  if (entry.count >= 10) {
    return false
  }

  entry.count++
  return true
}

// ─── Timeout Utility ────────────────────────────────────────────────────────

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('ASR_TIMEOUT')), ms)
    ),
  ])
}

// ─── Periodic cleanup of stale rate-limit entries ───────────────────────────

setInterval(() => {
  const now = Date.now()
  for (const [ip, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) rateLimitMap.delete(ip)
  }
}, 120_000)

// ─── POST Handler: Accept audio FormData, transcribe via ASR ────────────────

export async function POST(request: NextRequest) {
  try {
    // ── Rate limit check (by IP) ──────────────────────────────────────────
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown'

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a moment and try again.' },
        { status: 429 }
      )
    }

    // ── Parse FormData ────────────────────────────────────────────────────
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File | null

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      )
    }

    // ── Convert audio to base64 ───────────────────────────────────────────
    const arrayBuffer = await audioFile.arrayBuffer()
    const base64Audio = Buffer.from(arrayBuffer).toString('base64')

    if (!base64Audio) {
      return NextResponse.json(
        { error: 'Failed to process audio file.' },
        { status: 400 }
      )
    }

    // ── Call ASR with 5-second timeout ────────────────────────────────────
    const zai = await getZAI()
    const result = await withTimeout(
      zai.audio.asr.create({ file_base64: base64Audio }),
      5_000
    )

    const text = result?.text || ''

    if (!text) {
      return NextResponse.json(
        { error: 'Could not transcribe audio. Please try again.' },
        { status: 422 }
      )
    }

    return NextResponse.json({ text })
  } catch (error) {
    // Handle timeout specifically
    if (error instanceof Error && error.message === 'ASR_TIMEOUT') {
      console.error('[voice] ASR timeout after 5s')
      return NextResponse.json(
        { error: 'Transcription timed out. Please try a shorter recording.' },
        { status: 504 }
      )
    }

    console.error('[voice] ASR error:', error)
    return NextResponse.json(
      { error: 'Voice transcription failed. Please try again or type your message.' },
      { status: 500 }
    )
  }
}
