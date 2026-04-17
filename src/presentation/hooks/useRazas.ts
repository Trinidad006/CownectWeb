'use client'

import { useEffect, useState } from 'react'
import { Raza } from '@/domain/entities/Raza'
import { razaRepository } from '@/infrastructure/repositories/RazaRepository'

export const useRazas = () => {
  const [razas, setRazas] = useState<Raza[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadRazas = async () => {
      try {
        setLoading(true)
        const data = await razaRepository.getAllRazas()
        setRazas(data)
        setError(null)
      } catch (err) {
        console.error('Error al cargar razas:', err)
        setError('No se pudieron cargar las razas')
      } finally {
        setLoading(false)
      }
    }

    loadRazas()
  }, [])

  return { razas, loading, error }
}

export const useRazasByAptitud = (aptitud: 'Lechera' | 'Cárnica' | 'Doble Propósito') => {
  const [razas, setRazas] = useState<Raza[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadRazas = async () => {
      try {
        setLoading(true)
        const data = await razaRepository.getRazasByAptitud(aptitud)
        setRazas(data)
        setError(null)
      } catch (err) {
        console.error('Error al cargar razas por aptitud:', err)
        setError('No se pudieron cargar las razas')
      } finally {
        setLoading(false)
      }
    }

    loadRazas()
  }, [aptitud])

  return { razas, loading, error }
}

export const useRazasByEspecie = (especie: 'Bos taurus' | 'Bos indicus' | 'Sintética (F1)') => {
  const [razas, setRazas] = useState<Raza[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadRazas = async () => {
      try {
        setLoading(true)
        const data = await razaRepository.getRazasByEspecie(especie)
        setRazas(data)
        setError(null)
      } catch (err) {
        console.error('Error al cargar razas por especie:', err)
        setError('No se pudieron cargar las razas')
      } finally {
        setLoading(false)
      }
    }

    loadRazas()
  }, [especie])

  return { razas, loading, error }
}

export const useRazasByClima = (clima: 'Templado' | 'Tropical' | 'Tropical/Adaptado' | 'Variado') => {
  const [razas, setRazas] = useState<Raza[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadRazas = async () => {
      try {
        setLoading(true)
        const data = await razaRepository.getRazasByClima(clima)
        setRazas(data)
        setError(null)
      } catch (err) {
        console.error('Error al cargar razas por clima:', err)
        setError('No se pudieron cargar las razas')
      } finally {
        setLoading(false)
      }
    }

    loadRazas()
  }, [clima])

  return { razas, loading, error }
}

export const useRazaRecommendations = (
  aptitud?: 'Lechera' | 'Cárnica' | 'Doble Propósito',
  clima?: string
) => {
  const [razas, setRazas] = useState<Raza[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        setLoading(true)
        const data = await razaRepository.getRecommendedRazas(aptitud, clima)
        setRazas(data)
        setError(null)
      } catch (err) {
        console.error('Error al cargar recomendaciones de razas:', err)
        setError('No se pudieron cargar las recomendaciones')
      } finally {
        setLoading(false)
      }
    }

    loadRecommendations()
  }, [aptitud, clima])

  return { razas, loading, error }
}
