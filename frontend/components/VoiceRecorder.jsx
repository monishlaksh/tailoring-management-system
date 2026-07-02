'use client'
import { useState, useRef, useEffect } from 'react'
import { Mic, Square, Play, Pause, Trash2, MicOff } from 'lucide-react'

export default function VoiceRecorder({ value, onChange }) {
  const [recording, setRecording]     = useState(false)
  const [playing, setPlaying]         = useState(false)
  const [duration, setDuration]       = useState(0)
  const [elapsed, setElapsed]         = useState(0)
  const [supported, setSupported]     = useState(true)
  const [permissionDenied, setPermissionDenied] = useState(false)

  const mediaRecorder   = useRef(null)
  const audioChunks     = useRef([])
  const timerRef        = useRef(null)
  const audioRef        = useRef(null)
  const startTimeRef    = useRef(null)

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) setSupported(false)
    return () => {
      clearInterval(timerRef.current)
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  // If value exists, load duration from it
  useEffect(() => {
    if (value?.data && value?.duration) {
      setDuration(value.duration)
    }
  }, [value?.data])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio:true })
      audioChunks.current = []

      const recorder = new MediaRecorder(stream)
      mediaRecorder.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.current.push(e.data)
      }

      recorder.onstop = async () => {
        const blob = new Blob(audioChunks.current, { type:'audio/webm' })
        const dur  = Math.round((Date.now() - startTimeRef.current) / 1000)

        // Convert to base64
        const reader = new FileReader()
        reader.onload = () => {
          const base64 = reader.result.split(',')[1]
          onChange({ data:base64, mimeType:'audio/webm', duration:dur })
          setDuration(dur)
        }
        reader.readAsDataURL(blob)

        // Stop microphone
        stream.getTracks().forEach(t => t.stop())
      }

      recorder.start()
      startTimeRef.current = Date.now()
      setRecording(true)
      setElapsed(0)

      timerRef.current = setInterval(() => {
        setElapsed(Math.round((Date.now() - startTimeRef.current) / 1000))
      }, 1000)
    } catch (e) {
      if (e.name === 'NotAllowedError') setPermissionDenied(true)
      else console.error(e)
    }
  }

  const stopRecording = () => {
    clearInterval(timerRef.current)
    mediaRecorder.current?.stop()
    setRecording(false)
  }

  const playAudio = () => {
    if (!value?.data) return
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
      setPlaying(false)
      return
    }
    const blob  = base64ToBlob(value.data, value.mimeType || 'audio/webm')
    const url   = URL.createObjectURL(blob)
    const audio = new Audio(url)
    audioRef.current = audio
    audio.play()
    setPlaying(true)
    audio.onended = () => { setPlaying(false); audioRef.current = null; URL.revokeObjectURL(url) }
  }

  const deleteRecording = () => {
    clearInterval(timerRef.current)
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
    onChange({ data:'', mimeType:'audio/webm', duration:0 })
    setDuration(0); setElapsed(0); setPlaying(false); setRecording(false)
  }

  const base64ToBlob = (b64, mime) => {
    const byteCharacters = atob(b64)
    const byteNumbers    = new Array(byteCharacters.length).fill(0).map((_,i) => byteCharacters.charCodeAt(i))
    return new Blob([new Uint8Array(byteNumbers)], { type:mime })
  }

  const formatTime = (s) => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`

  if (!supported) return (
    <div style={{ padding:'10px 14px', background:'rgba(239,68,68,0.06)', borderRadius:10, border:'1px solid rgba(239,68,68,0.2)' }}>
      <p style={{ fontSize:'0.82rem', color:'#DC2626' }}>🎙️ Voice recording not supported in this browser.</p>
    </div>
  )

  if (permissionDenied) return (
    <div style={{ padding:'10px 14px', background:'rgba(239,68,68,0.06)', borderRadius:10, border:'1px solid rgba(239,68,68,0.2)' }}>
      <p style={{ fontSize:'0.82rem', color:'#DC2626' }}>🎙️ Microphone access denied. Allow microphone in browser settings.</p>
    </div>
  )

  return (
    <div style={{ border:'1.5px solid rgba(79,70,229,0.2)', borderRadius:12, padding:'14px 16px', background:'rgba(79,70,229,0.02)' }}>
      <p style={{ fontSize:'0.72rem', color:'#4F46E5', fontWeight:700, marginBottom:10 }}>
        🎙️ VOICE NOTE
      </p>

      {!value?.data ? (
        // No recording yet
        <div>
          {!recording ? (
            <button type="button" onClick={startRecording}
              style={{ display:'flex', alignItems:'center', gap:8, padding:'11px 20px',
                background:'linear-gradient(135deg,#4F46E5,#6366F1)',
                color:'white', border:'none', borderRadius:10,
                fontFamily:'Poppins,sans-serif', fontWeight:600,
                fontSize:'0.85rem', cursor:'pointer' }}>
              <Mic size={16}/> Start Recording
            </button>
          ) : (
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:10, height:10, borderRadius:'50%', background:'#EF4444', animation:'pulse 1s infinite' }}/>
              <span style={{ fontSize:'0.85rem', color:'#EF4444', fontWeight:600 }}>
                Recording... {formatTime(elapsed)}
              </span>
              <button type="button" onClick={stopRecording}
                style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px',
                  background:'rgba(239,68,68,0.1)', border:'1.5px solid rgba(239,68,68,0.3)',
                  borderRadius:8, color:'#DC2626', cursor:'pointer',
                  fontFamily:'Poppins,sans-serif', fontWeight:600, fontSize:'0.82rem' }}>
                <Square size={14}/> Stop
              </button>
            </div>
          )}
          <p style={{ fontSize:'0.72rem', color:'#9CA3AF', marginTop:8 }}>
            Record a voice note for employees (instructions, fitting notes, etc.)
          </p>
        </div>
      ) : (
        // Has recording
        <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, flex:1,
            padding:'10px 14px', background:'rgba(79,70,229,0.06)',
            borderRadius:10, border:'1px solid rgba(79,70,229,0.15)' }}>
            <Mic size={15} color="#4F46E5"/>
            <span style={{ fontSize:'0.85rem', color:'#4F46E5', fontWeight:600 }}>
              Voice note — {formatTime(duration)}
            </span>
          </div>
          <button type="button" onClick={playAudio}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 16px',
              background: playing ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
              border: `1.5px solid ${playing ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.3)'}`,
              borderRadius:8, color: playing ? '#D97706' : '#059669',
              cursor:'pointer', fontFamily:'Poppins,sans-serif',
              fontWeight:600, fontSize:'0.82rem' }}>
            {playing ? <><Pause size={14}/> Stop</> : <><Play size={14}/> Play</>}
          </button>
          <button type="button" onClick={deleteRecording}
            style={{ padding:'9px 12px', background:'rgba(239,68,68,0.08)',
              border:'1.5px solid rgba(239,68,68,0.2)', borderRadius:8,
              color:'#DC2626', cursor:'pointer', display:'flex', alignItems:'center' }}>
            <Trash2 size={14}/>
          </button>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:0.4; transform:scale(1.2); }
        }
      `}</style>
    </div>
  )
}