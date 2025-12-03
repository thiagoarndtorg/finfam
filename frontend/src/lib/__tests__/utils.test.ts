import { cn, getBankColor, formatBrazilianCurrency } from '../utils';

describe('cn utility', () => {
  it('should merge class names correctly', () => {
    const result = cn('class1', 'class2');
    expect(result).toContain('class1');
    expect(result).toContain('class2');
  });

  it('should handle conditional classes', () => {
    const result = cn('base', true && 'conditional');
    expect(result).toContain('base');
    expect(result).toContain('conditional');
  });

  it('should handle false conditional classes', () => {
    const result = cn('base', false && 'conditional');
    expect(result).toContain('base');
    expect(result).not.toContain('conditional');
  });

  it('should handle undefined and null values', () => {
    const result = cn('base', undefined, null, 'valid');
    expect(result).toContain('base');
    expect(result).toContain('valid');
  });

  it('should merge tailwind classes correctly', () => {
    const result = cn('p-4', 'p-2');
    expect(result).toBeTruthy();
  });
});

describe('getBankColor', () => {
  it('should return orange for INTER', () => {
    expect(getBankColor('INTER')).toBe('#FF6B35');
  });

  it('should return green for PICPAY', () => {
    expect(getBankColor('PICPAY')).toBe('#20C997');
  });

  it('should return gray for unknown banks', () => {
    expect(getBankColor('UNKNOWN')).toBe('#6B7280');
  });

  it('should return gray for undefined', () => {
    expect(getBankColor()).toBe('#6B7280');
  });

  it('should be case insensitive', () => {
    expect(getBankColor('inter')).toBe('#FF6B35');
    expect(getBankColor('picpay')).toBe('#20C997');
  });
});

describe('formatBrazilianCurrency', () => {
  it('should format number as Brazilian currency', () => {
    const result = formatBrazilianCurrency(103240.08);
    expect(result).toContain('R$');
    expect(result).toContain('103.240,08');
  });

  it('should format small numbers correctly', () => {
    const result = formatBrazilianCurrency(10.5);
    expect(result).toContain('R$');
    expect(result).toContain('10,50');
  });

  it('should format zero correctly', () => {
    const result = formatBrazilianCurrency(0);
    expect(result).toContain('R$');
    expect(result).toContain('0,00');
  });
});

