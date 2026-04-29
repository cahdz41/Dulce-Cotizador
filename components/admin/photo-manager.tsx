'use client'

import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Producto } from '@/lib/types'
import { CATALOG_DATA } from '@/lib/catalog-data'

type Stage = 'idle' | 'removing-bg' | 'uploading' | 'saving' | 'done' | 'error'

const STAGE_LABEL: Record<Stage, string> = {
  idle:          '',
  'removing-bg': 'Recortando fondo con IA…',
  uploading:     'Subiendo a la nube…',
  saving:        'Guardando en base de datos…',
  done:          '¡Imagen guardada!',
  error:         'Error al procesar',
}

interface Props {
  products: Producto[]
}

export default function PhotoManager({ products: initialProducts }: Props) {
  const [products,  setProducts]  = useState<Producto[]>(initialProducts)
  const [search,    setSearch]    = useState('')
  const [selected,  setSelected]  = useState<Producto | null>(null)
  const [preview,   setPreview]   = useState<string | null>(null)
  const [stage,     setStage]     = useState<Stage>('idle')
  const [errorMsg,  setErrorMsg]  = useState('')
  const [syncing,   setSyncing]   = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // true cuando ningún producto tiene UUID (vinieron del catálogo hardcodeado, no de Supabase)
  const needsSync = products.length > 0 && products.every(p => !p.id)

  async function syncCatalog() {
    setSyncing(true)
    try {
      // Leer imágenes actuales antes de borrar
      const { data: existing } = await supabase.from('products').select('codigo,imagen')
      const imagenPorCodigo: Record<string, string> = {}
      if (existing) {
        existing.forEach((p: any) => { if (p.imagen) imagenPorCodigo[p.codigo] = p.imagen })
      }

      const restored = CATALOG_DATA.map((p) => ({
        ...p,
        imagen: imagenPorCodigo[p.codigo] || p.imagen,
      }))

      await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('products').insert(restored)
      const { data } = await supabase.from('products').select('*').order('grupo')
      if (data && data.length > 0) {
        setProducts(data as Producto[])
        setSelected(null)
      }
    } finally {
      setSyncing(false)
    }
  }

  const filtered = products.filter(p => {
    const q = search.toLowerCase()
    return (
      p.descripcion.toLowerCase().includes(q) ||
      p.codigo.toLowerCase().includes(q) ||
      p.grupo.toLowerCase().includes(q) ||
      p.subclasificacion.toLowerCase().includes(q)
    )
  })

  function selectProduct(p: Producto) {
    setSelected(p)
    setPreview(p.imagen ?? null)
    setStage('idle')
    setErrorMsg('')
  }

  async function handleFile(file: File) {
    if (!selected) return
    setErrorMsg('')

    if (!selected.id) {
      setStage('error')
      setErrorMsg("Este producto no está en la base de datos. Ve al tab 'Catálogo' → 'Restaurar catálogo' o sube tu archivo .xlsx, y vuelve aquí.")
      return
    }

    try {
      setPreview(URL.createObjectURL(file))
      setStage('removing-bg')

      // Import dinámico — NUNCA en el top del archivo (rompe el build SSR)
      const { removeBackground } = await import('@imgly/background-removal')
      // @ts-ignore — onnxruntime-web no resuelve sus tipos via exports map
      const ort = await import('onnxruntime-web')
      ort.env.wasm.wasmPaths = '/ort-wasm/'

      const blob = await removeBackground(file, {
        publicPath: 'https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/',
        proxyToWorker: false,
      })

      setPreview(URL.createObjectURL(blob))
      setStage('uploading')

      // Subir a Cloudinary vía API route
      const formData = new FormData()
      formData.append('file', new File([blob], 'producto.png', { type: 'image/png' }))

      const res = await fetch('/api/cloudinary', { method: 'POST', body: formData })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al subir a Cloudinary')
      const { url } = json

      setStage('saving')

      // Guardar URL en products.imagen
      const { error } = await supabase
        .from('products')
        .update({ imagen: url })
        .eq('id', selected.id)

      if (error) throw new Error(`Error Supabase: ${error.message}`)

      // Actualizar estado local
      setProducts(prev =>
        prev.map(p => p.id === selected.id ? { ...p, imagen: url } : p)
      )
      setSelected(prev => prev ? { ...prev, imagen: url } : prev)
      setPreview(url)
      setStage('done')
      setTimeout(() => setStage('idle'), 2500)

    } catch (err: any) {
      console.error('PhotoManager error:', err)
      setStage('error')
      setErrorMsg(err?.message ?? 'Error desconocido')
    }
  }

  const busy = stage !== 'idle' && stage !== 'done' && stage !== 'error'
  const sinFoto = products.filter(p => !p.imagen).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {needsSync && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10,
          padding: '12px 16px', borderRadius: 8,
          background: '#FEF3C7', border: '1px solid #FDE68A',
        }}>
          <p style={{ fontSize: 13, color: '#92400E', margin: 0 }}>
            <strong>El catálogo no está en la base de datos.</strong> Sincronízalo para poder asignar fotos.
          </p>
          <button
            onClick={syncCatalog}
            disabled={syncing}
            style={{
              padding: '7px 14px', borderRadius: 6, fontSize: 12, fontWeight: 700,
              background: '#92400E', color: 'white', cursor: syncing ? 'wait' : 'pointer',
              opacity: syncing ? 0.7 : 1, flexShrink: 0,
            }}
          >
            {syncing ? 'Sincronizando…' : 'Sincronizar catálogo'}
          </button>
        </div>
      )}

      {!needsSync && sinFoto > 0 && (
        <p style={{ fontSize: 12, color: 'var(--ink-mute)', margin: 0 }}>
          <strong style={{ color: 'var(--ink)' }}>{sinFoto} producto{sinFoto !== 1 ? 's' : ''}</strong> sin foto.
          Selecciona uno de la lista para subir su imagen — el fondo se eliminará automáticamente con IA.
        </p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }} className="photo-manager-grid">

        {/* Panel izquierdo: lista de productos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input
            type="text"
            placeholder="Buscar por nombre, código o categoría…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '8px 12px', fontSize: 13,
              border: '1px solid var(--primary)', borderRadius: 6,
              outline: 'none', background: 'white', color: 'var(--ink)',
              boxSizing: 'border-box',
            }}
          />

          <div style={{
            border: '1px solid var(--border)', borderRadius: 8,
            maxHeight: 340, overflowY: 'auto', display: 'flex', flexDirection: 'column',
          }}>
            {filtered.length === 0 ? (
              <p style={{ padding: '16px 12px', fontSize: 13, color: 'var(--ink-mute)', margin: 0 }}>
                Sin resultados
              </p>
            ) : (
              filtered.map(p => {
                const isSelected = selected?.id === p.id
                const hasPhoto   = !!p.imagen
                return (
                  <button
                    key={p.id ?? p.codigo}
                    onClick={() => selectProduct(p)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 12px', textAlign: 'left', transition: 'background 0.1s',
                      background: isSelected ? 'var(--primary-light)' : 'transparent',
                      borderBottom: '1px solid var(--border)',
                      borderLeft: `3px solid ${isSelected ? 'var(--primary)' : 'transparent'}`,
                      width: '100%', cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 4, flexShrink: 0, overflow: 'hidden',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'var(--bg)',
                      }}>
                        {hasPhoto
                          ? <img src={p.imagen!} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                          : <span style={{ fontSize: 16 }}>📷</span>
                        }
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{
                          fontSize: 12, fontWeight: 600, color: 'var(--ink)', margin: 0,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {p.descripcion}
                        </p>
                        <p style={{ fontSize: 11, color: 'var(--ink-mute)', margin: 0 }}>
                          {p.codigo} · {p.grupo}
                        </p>
                      </div>
                    </div>
                    {!hasPhoto && (
                      <span style={{
                        flexShrink: 0, fontSize: 10, padding: '2px 6px', borderRadius: 100,
                        fontWeight: 700, marginLeft: 8, background: '#FEF3C7',
                        color: '#92400E', border: '1px solid #FDE68A',
                      }}>
                        Sin foto
                      </span>
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Panel derecho: zona de subida */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {selected ? (
            <>
              <div style={{
                padding: 12, borderRadius: 8, background: 'var(--bg)',
                border: '1px solid var(--border)',
              }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
                  {selected.descripcion}
                </p>
                <p style={{ fontSize: 11, color: 'var(--ink-mute)', margin: '2px 0 0' }}>
                  {selected.codigo} · {selected.grupo}
                </p>
              </div>

              <div
                style={{
                  border: `2px dashed ${busy ? 'var(--primary)' : 'var(--border)'}`,
                  borderRadius: 8, background: 'var(--bg)',
                  minHeight: 180, padding: 16,
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', gap: 8,
                  cursor: busy ? 'default' : 'pointer',
                  pointerEvents: !selected.id ? 'none' : 'auto',
                  opacity: !selected.id ? 0.4 : busy ? 0.85 : 1,
                  transition: 'border-color 0.15s',
                }}
                onClick={() => !busy && inputRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  e.preventDefault()
                  const file = e.dataTransfer.files[0]
                  if (file && !busy) handleFile(file)
                }}
              >
                {preview ? (
                  <img
                    src={preview}
                    alt="preview"
                    style={{ maxHeight: 140, objectFit: 'contain', borderRadius: 4, opacity: busy ? 0.5 : 1 }}
                  />
                ) : (
                  <span style={{ fontSize: 40, opacity: 0.3 }}>🖼️</span>
                )}

                {busy ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 14, height: 14, borderRadius: '50%',
                      border: '2px solid var(--primary)', borderTopColor: 'transparent',
                      animation: 'pm-spin 0.8s linear infinite',
                    }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)' }}>
                      {STAGE_LABEL[stage]}
                    </span>
                  </div>
                ) : stage === 'done' ? (
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--success)' }}>
                    ✓ {STAGE_LABEL.done}
                  </span>
                ) : stage === 'error' ? (
                  <span style={{ fontSize: 12, color: 'var(--danger)', textAlign: 'center' }}>
                    {errorMsg || STAGE_LABEL.error}
                  </span>
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
                      Click para elegir imagen
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--ink-mute)', margin: '4px 0 0' }}>
                      o arrastra y suelta · El fondo se elimina automáticamente
                    </p>
                  </div>
                )}
              </div>

              {!busy && !!selected.id && (
                <button
                  onClick={() => inputRef.current?.click()}
                  style={{
                    padding: '10px 0', borderRadius: 6, fontSize: 13, fontWeight: 700,
                    background: 'var(--primary)', color: 'white', width: '100%',
                    cursor: 'pointer',
                  }}
                >
                  {selected.imagen ? 'Cambiar foto' : 'Subir foto'}
                </button>
              )}
            </>
          ) : (
            <div style={{
              border: '2px dashed var(--border)', borderRadius: 8, background: 'var(--bg)',
              minHeight: 260, display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 8,
            }}>
              <span style={{ fontSize: 36, opacity: 0.3 }}>👈</span>
              <p style={{ fontSize: 12, color: 'var(--ink-mute)', margin: 0 }}>
                Selecciona un producto de la lista
              </p>
            </div>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={e => {
          const file = e.target.files?.[0]
          if (file) { handleFile(file); e.target.value = '' }
        }}
      />

      <style>{`
        @keyframes pm-spin { to { transform: rotate(360deg); } }
        @media (max-width: 700px) { .photo-manager-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  )
}
