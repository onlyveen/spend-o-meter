import { supabase } from './supabase'
import { todayISO } from './format'

// Photos and voice notes are only held in memory and sent straight to the
// `parse-expense` Edge Function. Nothing is uploaded to Storage, so there's
// nothing to clean up once the expense is approved or discarded.

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1])
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

// Phone photos are 3-10 MB; ~1280px JPEG is plenty for reading a receipt
// and keeps the request around 150-300 KB.
export async function compressImage(file, maxSide = 1280) {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close?.()
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.8))
  return { mimeType: 'image/jpeg', data: await blobToBase64(blob) }
}

// Browsers record in different formats (webm on Chrome, mp4 on Safari), so
// decode whatever we get and re-encode as 16 kHz mono WAV, which Gemini
// always accepts.
async function toWav(blob) {
  const AudioCtx = window.AudioContext || window.webkitAudioContext
  const ctx = new AudioCtx()
  const decoded = await ctx.decodeAudioData(await blob.arrayBuffer())
  ctx.close()

  const sampleRate = 16000
  const offline = new OfflineAudioContext(1, Math.ceil(decoded.duration * sampleRate), sampleRate)
  const src = offline.createBufferSource()
  src.buffer = decoded
  src.connect(offline.destination)
  src.start()
  const samples = (await offline.startRendering()).getChannelData(0)

  const buffer = new ArrayBuffer(44 + samples.length * 2)
  const view = new DataView(buffer)
  const writeStr = (offset, s) => [...s].forEach((c, i) => view.setUint8(offset + i, c.charCodeAt(0)))
  writeStr(0, 'RIFF')
  view.setUint32(4, 36 + samples.length * 2, true)
  writeStr(8, 'WAVE')
  writeStr(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true) // PCM
  view.setUint16(22, 1, true) // mono
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeStr(36, 'data')
  view.setUint32(40, samples.length * 2, true)
  samples.forEach((s, i) => {
    const v = Math.max(-1, Math.min(1, s))
    view.setInt16(44 + i * 2, v < 0 ? v * 0x8000 : v * 0x7fff, true)
  })
  return new Blob([buffer], { type: 'audio/wav' })
}

// Starts recording immediately; call the returned stop() to finish and get
// the audio payload, or cancel() to throw it away.
export async function startRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  const recorder = new MediaRecorder(stream)
  const chunks = []
  recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data)
  const stopped = new Promise((resolve) => (recorder.onstop = resolve))
  recorder.start()

  const release = () => stream.getTracks().forEach((t) => t.stop())

  return {
    async stop() {
      recorder.stop()
      await stopped
      release()
      const wav = await toWav(new Blob(chunks, { type: recorder.mimeType }))
      return { mimeType: 'audio/wav', data: await blobToBase64(wav) }
    },
    cancel() {
      if (recorder.state !== 'inactive') recorder.stop()
      release()
    },
  }
}

// `media` is { image } or { audio }, each { mimeType, data }.
export async function parseExpense(media, categories) {
  const { data, error } = await supabase.functions.invoke('parse-expense', {
    body: { ...media, categories: categories.map((c) => c.name), today: todayISO() },
  })
  if (error) {
    const detail = await error.context?.json?.().catch(() => null)
    throw new Error(detail?.error ?? detail?.message ?? error.message ?? "Couldn't read that, try again")
  }
  return data
}
