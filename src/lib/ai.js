// ─── Aggression sub-behaviours ───────────────────────────────────────────────
export const AGGRESSION_BEHAVIOURS = [
    { id: 'bike_chase', emoji: '🏍️', label: 'Chasing bikes / vehicles' },
    { id: 'ped_chase', emoji: '🚶', label: 'Chasing pedestrians' },
    { id: 'child_chase', emoji: '👧', label: 'Chasing children' },
    { id: 'territory', emoji: '🏠', label: 'Territorial guarding' },
    { id: 'food_aggr', emoji: '🍖', label: 'Food aggression' },
    { id: 'dog_fight', emoji: '🐕', label: 'Fighting other dogs' },
    { id: 'lunge', emoji: '⚡', label: 'Unprovoked lunging' },
    { id: 'bark_snap', emoji: '😤', label: 'Barking & snapping' },
    { id: 'corner', emoji: '🔒', label: 'Cornering / trapping' },
    { id: 'night', emoji: '🌙', label: 'Aggressive at night' },
];
// ─── Extract a frame from a video file as base64 JPEG ────────────────────────
export async function extractVideoFrame(file) {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        video.muted = true;
        video.playsInline = true;
        video.src = URL.createObjectURL(file);
        video.onloadedmetadata = () => {
            // Seek to 15% into the video for a meaningful frame
            video.currentTime = Math.min(video.duration * 0.15, 3);
        };
        video.onseeked = () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d').drawImage(video, 0, 0);
            URL.revokeObjectURL(video.src);
            const base64 = canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
            resolve(base64);
        };
        video.onerror = reject;
        video.load();
    });
}
// ─── Convert image File to base64 ────────────────────────────────────────────
export async function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
// ─── Claude vision call ───────────────────────────────────────────────────────
const OBS_CONTEXT = {
    health: 'health observation',
    aggression: 'aggression/behaviour incident',
    bite: 'bite incident',
    injury: 'injury or wound',
    feeding: 'feeding observation',
};
export async function analyzeMedia(base64, obsType, dogName) {
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === 'your_anthropic_api_key_here') {
        return '⚠️ Add your Anthropic API key to .env (VITE_ANTHROPIC_API_KEY) to enable AI insights.';
    }
    const prompt = `This is a ${OBS_CONTEXT[obsType]} photo/frame for a street dog named "${dogName}".

Analyze the image in the context of street dog welfare. Respond in exactly this format (keep it brief and actionable):

**What I see:** [1–2 sentences describing what's visible]
**Severity:** [Low / Medium / High]
**Recommended action:** [1–2 concrete steps a community member can take]`;
    const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
            'anthropic-dangerous-direct-browser': 'true',
        },
        body: JSON.stringify({
            model: 'claude-opus-4-6',
            max_tokens: 300,
            messages: [{
                    role: 'user',
                    content: [
                        {
                            type: 'image',
                            source: { type: 'base64', media_type: 'image/jpeg', data: base64 },
                        },
                        { type: 'text', text: prompt },
                    ],
                }],
        }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message ?? `API error ${res.status}`);
    }
    const data = await res.json();
    return data.content[0].text;
}
