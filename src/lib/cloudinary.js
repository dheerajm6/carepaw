const CLOUD = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
export async function uploadToCloudinary(file) {
    const isVideo = file.type.startsWith('video/');
    const resource = isVideo ? 'video' : 'image';
    const form = new FormData();
    form.append('file', file);
    form.append('upload_preset', PRESET);
    form.append('folder', 'carepaw');
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/${resource}/upload`, { method: 'POST', body: form });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message ?? `Upload failed (${res.status})`);
    }
    const data = await res.json();
    return data.secure_url;
}
