export class InvalidSiniigaFormat extends Error {
  constructor(message: string = 'El identificador SINIIGA debe contener exactamente 10 dígitos numéricos.') {
    super(message)
    this.name = 'InvalidSiniigaFormat'
  }
}

