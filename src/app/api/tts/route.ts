import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 15

// ─── OpenAI Client (lazy init to avoid build-time crash) ──────────────────────

let openaiClient: OpenAI | null = null
function getOpenAI(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-build',
      timeout: 12_000,
      maxRetries: 1,
    })
  }
  return openaiClient
}

// ─── TTS Text Cleanup ────────────────────────────────────────────────────────
// Cleans markdown, emojis, and replaces terms for natural Bengali speech

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

  // For Banglish mode, if the text contains Bangla script and Banglish is requested,
  // we could transliterate, but for now we keep as-is since ElevenLabs handles it well.
  // The chat API already generates Banglish text for Banglish mode.

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
    console.warn('ElevenLabs API key or Voice ID not configured, skipping')
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
          // Language hint for better pronunciation
          language_code: lang === 'english' ? 'en' : 'bn',
        }),
      },
    )

    if (!response.ok) {
      const errBody = await response.text().catch(() => '')
      console.error(`ElevenLabs TTS error (${response.status}): ${errBody}`)
      return null
    }

    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch (err) {
    console.error('ElevenLabs TTS exception:', err)
    return null
  }
}

// ─── OpenAI TTS (BACKUP) ─────────────────────────────────────────────────────

async function synthesizeWithOpenAI(
  text: string,
  lang?: string,
): Promise<Buffer | null> {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'dummy-key-for-build') {
    console.warn('OpenAI API key not configured, skipping OpenAI TTS')
    return null
  }

  try {
    const openai = getOpenAI()

    // Build instructions for voice style based on language
    const instructionsByLang: Record<string, string> = {
      bangla: 'Speak in a warm, friendly, polite Bangladeshi female sales representative voice. Pronounce Bengali clearly and naturally. Use a moderate pace — not too fast, not too slow. Add natural pauses between sentences. Sound professional yet approachable, like a customer support agent who genuinely wants to help.',
      banglish: 'Speak in Romanized Bengali (Banglish) with a warm, friendly, polite Bangladeshi female tone. Pronounce each word clearly. Use a moderate pace so every word is understandable. Sound professional yet approachable, like a helpful sales representative.',
      english: 'Speak in a warm, friendly, polite female voice with a slight South Asian accent. Pronounce everything clearly. Use a moderate pace. Sound professional yet approachable, like a helpful sales representative.',
    }

    const instructions = instructionsByLang[lang || 'bangla'] || instructionsByLang.bangla

    const response = await openai.audio.speech.create({
      model: 'gpt-4o-mini-tts',
      voice: 'shimmer', // Female voice, clear and warm
      input: text,
      instructions,
      response_format: 'mp3',
      speed: 0.9, // Slightly slower for clarity
    })

    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch (err) {
    console.error('OpenAI TTS exception:', err)
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
      return new NextResponse(elevenLabsAudio, {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': String(elevenLabsAudio.length),
          'Cache-Control': 'public, max-age=300',
          'X-TTS-Provider': 'elevenlabs',
        },
      })
    }

    // ── Priority 2: OpenAI TTS ──
    const openaiAudio = await synthesizeWithOpenAI(cleanText, lang)
    if (openaiAudio) {
      return new NextResponse(openaiAudio, {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': String(openaiAudio.length),
          'Cache-Control': 'public, max-age=300',
          'X-TTS-Provider': 'openai',
        },
      })
    }

    // ── Priority 3: Browser TTS fallback hint ──
    // Both server-side TTS failed — tell client to use browser speechSynthesis
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
