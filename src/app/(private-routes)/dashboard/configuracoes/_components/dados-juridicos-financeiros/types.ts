export interface CompanyAddressForm {
  street: string;
  complementary: string;
  streetNumber: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  referencePoint: string;
}

export interface CompanyPhoneForm {
  ddd: string;
  number: string;
}

export function emptyAddress(): CompanyAddressForm {
  return { street: "", complementary: "", streetNumber: "", neighborhood: "", city: "", state: "", zipCode: "", referencePoint: "" };
}

export function emptyPhone(): CompanyPhoneForm {
  return { ddd: "", number: "" };
}

export interface CompanyFormState {
  legalName: string;
  tradeName: string;
  document: string;
  siteUrl: string;
  annualRevenue: string;
  corporationType: string;
  foundingDate: string;
  address: CompanyAddressForm;
  phone: CompanyPhoneForm;
}

export interface RepresentativeFormState {
  document: string;
  motherName: string;
  birthdate: string;
  monthlyIncome: string;
  professionalOccupation: string;
  address: CompanyAddressForm;
  phone: CompanyPhoneForm;
}

export interface BankAccountFormState {
  holderName: string;
  bank: string;
  branchNumber: string;
  branchCheckDigit: string;
  accountNumber: string;
  accountCheckDigit: string;
  accountType: "checking" | "savings";
}

export function emptyCompanyForm(): CompanyFormState {
  return {
    legalName: "",
    tradeName: "",
    document: "",
    siteUrl: "",
    annualRevenue: "",
    corporationType: "",
    foundingDate: "",
    address: emptyAddress(),
    phone: emptyPhone(),
  };
}

export function emptyRepresentativeForm(): RepresentativeFormState {
  return {
    document: "",
    motherName: "",
    birthdate: "",
    monthlyIncome: "",
    professionalOccupation: "",
    address: emptyAddress(),
    phone: emptyPhone(),
  };
}

export function emptyBankAccountForm(): BankAccountFormState {
  return { holderName: "", bank: "", branchNumber: "", branchCheckDigit: "", accountNumber: "", accountCheckDigit: "", accountType: "checking" };
}

export function isAddressComplete(address: CompanyAddressForm): boolean {
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

export function isPhoneComplete(phone: CompanyPhoneForm): boolean {
  return phone.ddd.replace(/\D/g, "").length === 2 && phone.number.replace(/\D/g, "").length >= 8;
}
