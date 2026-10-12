export interface AddressForm {
  street: string;
  complementary: string;
  streetNumber: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  referencePoint: string;
}

export interface PhoneForm {
  ddd: string;
  number: string;
}

export function emptyAddress(): AddressForm {
  return { street: "", complementary: "", streetNumber: "", neighborhood: "", city: "", state: "", zipCode: "", referencePoint: "" };
}

export function emptyPhone(): PhoneForm {
  return { ddd: "", number: "" };
}

export function isAddressComplete(address: AddressForm): boolean {
  return Boolean(
    address.street.trim() &&
      address.complementary.trim() &&
      address.streetNumber.trim() &&
      address.neighborhood.trim() &&
      address.city.trim() &&
      address.state.trim().length === 2 &&
      address.zipCode.replace(/\D/g, "").length === 8 &&
      address.referencePoint.trim(),
  );
}

/**
 * Máscara de valor em reais digitado como centavos ("50000000" → "500.000,00").
 * O campo guarda sempre o texto mascarado; quem envia para a API converte com
 * `moneyToDecimal`, porque o backend só aceita "500000.00".
 */
export function maskMoney(raw: string): string {
  const digits = raw.replace(/\D/g, "").replace(/^0+/, "").slice(0, 15);
  if (!digits) return "";
  const padded = digits.padStart(3, "0");
  const integer = padded.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${integer},${padded.slice(-2)}`;
}

export function moneyToDecimal(masked: string): string {
  const digits = masked.replace(/\D/g, "").replace(/^0+/, "");
  if (!digits) return "";
  const padded = digits.padStart(3, "0");
  return `${padded.slice(0, -2)}.${padded.slice(-2)}`;
}

/** Valor vindo da API ("500000" ou "500000.5") de volta para o texto mascarado. */
export function decimalToMoney(value?: string | null): string {
  const amount = Number(value);
  if (!value || !Number.isFinite(amount) || amount <= 0) return "";
  return maskMoney(amount.toFixed(2));
}

export function isPhoneComplete(phone: PhoneForm): boolean {
  return phone.ddd.replace(/\D/g, "").length === 2 && phone.number.replace(/\D/g, "").length >= 8;
}
