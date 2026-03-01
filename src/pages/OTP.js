import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { StackPage } from '../components/PageTransition';
import { ChevronLeft } from 'lucide-react';
import { useApp } from '../lib/store';
const LEN = 6;
export default function OTP() {
    const [digits, setDigits] = useState(Array(LEN).fill(''));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [countdown, setCountdown] = useState(30);
    const refs = useRef([]);
    const { confirmation } = useApp();
    const navigate = useNavigate();
    const { state } = useLocation();
    const phone = state?.phone ?? '';
    useEffect(() => {
        if (countdown <= 0)
            return;
        const t = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(t);
    }, [countdown]);
    const masked = phone.replace(/(\+\d{2})(\d{5})(\d{5})/, '$1 ••••• $3');
    const verify = async (code) => {
        if (!confirmation) {
            setError('Session expired. Go back and try again.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await confirmation.confirm(code);
            // onAuthStateChanged in App will redirect to /discover
        }
        catch {
            setError('Incorrect OTP. Please try again.');
            setDigits(Array(LEN).fill(''));
            refs.current[0]?.focus();
        }
        finally {
            setLoading(false);
        }
    };
    const onChange = (i, val) => {
        const d = val.replace(/\D/g, '').slice(-1);
        const next = [...digits];
        next[i] = d;
        setDigits(next);
        if (d && i < LEN - 1)
            refs.current[i + 1]?.focus();
        if (d && i === LEN - 1 && next.every(Boolean))
            verify(next.join(''));
    };
    const onKeyDown = (i, e) => {
        if (e.key === 'Backspace' && !digits[i] && i > 0)
            refs.current[i - 1]?.focus();
    };
    return (_jsxs(StackPage, { className: "flex flex-col bg-bg", children: [_jsx("button", { onClick: () => navigate('/phone'), className: "absolute top-12 left-4 w-10 h-10 flex items-center justify-center rounded-full bg-white border border-border shadow-sm", children: _jsx(ChevronLeft, { size: 20, className: "text-text" }) }), _jsxs("div", { className: "flex-1 flex flex-col items-center justify-center px-6 gap-6", children: [_jsx("div", { className: "text-5xl", children: "\uD83D\uDD10" }), _jsxs("div", { className: "text-center", children: [_jsx("h2", { className: "text-2xl font-bold text-text", children: "Enter OTP" }), _jsxs("p", { className: "text-muted text-sm mt-2", children: ["We sent a 6-digit code to", _jsx("br", {}), _jsx("span", { className: "font-semibold text-text", children: masked })] })] }), _jsx("div", { className: "flex gap-2.5", children: digits.map((d, i) => (_jsx("input", { ref: el => { refs.current[i] = el; }, className: `w-12 h-14 text-center text-xl font-bold rounded-ios-lg border-2 outline-none transition-all bg-white
                ${d ? 'border-primary bg-primary/5' : 'border-border'}
                focus:border-primary focus:ring-2 focus:ring-primary/20`, type: "tel", inputMode: "numeric", maxLength: 2, value: d, onChange: e => onChange(i, e.target.value), onKeyDown: e => onKeyDown(i, e), autoFocus: i === 0 }, i))) }), error && _jsx("p", { className: "text-danger text-sm text-center", children: error }), _jsx("button", { className: "ios-btn-primary w-full max-w-xs", onClick: () => verify(digits.join('')), disabled: !digits.every(Boolean) || loading, children: loading ? 'Verifying…' : 'Verify OTP' }), _jsxs("div", { className: "flex items-center gap-1 text-sm", children: [_jsx("span", { className: "text-muted", children: "Didn't receive it?" }), countdown > 0 ? (_jsxs("span", { className: "text-muted", children: ["Resend in ", countdown, "s"] })) : (_jsx("button", { className: "text-primary font-semibold", onClick: () => navigate('/phone'), children: "Resend OTP" }))] })] })] }));
}
