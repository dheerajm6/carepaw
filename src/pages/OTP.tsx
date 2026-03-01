import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { StackPage } from '../components/PageTransition'
import { ChevronLeft } from 'lucide-react'
import { useApp } from '../lib/store'

const LEN = 6

export default function OTP() {
  const [digits, setDigits] = useState<string[]>(Array(LEN).fill(''))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(30)
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const { confirmation } = useApp()
  const navigate = useNavigate()
  const { state } = useLocation()
  const phone: string = state?.phone ?? ''

  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  const masked = phone.replace(/(\+\d{2})(\d{5})(\d{5})/, '$1 ••••• $3')

  const verify = async (code: string) => {
    if (!confirmation) { setError('Session expired. Go back and try again.'); return }
    setLoading(true)
    setError('')
    try {
      await confirmation.confirm(code)
      // onAuthStateChanged in App will redirect to /discover
    } catch {
      setError('Incorrect OTP. Please try again.')
      setDigits(Array(LEN).fill(''))
      refs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const onChange = (i: number, val: string) => {
    const d = val.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[i] = d
    setDigits(next)
    if (d && i < LEN - 1) refs.current[i + 1]?.focus()
    if (d && i === LEN - 1 && next.every(Boolean)) verify(next.join(''))
  }

  const onKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus()
  }

  return (
    <StackPage className="flex flex-col bg-bg">
      {/* Back */}
      <button
        onClick={() => navigate('/phone')}
        className="absolute top-12 left-4 w-10 h-10 flex items-center justify-center rounded-full bg-white border border-border shadow-sm"
      >
        <ChevronLeft size={20} className="text-text" />
      </button>

      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
        <div className="text-5xl">🔐</div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-text">Enter OTP</h2>
          <p className="text-muted text-sm mt-2">
            We sent a 6-digit code to<br />
            <span className="font-semibold text-text">{masked}</span>
          </p>
        </div>

        {/* OTP boxes */}
        <div className="flex gap-2.5">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={el => { refs.current[i] = el }}
              className={`w-12 h-14 text-center text-xl font-bold rounded-ios-lg border-2 outline-none transition-all bg-white
                ${d ? 'border-primary bg-primary/5' : 'border-border'}
                focus:border-primary focus:ring-2 focus:ring-primary/20`}
              type="tel"
              inputMode="numeric"
              maxLength={2}
              value={d}
              onChange={e => onChange(i, e.target.value)}
              onKeyDown={e => onKeyDown(i, e)}
              autoFocus={i === 0}
            />
          ))}
        </div>

        {error && <p className="text-danger text-sm text-center">{error}</p>}

        <button
          className="ios-btn-primary w-full max-w-xs"
          onClick={() => verify(digits.join(''))}
          disabled={!digits.every(Boolean) || loading}
        >
          {loading ? 'Verifying…' : 'Verify OTP'}
        </button>

        <div className="flex items-center gap-1 text-sm">
          <span className="text-muted">Didn't receive it?</span>
          {countdown > 0 ? (
            <span className="text-muted">Resend in {countdown}s</span>
          ) : (
            <button className="text-primary font-semibold" onClick={() => navigate('/phone')}>
              Resend OTP
            </button>
          )}
        </div>
      </div>
    </StackPage>
  )
}
