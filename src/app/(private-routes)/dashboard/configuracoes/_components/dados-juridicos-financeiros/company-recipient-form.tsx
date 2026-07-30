"use client";

import { useState } from "react";
import { toast } from "@/lib/toast";
import { getErrorMessage } from "@/lib/axios";
import { validateCep, validateCnpj, validateCpf } from "@/lib/br-data";
import { useAuth } from "@/context/AuthContext";
import type { LegalFinancialProfile } from "@/services/venue-legal-financial";
import { useSubmitCompanyRecipient } from "../../_hooks/use-legal-financial-settings";
import { SectionEmpresa } from "./_sections/section-empresa";
import { SectionRepresentante } from "./_sections/section-representante";
import { SectionContaRepasse } from "./_sections/section-conta-repasse";
import { SectionRevisao } from "./_sections/section-revisao";
import { SectionStatus } from "./_sections/section-status";
import {
  emptyBankAccountForm,
  emptyCompanyForm,
  emptyRepresentativeForm,
  isAddressComplete,
  isPhoneComplete,
  type BankAccountFormState,
  type CompanyFormState,
  type RepresentativeFormState,
} from "./types";

/**
 * Fluxo PJ em 5 seções, tela única (decisão de produto: não é wizard).
 * Recebedor é criado direto no submit da Revisão — sem gate de aprovação
 * manual de staff (a Pagar.me passa a ser fonte de verdade do KYC via
 * webhook, refletido na seção Status).
 */
export function CompanyRecipientForm({
  orgId,
  canManage,
  profile,
}: {
  orgId: number;
  canManage: boolean;
  profile: LegalFinancialProfile | undefined;
}) {
  const { user } = useAuth();
  const submit = useSubmitCompanyRecipient(orgId);

  const [company, setCompany] = useState<CompanyFormState>(() => {
    const base = emptyCompanyForm();
    if (!profile) return base;
    return {
      ...base,
      legalName: profile.legalName ?? "",
      tradeName: profile.tradeName ?? "",
      siteUrl: profile.company.siteUrl ?? "",
      annualRevenue: profile.company.annualRevenue ?? "",
      corporationType: profile.company.corporationType ?? "",
      foundingDate: profile.company.foundingDate ? profile.company.foundingDate.slice(0, 10) : "",
      address: profile.company.address
        ? {
            street: profile.company.address.street ?? "",
            complementary: profile.company.address.complementary ?? "",
            streetNumber: profile.company.address.streetNumber ?? "",
            neighborhood: profile.company.address.neighborhood ?? "",
            city: profile.company.address.city ?? "",
            state: profile.company.address.state ?? "",
            zipCode: profile.company.address.zipCode ?? "",
            referencePoint: profile.company.address.referencePoint ?? "",
          }
        : base.address,
      phone: profile.company.phone ? { ddd: profile.company.phone.ddd, number: profile.company.phone.number } : base.phone,
    };
  });

  const [representative, setRepresentative] = useState<RepresentativeFormState>(() => {
    const base = emptyRepresentativeForm();
    if (!profile) return base;
    return {
      ...base,
      motherName: profile.representative.motherName ?? "",
      birthdate: profile.representative.birthdate ? profile.representative.birthdate.slice(0, 10) : "",
      monthlyIncome: profile.representative.monthlyIncome ?? "",
      professionalOccupation: profile.representative.professionalOccupation ?? "",
    };
  });

  const [bankAccount, setBankAccount] = useState<BankAccountFormState>(emptyBankAccountForm());

  const hasRecipient = !!profile?.hasRecipient;
  const readOnly = !canManage || hasRecipient;

  const companyValid =
    company.legalName.trim().length >= 2 &&
    validateCnpj(company.document) &&
    Number(company.annualRevenue.replace(",", ".")) > 0 &&
    isAddressComplete(company.address) &&
    isPhoneComplete(company.phone) &&
    validateCep(company.address.zipCode);

  const representativeValid =
    validateCpf(representative.document) &&
    representative.motherName.trim().length >= 2 &&
    !!representative.birthdate &&
    Number(representative.monthlyIncome.replace(",", ".")) > 0 &&
    representative.professionalOccupation.trim().length >= 2 &&
    isAddressComplete(representative.address) &&
    isPhoneComplete(representative.phone) &&
    validateCep(representative.address.zipCode);

  const bankAccountValid =
    bankAccount.holderName.trim().length >= 2 &&
    !!bankAccount.bank &&
    !!bankAccount.branchNumber &&
    !!bankAccount.accountNumber &&
    !!bankAccount.accountCheckDigit;

  const canSubmit = companyValid && representativeValid && bankAccountValid;

  const handleSubmit = () => {
    if (!canSubmit) {
      toast.error("Preencha todos os campos obrigatórios antes de continuar.");
      return;
    }
    submit.mutate(
      {
        legalName: company.legalName.trim(),
        tradeName: company.tradeName.trim() || undefined,
        document: company.document.replace(/\D/g, ""),
        siteUrl: company.siteUrl.trim() || undefined,
        annualRevenue: company.annualRevenue.replace(",", "."),
        corporationType: company.corporationType.trim() || undefined,
        foundingDate: company.foundingDate || undefined,
        address: { ...company.address, zipCode: company.address.zipCode.replace(/\D/g, "") },
        phone: company.phone,
        representative: {
          document: representative.document.replace(/\D/g, ""),
          motherName: representative.motherName.trim(),
          birthdate: representative.birthdate,
          monthlyIncome: representative.monthlyIncome.replace(",", "."),
          professionalOccupation: representative.professionalOccupation.trim(),
          address: { ...representative.address, zipCode: representative.address.zipCode.replace(/\D/g, "") },
          phone: representative.phone,
        },
        bankAccount: {
          holderName: bankAccount.holderName.trim(),
          bank: bankAccount.bank,
          branchNumber: bankAccount.branchNumber,
          branchCheckDigit: bankAccount.branchCheckDigit || undefined,
          accountNumber: bankAccount.accountNumber,
          accountCheckDigit: bankAccount.accountCheckDigit,
          accountType: bankAccount.accountType,
        },
      },
      {
        onSuccess: (result) => {
          if (result.recipient.created) {
            toast.success("Recebedor criado na Pagar.me.");
          } else {
            toast.error(
              getErrorMessage(
                result.recipient.error,
                "Dados salvos, mas não foi possível criar o recebedor agora. Tente novamente na seção Status.",
              ),
            );
          }
        },
        onError: (err) => toast.error(getErrorMessage(err, "Não foi possível enviar os dados. Tente novamente.")),
      },
    );
  };

  if (readOnly && profile) {
    return <SectionStatus profile={profile} />;
  }

  const representativeName = user ? `${user.nome ?? ""} ${user.sobrenome ?? ""}`.trim() : "";

  return (
    <div className="space-y-4">
      <SectionEmpresa value={company} onChange={setCompany} />
      <SectionRepresentante
        value={representative}
        onChange={setRepresentative}
        representativeName={representativeName || "—"}
        representativeEmail={user?.email ?? "—"}
      />
      <SectionContaRepasse value={bankAccount} onChange={setBankAccount} />
      <SectionRevisao
        company={company}
        representative={representative}
        bankAccount={bankAccount}
        submitting={submit.isPending}
        onSubmit={handleSubmit}
        canSubmit={canSubmit}
      />
      <SectionStatus profile={profile} />
    </div>
  );
}
