import type { VoiceGuide } from './useVoiceGuide'

/* Idle: a single inviting pill. Live: a broadcast lower-third — breathing orb,
   caption, end button — the only chrome left on the stage. Renders nothing at
   all when the token endpoint is absent (deployed static site). */

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
      <rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor" />
      <path d="M5 11a7 7 0 0 0 14 0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 18v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export default function VoiceDock({ voice }: { voice: VoiceGuide }) {
  const { status, caption, speaking, error, start, stop } = voice
  if (status === 'checking' || status === 'unavailable') return null

  if (status === 'idle' || status === 'error') {
    return (
      <div className="voice-dock">
        {status === 'error' && <div className="voice-caption voice-error-msg">Voice failed: {error}</div>}
        <button className="voice-pill" onClick={start} title="Talk to the dashboard">
          <MicIcon />
          <span className="voice-label">Ask the guide</span>
        </button>
      </div>
    )
  }

  const connecting = status === 'connecting'
  return (
    <div className={`voice-dock voice-hud-wrap${speaking ? ' voice-speaking' : ''}${connecting ? ' voice-connecting' : ''}`}>
      <div className="voice-hud">
        <div className="voice-orb" aria-hidden="true">
          <span className="voice-orb-core" />
          <span className="voice-orb-ring r1" />
          <span className="voice-orb-ring r2" />
        </div>
        <div className="voice-hud-text">
          <div className="voice-hud-state">
            {connecting ? 'Connecting…' : speaking ? 'Guide speaking — just talk to interrupt' : 'Listening'}
          </div>
          {caption && <div className="voice-hud-caption">{caption}</div>}
        </div>
        <button className="voice-hud-end" onClick={stop} title="End the voice guide" aria-label="End the voice guide">✕</button>
      </div>
    </div>
  )
}
