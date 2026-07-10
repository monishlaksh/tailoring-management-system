'use client'
import { useState, useRef } from 'react'
import { Upload, X, Loader } from 'lucide-react'

const CLOUD_NAME    = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

export default function ImageUpload({
  value,
  onChange,
  folder = 'tailoring',
  label  = 'Upload Image',
  size   = 'normal',
}) {
  const [uploading, setUploading] = useState(false)
  const [error, setError]         = useState('')
  const fileRef = useRef(null)

  const upload = async (file) => {
    if (!file) return

    // Check env vars first
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      setError('Cloudinary not configured. Add NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET to Vercel environment variables.')
      return
    }

    if (!file.type.startsWith('image/')) {
      setError('Only image files allowed'); return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB'); return
    }

    setUploading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file',          file)
      formData.append('upload_preset', UPLOAD_PRESET)
      formData.append('folder',        folder)

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method:'POST', body:formData }
      )

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData?.error?.message || `HTTP ${res.status}`)
      }

      const data = await res.json()

      if (data.secure_url) {
        onChange(data.secure_url)
        setError('')
      } else {
        throw new Error('No URL returned from Cloudinary')
      }
    } catch (e) {
      console.error('[Cloudinary]', e)
      setError(`Upload failed: ${e.message}`)
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) upload(file)
  }

  const isSmall = size === 'small'

  return (
    <div style={{ width:'100%' }}>
      {value ? (
        <div style={{ position:'relative', display:'inline-block' }}>
          <img
            src={value}
            alt="uploaded"
            style={{
              width:       isSmall ? 80  : 160,
              height:      isSmall ? 80  : 160,
              objectFit:   'cover',
              borderRadius:isSmall ? 8   : 12,
              border:      '2px solid rgba(79,70,229,0.2)',
              display:     'block',
            }}
          />
          <button
            type="button"
            onClick={() => { onChange(''); setError('') }}
            style={{
              position:        'absolute',
              top:-8, right:-8,
              width:22, height:22,
              borderRadius:    '50%',
              background:      '#EF4444',
              border:          'none',
              cursor:          'pointer',
              display:         'flex',
              alignItems:      'center',
              justifyContent:  'center',
              boxShadow:       '0 2px 6px rgba(0,0,0,0.25)',
            }}>
            <X size={12} color="white"/>
          </button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => !uploading && fileRef.current?.click()}
          style={{
            width:           '100%',
            height:          isSmall ? 80 : 130,
            border:          `2px dashed ${error ? '#EF4444' : 'rgba(79,70,229,0.3)'}`,
            borderRadius:    isSmall ? 8 : 12,
            display:         'flex',
            flexDirection:   'column',
            alignItems:      'center',
            justifyContent:  'center',
            gap:             6,
            cursor:          uploading ? 'not-allowed' : 'pointer',
            background:      uploading
              ? 'rgba(79,70,229,0.03)'
              : 'rgba(255,255,255,0.7)',
            transition:      'all 0.2s',
          }}
          onMouseEnter={e => {
            if (!uploading) e.currentTarget.style.background = 'rgba(79,70,229,0.06)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = uploading
              ? 'rgba(79,70,229,0.03)'
              : 'rgba(255,255,255,0.7)'
          }}>
          {uploading ? (
            <>
              <Loader
                size={isSmall ? 16 : 22}
                color="#4F46E5"
                style={{ animation:'spin 1s linear infinite' }}
              />
              <span style={{ fontSize:'0.72rem', color:'#4F46E5', fontWeight:500 }}>
                Uploading...
              </span>
            </>
          ) : (
            <>
              <Upload size={isSmall ? 16 : 20} color="#9CA3AF"/>
              <span style={{
                fontSize:  isSmall ? '0.68rem' : '0.75rem',
                color:     '#9CA3AF',
                textAlign: 'center',
                padding:   '0 8px',
              }}>
                {isSmall ? 'Upload' : label}
              </span>
              {!isSmall && (
                <span style={{ fontSize:'0.65rem', color:'#C4C9D4' }}>
                  Click or drag & drop · max 5MB
                </span>
              )}
            </>
          )}
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display:'none' }}
        onChange={e => {
          upload(e.target.files[0])
          e.target.value = '' // reset so same file can be re-uploaded
        }}
      />

      {error && (
        <p style={{
          fontSize:   '0.72rem',
          color:      '#DC2626',
          marginTop:  4,
          lineHeight: 1.4,
        }}>
          ⚠️ {error}
        </p>
      )}

      <style>{`@keyframes spin { to { transform:rotate(360deg) } }`}</style>
    </div>
  )
}