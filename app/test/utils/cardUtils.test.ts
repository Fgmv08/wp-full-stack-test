import { describe, it, expect } from 'vitest';
import {
  validateLuhn,
  detectCardBrand,
  formatCardNumber,
  formatExpiry,
  validateExpiry,
} from '@/shared/utils/cardUtils';

describe('cardUtils Helper', () => {
  describe('validateLuhn()', () => {
    it('debe retornar true para números de tarjeta válidos según el algoritmo de Luhn', () => {
      expect(validateLuhn('4242424242424242')).toBe(true);
      expect(validateLuhn('4242 4242 4242 4242')).toBe(true);
    });

    it('debe retornar false para números de tarjeta con dígito verificador inválido', () => {
      expect(validateLuhn('4242424242424241')).toBe(false);
      expect(validateLuhn('4242424242424243')).toBe(false);
    });

    it('debe retornar false si la longitud es menor a 13 o mayor a 19 dígitos', () => {
      expect(validateLuhn('123456789')).toBe(false);
      expect(validateLuhn('123456789012345678901')).toBe(false);
    });
  });

  describe('detectCardBrand()', () => {
    it('debe detectar VISA cuando comienza con 4', () => {
      expect(detectCardBrand('4242 4242 4242 4242')).toBe('VISA');
      expect(detectCardBrand('4000001234567890')).toBe('VISA');
    });

    it('debe detectar MASTERCARD con prefijos válidos (51-55 y 2221-2720)', () => {
      expect(detectCardBrand('5105 1051 0510 5100')).toBe('MASTERCARD');
      expect(detectCardBrand('5500 0000 0000 0004')).toBe('MASTERCARD');
      expect(detectCardBrand('2221 0000 0000 0000')).toBe('MASTERCARD');
      expect(detectCardBrand('2720 9999 9999 9999')).toBe('MASTERCARD');
    });

    it('debe retornar UNKNOWN para marcas no soportadas o números vacíos', () => {
      expect(detectCardBrand('378282246310005')).toBe('UNKNOWN'); // AMEX
      expect(detectCardBrand('')).toBe('UNKNOWN');
      expect(detectCardBrand('abc')).toBe('UNKNOWN');
    });
  });

  describe('formatCardNumber()', () => {
    it('debe agregar espacios cada 4 dígitos y respetar el límite de 19 dígitos', () => {
      expect(formatCardNumber('4242424242424242')).toBe('4242 4242 4242 4242');
      expect(formatCardNumber('12345678')).toBe('1234 5678');
      expect(formatCardNumber('123456789012345678909999')).toBe('1234 5678 9012 3456 789');
    });

    it('debe filtrar caracteres no numéricos', () => {
      expect(formatCardNumber('4242-abcd-4242')).toBe('4242 4242');
    });
  });

  describe('formatExpiry()', () => {
    it('debe formatear a MM/YY cuando se ingresan 3 o más dígitos', () => {
      expect(formatExpiry('12')).toBe('12');
      expect(formatExpiry('122')).toBe('12/2');
      expect(formatExpiry('1228')).toBe('12/28');
      expect(formatExpiry('122899')).toBe('12/28'); // máximo 4 dígitos
    });

    it('debe limpiar caracteres especiales antes de formatear', () => {
      expect(formatExpiry('1a2b3c')).toBe('12/3');
    });
  });

  describe('validateExpiry()', () => {
    it('debe validar fechas futuras correctamente', () => {
      expect(validateExpiry('12/30')).toBe(true);
      expect(validateExpiry('01/35')).toBe(true);
    });

    it('debe rechazar meses fuera de rango 01-12', () => {
      expect(validateExpiry('00/28')).toBe(false);
      expect(validateExpiry('13/28')).toBe(false);
    });

    it('debe rechazar fechas pasadas', () => {
      expect(validateExpiry('01/20')).toBe(false);
      expect(validateExpiry('12/19')).toBe(false);
    });

    it('debe rechazar entradas incompletas o vacías', () => {
      expect(validateExpiry('12')).toBe(false);
      expect(validateExpiry('')).toBe(false);
      expect(validateExpiry('abcd')).toBe(false);
    });
  });
});
