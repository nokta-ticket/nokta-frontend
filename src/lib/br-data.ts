export function normalizeDigits(value?: string | null): string {
  return (value ?? "").replace(/\D/g, "");
}

export function formatCpf(value?: string | null): string {
  const digits = normalizeDigits(value).slice(0, 11);

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  }

  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function formatCnpj(value?: string | null): string {
  const digits = normalizeDigits(value).slice(0, 14);

  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  }
  if (digits.length <= 12) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  }

  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

export function formatPhone(value?: string | null): string {
  const digits = normalizeDigits(value).slice(0, 11);

  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function maskPhone(value?: string | null): string {
  const digits = normalizeDigits(value);

  if (digits.length < 10) return digits;

  const local = digits.length === 11 ? digits : digits.slice(-10);
  return `(${local.slice(0, 2)}) ${local.slice(2, 4)}****-${local.slice(-4)}`;
}

export function validateCpf(value?: string | null): boolean {
  const digits = normalizeDigits(value);

  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) {
    return false;
  }

  let sum = 0;
  for (let index = 0; index < 9; index += 1) {
    sum += Number(digits[index]) * (10 - index);
  }

  let remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== Number(digits[9])) return false;

  sum = 0;
  for (let index = 0; index < 10; index += 1) {
    sum += Number(digits[index]) * (11 - index);
  }

  remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;

  return remainder === Number(digits[10]);
}

export function validateCnpj(value?: string | null): boolean {
  const digits = normalizeDigits(value);

  if (digits.length !== 14 || /^(\d)\1{13}$/.test(digits)) {
    return false;
  }

  const calc = (input: string, weights: number[]) =>
    weights.reduce((acc, weight, index) => acc + Number(input[index]) * weight, 0);

  const firstRemainder = calc(digits, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) % 11;
  const firstDigit = firstRemainder < 2 ? 0 : 11 - firstRemainder;
  if (firstDigit !== Number(digits[12])) return false;

  const secondRemainder = calc(digits, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) % 11;
  const secondDigit = secondRemainder < 2 ? 0 : 11 - secondRemainder;

  return secondDigit === Number(digits[13]);
}

export function validatePixKey(value?: string | null): boolean {
  const pixKey = (value ?? "").trim();
  if (!pixKey) return false;

  const digits = normalizeDigits(pixKey);

  if (validateCpf(pixKey) || validateCnpj(pixKey)) return true;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pixKey)) return true;
  if (digits.length >= 10 && digits.length <= 13) return true;
  if (/^[0-9a-fA-F-]{32,36}$/.test(pixKey)) return true;

  return pixKey.length >= 5;
}
