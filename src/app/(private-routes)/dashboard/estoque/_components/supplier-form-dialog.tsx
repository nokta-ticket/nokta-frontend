"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import type { VenueSupplier } from "@/services/venue-stock";
import { useVenueStockSupplierMutations } from "../_hooks/use-venue-stock-catalog";

export function SupplierFormDialog({
  orgId,
  supplier,
  open,
  onOpenChange,
}: {
  orgId: number;
  supplier: VenueSupplier | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { create, update } = useVenueStockSupplierMutations(orgId);

  const [nome, setNome] = useState("");
  const [document, setDocument] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    setNome(supplier?.nome ?? "");
    setDocument(supplier?.document ?? "");
    setContactName(supplier?.contactName ?? "");
    setPhone(supplier?.phone ?? "");
    setEmail(supplier?.email ?? "");
    setNotes(supplier?.notes ?? "");
  }, [open, supplier]);

  const loading = create.isPending || update.isPending;

  const handleSubmit = () => {
    if (!nome.trim()) {
      toast.error("Informe o nome do fornecedor.");
      return;
    }
    const payload = {
      nome: nome.trim(),
      document: document.trim() || undefined,
      contactName: contactName.trim() || undefined,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      notes: notes.trim() || undefined,
    };
    const mutation = supplier ? update.mutateAsync({ supplierId: supplier.id, payload }) : create.mutateAsync(payload);
    mutation
      .then(() => {
        toast.success(supplier ? "Fornecedor atualizado." : "Fornecedor criado.");
        onOpenChange(false);
      })
      .catch((err) => toast.error(getErrorMessage(err, "Não foi possível salvar o fornecedor.")));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>{supplier ? "Editar fornecedor" : "Novo fornecedor"}</DialogTitle>
          <DialogDescription>Quem vende pra você. Aparece como opção ao registrar uma compra.</DialogDescription>
        </DialogHeader>

        <DialogBody>
          <Field label="Nome" htmlFor="supplier-nome" required>
            <Input id="supplier-nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Distribuidora Paulista de Bebidas" autoFocus />
          </Field>
          <FieldGroup columns={2}>
            <Field label="Contato" htmlFor="supplier-contact" optional>
              <Input id="supplier-contact" leftIcon="user" value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Nome de quem atende" />
            </Field>
            <Field label="Telefone" htmlFor="supplier-phone" optional>
              <Input id="supplier-phone" type="tel" leftIcon="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-0000" />
            </Field>
          </FieldGroup>
          <FieldGroup columns={2}>
            <Field label="E-mail" htmlFor="supplier-email" optional>
              <Input id="supplier-email" type="email" leftIcon="mail" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="pedidos@fornecedor.com" />
            </Field>
            <Field label="CNPJ ou CPF" htmlFor="supplier-doc" optional>
              <Input id="supplier-doc" leftIcon="id-card" value={document} onChange={(e) => setDocument(e.target.value)} placeholder="00.000.000/0000-00" />
            </Field>
          </FieldGroup>
          <Field label="Observações" htmlFor="supplier-notes" optional>
            <Textarea id="supplier-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="min-h-20" placeholder="Dias de entrega, pedido mínimo, condições…" />
          </Field>
        </DialogBody>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} loading={loading} disabled={!nome.trim()}>
            {supplier ? "Salvar alterações" : "Criar fornecedor"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
