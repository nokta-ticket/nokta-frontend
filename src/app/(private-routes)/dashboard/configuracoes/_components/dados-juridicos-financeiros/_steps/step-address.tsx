"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/lib/toast";
import type { LegalType } from "@/services/venue-legal-financial";
import { AddressFields } from "../_sections/address-fields";
import { PhoneFields } from "../_sections/phone-fields";
import { emptyAddress, emptyPhone, isPhoneComplete, missingAddressField, type AddressForm, type PhoneForm } from "../types";

export interface AddressStepFormState {
  address: AddressForm;
  phone: PhoneForm;
}

export function emptyAddressStep(): AddressStepFormState {
  return { address: emptyAddress(), phone: emptyPhone() };
}

export function StepAddress({ legalType, initialValue, onSubmit, onBack, submitting }: { legalType: LegalType; initialValue: AddressStepFormState; onSubmit: (value: AddressStepFormState) => void; onBack: () => void; submitting: boolean }) {
  const [value, setValue] = useState(initialValue);
  const isCompany = legalType === "COMPANY";

  const missing = missingAddressField(value.address) ?? (isPhoneComplete(value.phone) ? null : "Informe o DDD e o telefone.");

  const handleSubmit = () => {
    if (missing) {
      toast.error(missing);
      return;
    }
    onSubmit(value);
  };

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>{isCompany ? "Endereço do representante legal" : "Seu endereço"}</CardTitle>
          <CardDescription>
            {isCompany ? "Endereço residencial do representante." : "Endereço residencial."}
            {isCompany && !value.address.street ? " Se você já preencheu esta etapa antes, os campos aparecem vazios por segurança — é só preencher de novo." : null}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <AddressFields value={value.address} onChange={(address) => setValue((v) => ({ ...v, address }))} idPrefix="endereco" />
        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-foreground">Telefone</legend>
          <PhoneFields value={value.phone} onChange={(phone) => setValue((v) => ({ ...v, phone }))} idPrefix="endereco-telefone" />
        </fieldset>
      </CardContent>
      <CardFooter className="justify-between">
        <Button type="button" variant="ghost" onClick={onBack} disabled={submitting} leftIcon="arrow-left">
          Voltar
        </Button>
        <Button onClick={handleSubmit} loading={submitting} rightIcon="arrow-right">
          Continuar
        </Button>
      </CardFooter>
    </Card>
  );
}
