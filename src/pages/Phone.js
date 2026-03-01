import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TabPage } from '../components/PageTransition';
import { signInWithPhoneNumber, RecaptchaVerifier } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useApp } from '../lib/store';
export default function Phone() {
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { setConfirmation } = useApp();
    const navigate = useNavigate();
    const valid = phone.replace(/\D/g, '').length === 10;
    const getVerifier = () => {
        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-anchor', { size: 'invisible' });
        }
        return window.recaptchaVerifier;
    };
    const handleSend = async () => {
        if (!valid)
            return;
        setLoading(true);
        setError('');
        try {
            const fullNumber = `+91${phone.replace(/\D/g, '')}`;
            const result = await signInWithPhoneNumber(auth, fullNumber, getVerifier());
            setConfirmation(result);
            navigate('/otp', { state: { phone: fullNumber } });
        }
        catch (e) {
            window.recaptchaVerifier?.clear();
            window.recaptchaVerifier = undefined;
            setError(e?.message ?? 'Failed to send OTP. Try again.');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs(TabPage, { className: "flex flex-col bg-bg", children: [_jsxs("div", { className: "bg-primary px-6 pt-16 pb-10 flex flex-col items-center gap-3", children: [_jsx("div", { className: "w-16 h-16 bg-accent rounded-2xl flex items-center justify-center", children: _jsx("span", { className: "text-3xl", children: "\uD83D\uDC3E" }) }), _jsx("h1", { className: "text-2xl font-bold text-white tracking-tight", children: "CarePaw" }), _jsx("p", { className: "text-white/60 text-sm", children: "Community Care for Street Dogs" })] }), _jsxs("div", { className: "flex-1 px-6 pt-8 flex flex-col gap-5", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-xl font-bold text-text", children: "Welcome back" }), _jsx("p", { className: "text-muted text-sm mt-1", children: "Enter your mobile number to continue" })] }), _jsxs("div", { className: "flex gap-2", children: [_jsxs("div", { className: "flex items-center gap-2 px-4 py-3.5 rounded-ios-lg border border-border bg-white", children: [_jsx("span", { className: "text-lg", children: "\uD83C\uDDEE\uD83C\uDDF3" }), _jsx("span", { className: "font-semibold text-text", children: "+91" })] }), _jsx("input", { className: "ios-input flex-1", type: "tel", inputMode: "numeric", placeholder: "98765 43210", maxLength: 10, value: phone, onChange: e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)), onKeyDown: e => e.key === 'Enter' && handleSend(), autoFocus: true })] }), error && _jsx("p", { className: "text-danger text-sm", children: error }), _jsx("button", { className: "ios-btn-primary mt-2", onClick: handleSend, disabled: !valid || loading, children: loading ? 'Sending OTP…' : 'Send OTP' }), _jsxs("p", { className: "text-center text-xs text-muted mt-2", children: ["By continuing, you agree to our", ' ', _jsx("span", { className: "text-primary font-medium", children: "Terms of Service" }), " and", ' ', _jsx("span", { className: "text-primary font-medium", children: "Privacy Policy" }), "."] })] }), _jsx("div", { id: "recaptcha-anchor" })] }));
}
