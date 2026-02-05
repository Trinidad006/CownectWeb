'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { getFirebaseAuth, getFirebaseDb, getLanguageCodeByCountry } from '@/infrastructure/config/firebase'
import { PAISES_MONEDAS, getMonedaByPais } from '@/utils/paisesMonedas'
import Input from '../ui/Input'
import Select from '../ui/Select'

const USUARIOS_COLLECTION = 'usuarios'

export default function RegisterForm() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    rancho: '',
    rancho_hectareas: '',
    rancho_pais: '',
    rancho_ciudad: '',
    rancho_direccion: '',
    rancho_descripcion: '',
    password: '',
    confirmPassword: ''
  })
  const [moneda, setMoneda] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (formData.rancho_pais) {
      const info = getMonedaByPais(formData.rancho_pais)
      setMoneda(info?.moneda || '')
    } else {
      setMoneda('')
    }
  }, [formData.rancho_pais])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    setLoading(true)

    try {
      // Determinar idioma según el país seleccionado
      const languageCode = formData.rancho_pais 
        ? getLanguageCodeByCountry(formData.rancho_pais)
        : 'es' // Por defecto español si no hay país
      
      const auth = getFirebaseAuth(languageCode)
      const db = getFirebaseDb()

      const { user: firebaseUser } = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      )

      await setDoc(doc(db, USUARIOS_COLLECTION, firebaseUser.uid), {
        email: formData.email,
        nombre: formData.nombre,
        apellido: formData.apellido,
        telefono: formData.telefono,
        rancho: formData.rancho || null,
        rancho_hectareas: formData.rancho_hectareas ? parseFloat(formData.rancho_hectareas) : null,
        rancho_pais: formData.rancho_pais || null,
        rancho_ciudad: formData.rancho_ciudad || null,
        rancho_direccion: formData.rancho_direccion || null,
        rancho_descripcion: formData.rancho_descripcion || null,
        moneda: moneda || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      // Asegurar que el idioma esté configurado antes de enviar el correo
      auth.languageCode = languageCode
      await sendEmailVerification(firebaseUser, {
        url: `${window.location.origin}/login?registered=verify`,
        handleCodeInApp: false,
      })

      router.push('/login?registered=verify')
    } catch (err: any) {
      const message =
        err?.code === 'auth/email-already-in-use'
          ? 'El correo ya está registrado'
          : err?.message || 'Error al registrar usuario'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Nombre"
          name="nombre"
          type="text"
          value={formData.nombre}
          onChange={handleChange}
          required
        />
        <Input
          label="Apellido"
          name="apellido"
          type="text"
          value={formData.apellido}
          onChange={handleChange}
          required
        />
      </div>

      <Input
        label="Correo Electrónico"
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        required
      />

      <Input
        label="Teléfono"
        name="telefono"
        type="tel"
        value={formData.telefono}
        onChange={handleChange}
        required
      />

      <div className="border-t border-gray-200 pt-4 mt-4">
        <h4 className="text-lg font-bold text-black mb-3">Datos del Rancho</h4>
        <div className="space-y-4">
          <Input
            label="Nombre del Rancho"
            name="rancho"
            type="text"
            value={formData.rancho}
            onChange={handleChange}
            placeholder="Ej: Rancho La Esperanza"
          />
          <Select
            label="País de residencia"
            name="rancho_pais"
            value={formData.rancho_pais}
            onChange={handleSelectChange}
            options={PAISES_MONEDAS.map((p) => ({ value: p.codigo, label: `${p.nombre} (${p.moneda})` }))}
            placeholder="Seleccione su país"
          />
          {moneda && (
            <p className="text-sm text-gray-600">Moneda seleccionada: <strong>{moneda}</strong></p>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Ciudad o Región"
              name="rancho_ciudad"
              type="text"
              value={formData.rancho_ciudad}
              onChange={handleChange}
              placeholder="Ej: Villavicencio"
            />
            <Input
              label="Hectáreas"
              name="rancho_hectareas"
              type="number"
              value={formData.rancho_hectareas}
              onChange={handleChange}
              placeholder="Ej: 150"
            />
          </div>
          <Input
            label="Dirección (opcional)"
            name="rancho_direccion"
            type="text"
            value={formData.rancho_direccion}
            onChange={handleChange}
            placeholder="Vereda, km, etc."
          />
          <div>
            <label className="block text-base font-bold text-black mb-2">Descripción del rancho (opcional)</label>
            <textarea
              name="rancho_descripcion"
              value={formData.rancho_descripcion}
              onChange={(e) => setFormData({ ...formData, rancho_descripcion: e.target.value })}
              placeholder="Tipo de ganadería, actividades..."
              rows={3}
              className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-cownect-green"
            />
          </div>
        </div>
      </div>

      <Input
        label="Contraseña"
        name="password"
        type="password"
        value={formData.password}
        onChange={handleChange}
        required
      />

      <Input
        label="Confirmar Contraseña"
        name="confirmPassword"
        type="password"
        value={formData.confirmPassword}
        onChange={handleChange}
        required
      />

      {error && (
        <div className="bg-red-100 border-2 border-red-400 text-red-700 px-4 py-3 rounded-lg text-base font-semibold">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-black text-white py-4 rounded-lg font-bold text-lg hover:bg-gray-800 transition-all duration-200 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Registrando...' : 'Registrarse'}
      </button>
    </form>
  )
}
