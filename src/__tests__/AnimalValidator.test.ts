import { AnimalValidator } from '../domain/validators/AnimalValidator';
import { InvalidSiniigaFormat } from '../domain/exceptions/InvalidSiniigaFormat';

describe('TC-INV-04: Validación de Reglas SINIIGA', () => {

  test('Debe lanzar InvalidSiniigaFormat si contiene letras o símbolos', () => {
    // 1. Caso con letras
    expect(() => {
      AnimalValidator.validateSiniiga('12A4567890');
    }).toThrow(InvalidSiniigaFormat);

    // Caso con símbolos
    expect(() => {
      AnimalValidator.validateSiniiga('31-029-384');
    }).toThrow(InvalidSiniigaFormat);
  });

  test('Debe lanzar InvalidSiniigaFormat si la longitud no es de 10 dígitos', () => {
    // 2. Caso longitud menor
    expect(() => {
      AnimalValidator.validateSiniiga('12345');
    }).toThrow(InvalidSiniigaFormat);

    // Caso longitud mayor
    expect(() => {
      AnimalValidator.validateSiniiga('123456789012');
    }).toThrow(InvalidSiniigaFormat);
  });

  test('Debe permitir el flujo si el SINIIGA es válido', () => {
    // Caso de éxito: 10 dígitos numéricos
    const validId = '3102837465';
    expect(() => {
      AnimalValidator.validateSiniiga(validId);
    }).not.toThrow();
  });
});

