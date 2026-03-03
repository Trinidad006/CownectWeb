export interface EstadisticasInventario {
  distribucionPorSexo: {
    machos: number
    hembras: number
    porcentajeMachos: number
    porcentajeHembras: number
  }
  conteoPorEtapa: {
    cria: number
    becerra: number
    becerro: number
    destetado: number
    novillo: number
    toroEngorda: number
    toroReproductor: number
    vacaOrdeña: number
    vacaSeca: number
  }
  estatusSistema: {
    activo: number
    vendido: number
    muerto: number
    robado: number
  }
}

export interface EstadisticasSanitarias {
  coberturaVacunacion: number // Porcentaje
  alertasSanitarias: number // Animales que requieren atención
  tasaMortalidad: number // Porcentaje mensual
}

export interface EstadisticasReproduccion {
  tasaNatalidad: number // Nacimientos en último trimestre
  exitoDestete: number // Porcentaje de éxito
}

export interface EstadisticasInfraestructura {
  cargaAnimal: {
    actual: number
    maxima: number
    porcentaje: number
  }
  ocupacionGeneral: number // Porcentaje
}

export interface EstadisticasCompletas {
  inventario: EstadisticasInventario
  sanitarias: EstadisticasSanitarias
  reproduccion: EstadisticasReproduccion
  infraestructura: EstadisticasInfraestructura
}

