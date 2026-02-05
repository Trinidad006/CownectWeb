import { Animal } from '@/domain/entities/Animal'
import { EstadisticasCompletas, EstadisticasInventario, EstadisticasSanitarias, EstadisticasReproduccion, EstadisticasInfraestructura } from '@/domain/entities/Estadisticas'

export class CalcularEstadisticasUseCase {
  execute(
    animales: Animal[],
    vacunaciones: any[],
    pesos: any[],
    capacidadMaxima?: number
  ): EstadisticasCompletas {
    const inventario = this.calcularInventario(animales)
    const sanitarias = this.calcularSanitarias(animales, vacunaciones)
    const reproduccion = this.calcularReproduccion(animales, pesos)
    const infraestructura = this.calcularInfraestructura(animales, capacidadMaxima)

    return {
      inventario,
      sanitarias,
      reproduccion,
      infraestructura,
    }
  }

  private calcularInventario(animales: Animal[]): EstadisticasInventario {
    const total = animales.length
    const machos = animales.filter(a => a.sexo === 'M').length
    const hembras = animales.filter(a => a.sexo === 'H').length

    // Conteo por etapa productiva (basado en estado)
    const cria = animales.filter(a => {
      const estado = a.estado?.toLowerCase() || ''
      return estado === 'cría' || estado === 'cria' || estado.includes('cría') || estado.includes('cria')
    }).length
    const becerra = animales.filter(a => {
      const estado = a.estado?.toLowerCase() || ''
      return estado === 'becerra' || estado.includes('becerra')
    }).length
    const becerro = animales.filter(a => {
      const estado = a.estado?.toLowerCase() || ''
      return estado === 'becerro' || estado.includes('becerro')
    }).length
    const destetado = animales.filter(a => {
      const estado = a.estado?.toLowerCase() || ''
      return estado === 'destetado' || estado.includes('destetado')
    }).length
    const novillo = animales.filter(a => {
      const estado = a.estado?.toLowerCase() || ''
      return estado === 'novillo' || estado.includes('novillo')
    }).length
    const toroEngorda = animales.filter(a => {
      const estado = a.estado?.toLowerCase() || ''
      return estado === 'toro de engorda' || estado === 'toro engorda' || estado.includes('toro de engorda') || estado.includes('toro engorda') || (estado.includes('toro') && estado.includes('engorda'))
    }).length
    const toroReproductor = animales.filter(a => {
      const estado = a.estado?.toLowerCase() || ''
      return estado === 'toro reproductor' || estado.includes('toro reproductor')
    }).length
    const vacaOrdeña = animales.filter(a => {
      const estado = a.estado?.toLowerCase() || ''
      return estado === 'vaca ordeña' || estado === 'vaca ordeña' || estado.includes('vaca ordeña') || estado.includes('ordeña')
    }).length
    const vacaSeca = animales.filter(a => {
      const estado = a.estado?.toLowerCase() || ''
      return estado === 'vaca seca' || estado.includes('vaca seca') || (estado.includes('vaca') && estado.includes('seca'))
    }).length

    // Estatus del sistema
    const activo = animales.filter(a => {
      const estado = a.estado?.toLowerCase() || ''
      return a.estado_venta !== 'vendido' && 
             estado !== 'muerto' && 
             estado !== 'robado' &&
             (estado === 'activo' || estado === '' || !estado.includes('muerto') && !estado.includes('robado'))
    }).length
    const vendido = animales.filter(a => a.estado_venta === 'vendido').length
    const muerto = animales.filter(a => {
      const estado = a.estado?.toLowerCase() || ''
      return estado === 'muerto' || estado.includes('muerto')
    }).length
    const robado = animales.filter(a => {
      const estado = a.estado?.toLowerCase() || ''
      return estado === 'robado' || estado.includes('robado')
    }).length

    return {
      distribucionPorSexo: {
        machos,
        hembras,
        porcentajeMachos: total > 0 ? (machos / total) * 100 : 0,
        porcentajeHembras: total > 0 ? (hembras / total) * 100 : 0,
      },
      conteoPorEtapa: {
        cria,
        becerra,
        becerro,
        destetado,
        novillo,
        toroEngorda,
        toroReproductor,
        vacaOrdeña,
        vacaSeca,
      },
      estatusSistema: {
        activo,
        vendido,
        muerto,
        robado,
      },
    }
  }

  private calcularSanitarias(animales: Animal[], vacunaciones: any[]): EstadisticasSanitarias {
    const totalActivos = animales.filter(a => a.estado_venta !== 'vendido' && a.estado?.toLowerCase() !== 'muerto').length
    
    if (totalActivos === 0) {
      return {
        coberturaVacunacion: 0,
        alertasSanitarias: 0,
        tasaMortalidad: 0,
      }
    }

    // Animales con vacunaciones recientes (últimos 6 meses)
    const ahora = new Date()
    const hace6Meses = new Date(ahora.getTime() - 6 * 30 * 24 * 60 * 60 * 1000)
    
    const animalesConVacunas = new Set(
      vacunaciones
        .filter(v => {
          const fechaVacuna = v.fecha_aplicacion ? new Date(v.fecha_aplicacion) : null
          return fechaVacuna && fechaVacuna >= hace6Meses
        })
        .map(v => v.animal_id)
    )

    const coberturaVacunacion = (animalesConVacunas.size / totalActivos) * 100

    // Alertas sanitarias: animales sin vacunas en últimos 6 meses o próximos a vencer
    const hace15Dias = new Date(ahora.getTime() - 15 * 24 * 60 * 60 * 1000)
    const animalesSinVacunasRecientes = animales.filter(a => 
      a.estado_venta !== 'vendido' && 
      a.estado?.toLowerCase() !== 'muerto' &&
      !animalesConVacunas.has(a.id)
    ).length

    // Tasa de mortalidad mensual (últimos 30 días)
    const hace30Dias = new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000)
    const muertosRecientes = animales.filter(a => {
      if (a.estado?.toLowerCase() !== 'muerto') return false
      const fechaMuerte = a.updated_at ? new Date(a.updated_at) : null
      return fechaMuerte && fechaMuerte >= hace30Dias
    }).length

    const tasaMortalidad = totalActivos > 0 ? (muertosRecientes / totalActivos) * 100 : 0

    return {
      coberturaVacunacion: Math.round(coberturaVacunacion * 10) / 10,
      alertasSanitarias: animalesSinVacunasRecientes,
      tasaMortalidad: Math.round(tasaMortalidad * 10) / 10,
    }
  }

  private calcularReproduccion(animales: Animal[], pesos: any[]): EstadisticasReproduccion {
    const ahora = new Date()
    const hace3Meses = new Date(ahora.getTime() - 3 * 30 * 24 * 60 * 60 * 1000)

    // Tasa de natalidad: animales nacidos en último trimestre
    const nacimientos = animales.filter(a => {
      if (!a.fecha_nacimiento) return false
      const fechaNac = new Date(a.fecha_nacimiento)
      return fechaNac >= hace3Meses
    }).length

    // Éxito de destete: animales que pasaron de cría a destetado
    const animalesDestetados = animales.filter(a => 
      a.estado?.toLowerCase().includes('destetado')
    ).length

    const animalesCria = animales.filter(a => 
      a.estado?.toLowerCase().includes('cría') || a.estado?.toLowerCase().includes('cria')
    ).length

    const totalCria = animalesCria + animalesDestetados
    const exitoDestete = totalCria > 0 ? (animalesDestetados / totalCria) * 100 : 0

    return {
      tasaNatalidad: nacimientos,
      exitoDestete: Math.round(exitoDestete * 10) / 10,
    }
  }

  private calcularInfraestructura(animales: Animal[], capacidadMaxima?: number): EstadisticasInfraestructura {
    const animalesActivos = animales.filter(a => 
      a.estado_venta !== 'vendido' && 
      a.estado?.toLowerCase() !== 'muerto'
    ).length

    const capacidad = capacidadMaxima || 100 // Default si no se especifica
    const porcentaje = capacidad > 0 ? (animalesActivos / capacidad) * 100 : 0

    return {
      cargaAnimal: {
        actual: animalesActivos,
        maxima: capacidad,
        porcentaje: Math.round(porcentaje * 10) / 10,
      },
      ocupacionGeneral: Math.round(porcentaje * 10) / 10,
    }
  }
}

