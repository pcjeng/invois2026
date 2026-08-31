// Cloudinary upload tanpa server (unsigned upload preset).
// Konfigur melalui .env:
//   VITE_CLOUDINARY_CLOUD_NAME=nama-awan-anda
//   VITE_CLOUDINARY_UPLOAD_PRESET=nama-preset-unsigned
// Cara buat: cloudinary.com → Settings → Upload → Add upload preset → Signing Mode: Unsigned
const CLOUD = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

export const isConfigured = Boolean(CLOUD && PRESET)

async function upload(file, resourceType) {
  if (!isConfigured) {
    throw new Error('Cloudinary belum dikonfigur (VITE_CLOUDINARY_CLOUD_NAME / VITE_CLOUDINARY_UPLOAD_PRESET)')
  }
  const form = new FormData()
  form.append('file', file)
  form.append('upload_preset', PRESET)
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/${resourceType}/upload`, {
    method: 'POST',
    body: form,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Cloudinary ${res.status}: ${text.slice(0, 200)}`)
  }
  return res.json()
}

export function uploadImage(file) {
  return upload(file, 'image')
}

export function uploadPdf(blob, filename) {
  const f = new File([blob], filename || 'dokumen.pdf', { type: 'application/pdf' })
  return upload(f, 'raw')
}
