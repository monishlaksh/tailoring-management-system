'use client'
import { useState, useEffect } from 'react'

export default function NumInput({
  value,
  onChange,
  placeholder = '0',
  min = 0,
  style = {},
  prefix = null,
}) {
  const [display, setDisplay] = useState(value === 0 ? '' : String(value))

  useEffect(() => {
    // Sync if parent value changes externally
    setDisplay(value === 0 ? '' : String(value))
  }, [value])

  const handleChange = (e) => {
    const raw = e.target.value
    setDisplay(raw)
    const num = parseFloat(raw)
    if (!isNaN(num) && num >= min) {
      onChange(num)
    } else if (raw === '' || raw === '-') {
      onChange(0)
    }
  }

  const handleFocus = (e) => {
    e.target.select()
  }

  const handleBlur = () => {
    // On blur, if empty show 0 in display but keep value as 0
    if (display === '' || display === '-') {
      setDisplay('')
    }
  }

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {prefix && (
        <span style={{
          position: 'absolute', left: 12,
          top: '50%', transform: 'translateY(-50%)',
          color: '#9CA3AF', fontSize: '0.9rem',
          pointerEvents: 'none',
        }}>
          {prefix}
        </span>
      )}
      <input
        type="number"
        value={display}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        min={min}
        style={{
          width: '100%',
          padding: prefix ? '13px 14px 13px 28px' : '13px 16px',
          background: 'rgba(255,255,255,0.8)',
          border: '1.5px solid rgba(79,70,229,0.2)',
          borderRadius: 10,
          fontFamily: 'Poppins,sans-serif',
          fontSize: '0.9rem',
          color: '#1E1B4B',
          outline: 'none',
          transition: 'all 0.3s ease',
          MozAppearance: 'textfield',
          ...style,
        }}
        onMouseEnter={e => {}}
        onMouseLeave={e => {}}
      />
      <style>{`
        input[type='number']::-webkit-inner-spin-button,
        input[type='number']::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
      `}</style>
    </div>
  )
}