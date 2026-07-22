'use client'
import { useState, useRef } from 'react'

export default function VoicePlayer({ voiceNote }) {
  const [playing, setPlaying]   = useState(false)
  const [progress, setProgress] = useState(0)
  const audioRef  = useRef(null)
  const intervalRef = useRef(null)

  if (!voiceNote?.data) return null

  const fmt = (s) =>
    `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`

  const b64ToBlob = (b64, mime) => {
    const bytes = atob(b64)
    const arr   = new Uint8Array(bytes.length)
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
    return new Blob([arr], { type: mime })
  }

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    clearInterval(intervalRef.current)
    setPlaying(false)
    setProgress(0)
  }

  const toggle = () => {
    if (playing) { stop(); return }

    try {
      const blob = b64ToBlob(
        voiceNote.data,
        voiceNote.mimeType || 'audio/webm'
      )
      const url = URL.createObjectURL(blob)
      const a   = new Audio(url)
      audioRef.current = a

      a.play().catch(e => {
        console.error('Audio play failed:', e)
        stop()
      })
      setPlaying(true)

      // Progress tracking
      intervalRef.current = setInterval(() => {
        if (a.duration && !isNaN(a.duration)) {
          setProgress((a.currentTime / a.duration) * 100)
        }
      }, 200)

      a.onended = () => {
        URL.revokeObjectURL(url)
        clearInterval(intervalRef.current)
        setPlaying(false)
        setProgress(0)
        audioRef.current = null
      }
    } catch (e) {
      console.error('VoicePlayer error:', e)
      stop()
    }
  }

  const duration = voiceNote.duration || 0

  return (
    <div style={{
      display:        'flex',
      alignItems:     'center',
      gap:            10,
      padding:        '10px 14px',
      background:     playing
        ? 'linear-gradient(135deg,rgba(79,70,229,0.1),rgba(99,102,241,0.08))'
        : 'rgba(79,70,229,0.05)',
      border:         `1.5px solid ${playing
        ? 'rgba(79,70,229,0.3)'
        : 'rgba(79,70,229,0.15)'}`,
      borderRadius:   12,
      transition:     'all 0.2s',
    }}>
      {/* Play/stop button */}
      <button
        onClick={toggle}
        style={{
          width:           36,
          height:          36,
          borderRadius:    '50%',
          background:      playing
            ? 'linear-gradient(135deg,#F59E0B,#D97706)'
            : 'linear-gradient(135deg,#4F46E5,#6366F1)',
          border:          'none',
          cursor:          'pointer',
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'center',
          flexShrink:      0,
          boxShadow:       '0 2px 8px rgba(79,70,229,0.25)',
          fontSize:        '0.85rem',
        }}>
        {playing ? '⏹' : '▶'}
      </button>

      {/* Waveform + progress */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center',
          gap:6, marginBottom:4 }}>
          <span style={{ fontSize:'0.72rem', color:'#4F46E5',
            fontWeight:700 }}>
            🎙 Voice Note
          </span>
          {duration > 0 && (
            <span style={{ fontSize:'0.68rem', color:'#9CA3AF',
              marginLeft:'auto' }}>
              {fmt(duration)}
            </span>
          )}
        </div>
        {/* Progress bar */}
        <div style={{ height:4, background:'rgba(79,70,229,0.1)',
          borderRadius:999, overflow:'hidden' }}>
          <div style={{
            height:     '100%',
            width:      `${progress}%`,
            background: 'linear-gradient(90deg,#4F46E5,#00D4FF)',
            borderRadius: 999,
            transition: 'width 0.2s linear',
          }}/>
        </div>
      </div>
    </div>
  )
}