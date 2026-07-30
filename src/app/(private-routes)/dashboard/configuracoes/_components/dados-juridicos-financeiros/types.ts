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

export function isPhoneComplete(phone: PhoneForm): boolean {
  return phone.ddd.replace(/\D/g, "").length === 2 && phone.number.replace(/\D/g, "").length >= 8;
}
