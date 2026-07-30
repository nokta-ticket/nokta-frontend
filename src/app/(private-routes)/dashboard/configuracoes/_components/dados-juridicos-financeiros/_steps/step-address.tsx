"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "@/lib/toast";
import type { LegalType } from "@/services/venue-legal-financial";
import { AddressFields } from "../_sections/address-fields";
import { PhoneFields } from "../_sections/phone-fields";
import { emptyAddress, emptyPhone, isAddressComplete, isPhoneComplete, type AddressForm, type PhoneForm } from "../types";

export interface AddressStepFormState {
  address: AddressForm;
  phone: PhoneForm;
}

export function emptyAddressStep(): AddressStepFormState {
  return { address: emptyAddress(), phone: emptyPhone() };
}

export function StepAddress({
  legalType,
  initialValue,
  onSubmit,
  onBack,
  submitting,
}: {
  legalType: LegalType;
  initialValue: AddressStepFormState;
  onSubmit: (value: AddressStepFormState) => void;
  onBack: () => void;
  submitting: boolean;
}) {
  const [value, setValue] = useState(initialValue);
  const isCompany = legalType === "COMPANY";

  const canAdvance = isAddressComplete(value.address) && isPhoneComplete(value.phone);

  const handleSubmit = () => {
    if (!canAdvance) {
      toast.error("Preencha o endereço completo (incluindo CEP) e o telefone.");
      return;
    }
    onSubmit(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isCompany ? "Endereço do representante legal" : "Seu endereço"}</CardTitle>
        <CardDescription>
          {isCompany ? "Endereço residencial do representante." : "Endereço residencial."}
          {isCompany && !value.address.street ? " Se você já preencheu esta etapa antes, os campos aparecem vazios por segurança — é só preencher de novo." : null}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <AddressFields value={value.address} onChange={(address) => setValue((v) => ({ ...v, address }))} idPrefix="endereco" />
        <div>
          <Label className="mb-3 block text-xs text-black/50">Telefone</Label>
          <PhoneFields value={value.phone} onChange={(phone) => setValue((v) => ({ ...v, phone }))} idPrefix="endereco-telefone" />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack} disabled={submitting}>
          Voltar
        </Button>
        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Salvando…" : "Continuar"}
        </Button>
      </CardFooter>
    </Card>
  );
}
