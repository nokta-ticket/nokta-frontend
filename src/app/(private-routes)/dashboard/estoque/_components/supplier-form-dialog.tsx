"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{supplier ? "Editar fornecedor" : "Novo fornecedor"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="supplier-nome">Nome</Label>
            <Input id="supplier-nome" value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="supplier-contact">Contato (opcional)</Label>
              <Input id="supplier-contact" value={contactName} onChange={(e) => setContactName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier-phone">Telefone (opcional)</Label>
              <Input id="supplier-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="supplier-email">E-mail (opcional)</Label>
              <Input id="supplier-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier-doc">Documento (opcional)</Label>
              <Input id="supplier-doc" value={document} onChange={(e) => setDocument(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="supplier-notes">Observações (opcional)</Label>
            <Textarea id="supplier-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancelar</Button>
          <Button disabled={loading || !nome.trim()} onClick={handleSubmit}>
            {loading ? "Salvando…" : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
