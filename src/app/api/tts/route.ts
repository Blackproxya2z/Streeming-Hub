import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

let genAI: GoogleGenAI | null = null
function getGenAI(): GoogleGenAI {
  if (!genAI) {
    genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' })
  }
  return genAI
}

function cleanTextForTTS(text: string): string {
  return text
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\[(.+?)\]\((.+?)\)/g, '$1')
    .replace(/[•\-]\s/g, '')
    .replace(/\d+[.)]\s/g, '')
    .replace(/৳/g, 'টাকা')
    .replace(/\n/g, ' ')
    .trim()
}

export async function POST(request: NextRequest) {
  try {
    const { text, lang } = await request.json()
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text required' }, { status: 400 })
    }

    const cleanText = cleanTextForTTS(text)
    if (!cleanText) {
      return NextResponse.json({ error: 'Empty text after cleaning' }, { status: 400 })
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 })
    }

    const ai = getGenAI()

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: cleanText,
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: lang === 'english' ? 'Orus' : 'Aoede',
              },
            },
          },
        },
      })

      const candidate = response.candidates?.[0]
      const audioData = candidate?.content?.parts?.[0]?.inlineData

      if (!audioData?.data) {
        return NextResponse.json({ error: 'No audio generated' }, { status: 500 })
      }

      const audioBuffer = Buffer.from(audioData.data, 'base64')

      return new NextResponse(audioBuffer, {
        status: 200,
        headers: {
          'Content-Type': audioData.mimeType || 'audio/mp3',
          'Content-Length': String(audioBuffer.length),
          'Cache-Control': 'public, max-age=300',
        },
      })
    } catch (geminiErr) {
      console.error('Gemini TTS error:', geminiErr)
      return NextResponse.json({ error: 'Gemini TTS failed', fallback: true }, { status: 503 })
    }
  } catch (error) {
    console.error('TTS route error:', error)
    return NextResponse.json({ error: 'TTS generation failed' }, { status: 500 })
  }
}
