import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const title = searchParams.get('title') || 'Streaming Hub'
  const description = searchParams.get('description') || "Bangladesh's #1 Digital Subscription Store"
  const price = searchParams.get('price') || ''

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#059669',
          backgroundImage: 'linear-gradient(135deg, #059669 0%, #0d9488 50%, #047857 100%)',
          padding: '60px',
        }}
      >
        {/* Background pattern */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.05,
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '30px 30px',
          }}
        />

        {/* Main content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '20px',
            zIndex: 1,
          }}
        >
          {/* Logo / Brand */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '10px',
            }}
          >
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '16px',
                backgroundColor: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                color: 'white',
                fontWeight: 'bold',
              }}
            >
              SH
            </div>
            <span
              style={{
                fontSize: '28px',
                fontWeight: 'bold',
                color: 'white',
                letterSpacing: '-0.5px',
              }}
            >
              Streaming Hub
            </span>
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: title.length > 40 ? '36px' : '48px',
              fontWeight: 'bold',
              color: 'white',
              textAlign: 'center',
              lineHeight: 1.2,
              maxWidth: '900px',
            }}
          >
            {title}
          </div>

          {/* Description */}
          <div
            style={{
              fontSize: '22px',
              color: 'rgba(255,255,255,0.85)',
              textAlign: 'center',
              maxWidth: '800px',
              lineHeight: 1.4,
            }}
          >
            {description}
          </div>

          {/* Price badge */}
          {price && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '10px',
                padding: '12px 28px',
                borderRadius: '50px',
                backgroundColor: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.3)',
                fontSize: '28px',
                fontWeight: 'bold',
                color: 'white',
              }}
            >
              {price}
            </div>
          )}

          {/* Bottom info */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '30px',
              marginTop: '20px',
              fontSize: '16px',
              color: 'rgba(255,255,255,0.7)',
            }}
          >
            <span>✅ Warranty</span>
            <span>⚡ 5-20 Min Delivery</span>
            <span>💳 bKash / Nagad</span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
