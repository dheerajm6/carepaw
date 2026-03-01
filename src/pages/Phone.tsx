import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { TabPage } from '../components/PageTransition'
import { signInWithPhoneNumber, RecaptchaVerifier } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { useApp } from '../lib/store'

declare global {
  interface Window { recaptchaVerifier?: RecaptchaVerifier }
}

export default function Phone() {
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { setConfirmation } = useApp()
  const navigate = useNavigate()

  const valid = phone.replace(/\D/g, '').length === 10

  const getVerifier = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-anchor', { size: 'invisible' })
    }
    return window.recaptchaVerifier
  }

  const handleSend = async () => {
    if (!valid) return
    setLoading(true)
    setError('')
    try {
      const fullNumber = `+91${phone.replace(/\D/g, '')}`
      const result = await signInWithPhoneNumber(auth, fullNumber, getVerifier())
      setConfirmation(result)
      navigate('/otp', { state: { phone: fullNumber } })
    } catch (e: any) {
      window.recaptchaVerifier?.clear()
      window.recaptchaVerifier = undefined
      setError(e?.message ?? 'Failed to send OTP. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <TabPage className="flex flex-col bg-bg">
      {/* Header */}
      <div className="bg-primary px-6 pt-16 pb-10 flex flex-col items-center gap-3">
        <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center">
          <span className="text-3xl">🐾</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">CarePaw</h1>
        <p className="text-white/60 text-sm">Community Care for Street Dogs</p>
      </div>

      {/* Form */}
      <div className="flex-1 px-6 pt-8 flex flex-col gap-5">
        <div>
          <h2 className="text-xl font-bold text-text">Welcome back</h2>
          <p className="text-muted text-sm mt-1">Enter your mobile number to continue</p>
        </div>

        <div className="flex gap-2">
          <div className="flex items-center gap-2 px-4 py-3.5 rounded-ios-lg border border-border bg-white">
            <span className="text-lg">🇮🇳</span>
            <span className="font-semibold text-text">+91</span>
          </div>
          <input
            className="ios-input flex-1"
            type="tel"
            inputMode="numeric"
            placeholder="98765 43210"
            maxLength={10}
            value={phone}
            onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            autoFocus
          />
        </div>

        {error && <p className="text-danger text-sm">{error}</p>}

        <button
          className="ios-btn-primary mt-2"
          onClick={handleSend}
          disabled={!valid || loading}
        >
          {loading ? 'Sending OTP…' : 'Send OTP'}
        </button>

        <p className="text-center text-xs text-muted mt-2">
          By continuing, you agree to our{' '}
          <span className="text-primary font-medium">Terms of Service</span> and{' '}
          <span className="text-primary font-medium">Privacy Policy</span>.
        </p>
      </div>

      <div id="recaptcha-anchor" />
    </TabPage>
  )
}
