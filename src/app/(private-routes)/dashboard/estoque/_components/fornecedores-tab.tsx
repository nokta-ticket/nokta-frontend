"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTableToolbar } from "@/components/ui/data-table";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Icon, type IconName } from "@/components/ui/icon";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";
import { getErrorMessage } from "@/lib/axios";
import { formatBRLCents } from "@/lib/format";
import { toast } from "@/lib/toast";
import type { VenueSupplier } from "@/services/venue-stock";
import { useVenueStockSupplier, useVenueStockSupplierMutations, useVenueStockSuppliers } from "../_hooks/use-venue-stock-catalog";
import { SupplierFormDialog } from "./supplier-form-dialog";
import { ArchivedBadge } from "./stock-status-badge";
import { formatShortDate, plural } from "./stock-primitives";

type Filter = "ACTIVE" | "ARCHIVED";

function ContactLine({ icon, children, href }: { icon: IconName; children: React.ReactNode; href?: string }) {
  const inner = (
    <>
      <Icon name={icon} size={12} className="shrink-0 text-subtle-foreground" />
      <span className="truncate">{children}</span>
    </>
  );
  return href ? (
    <a href={href} className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
      {inner}
    </a>
  ) : (
    <span className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">{inner}</span>
  );
}

function SupplierCard({ orgId, supplier, index, onEdit, onArchive }: { orgId: number; supplier: VenueSupplier; index: number; onEdit: () => void; onArchive: () => void }) {
  const { data: detail, isLoading } = useVenueStockSupplier(orgId, supplier.id);
  const archived = Boolean(supplier.archivedAt);
  const contacts = [
    supplier.contactName ? { icon: "user" as const, text: supplier.contactName } : null,
    supplier.phone ? { icon: "phone" as const, text: supplier.phone, href: `tel:${supplier.phone.replace(/\D/g, "")}` } : null,
    supplier.email ? { icon: "mail" as const, text: supplier.email, href: `mailto:${supplier.email}` } : null,
    supplier.document ? { icon: "id-card" as const, text: supplier.document } : null,
  ].filter((c): c is NonNullable<typeof c> => c !== null);

  return (
    <Card className={cn("fade-up p-5", archived && "opacity-80")} style={{ ["--i" as string]: index } as React.CSSProperties}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-foreground">{supplier.nome}</p>
          <div className="mt-1.5">
            <ArchivedBadge archived={archived} />
          </div>
        </div>
        <div className="-mr-2 -mt-1.5 flex shrink-0 items-center gap-0.5">
          <Button variant="subtle" size="icon-sm" aria-label={`Editar ${supplier.nome}`} title="Editar" onClick={onEdit}>
            <Icon name="edit" size={14} />
          </Button>
          {!archived ? (
            <Button variant="subtle" size="icon-sm" aria-label={`Arquivar ${supplier.nome}`} title="Arquivar" className="hover:bg-danger-bg hover:text-danger" onClick={onArchive}>
              <Icon name="ban" size={14} />
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mt-4 space-y-1.5">
        {contacts.length === 0 ? <p className="text-sm text-subtle-foreground">Sem contato informado</p> : contacts.map((c) => <ContactLine key={c.icon} icon={c.icon} href={"href" in c ? c.href : undefined}>{c.text}</ContactLine>)}
      </div>

      {supplier.notes ? <p className="mt-3 line-clamp-2 text-caption text-muted-foreground">{supplier.notes}</p> : null}

      <div className="mt-auto border-t border-border pt-3">
        <p className="text-micro uppercase tracking-wider text-subtle-foreground">Último pedido</p>
        {isLoading ? (
          <Skeleton className="mt-1.5 h-4 w-40" />
        ) : detail?.lastPurchase ? (
          <p className="mt-1 text-sm text-foreground tnum">
            <span className="font-medium">{detail.lastPurchase.publicCode}</span>
            <span className="text-muted-foreground"> · {formatBRLCents(detail.lastPurchase.totalCostCents)}</span>
            <span className="text-muted-foreground">{detail.lastPurchase.receivedAt ? ` · recebida ${formatShortDate(detail.lastPurchase.receivedAt)}` : " · em rascunho"}</span>
          </p>
        ) : (
          <p className="mt-1 text-sm text-subtle-foreground">Nenhum pedido ainda</p>
        )}
        {detail && detail.purchaseCount > 0 ? <p className="mt-0.5 text-caption text-subtle-foreground tnum">{plural(detail.purchaseCount, "compra no total", "compras no total")}</p> : null}
      </div>
    </Card>
  );
}

export function FornecedoresTab({ orgId }: { orgId: number }) {
  const [filter, setFilter] = useState<Filter>("ACTIVE");
  const { data: suppliers, isLoading, isError, refetch } = useVenueStockSuppliers(orgId, filter === "ARCHIVED");
  const { archive } = useVenueStockSupplierMutations(orgId);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<VenueSupplier | null>(null);
  const [archiving, setArchiving] = useState<VenueSupplier | null>(null);

  const list = (suppliers ?? []).filter((s) => (filter === "ARCHIVED" ? Boolean(s.archivedAt) : !s.archivedAt));

  const handleArchive = async () => {
    if (!archiving) return;
    try {
      await archive.mutateAsync(archiving.id);
      toast.success("Fornecedor arquivado.");
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível arquivar."));
    }
  };

  return (
    <div className="space-y-4">
      <DataTableToolbar>
        <SegmentedControl
          size="sm"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "ACTIVE", label: "Ativos" },
            { value: "ARCHIVED", label: "Arquivados" },
          ]}
        />
        <Button
          className="ml-auto"
          size="sm"
          leftIcon="plus"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          Novo fornecedor
        </Button>
      </DataTableToolbar>

      {isError ? (
        <ErrorState description="Não foi possível carregar os fornecedores." onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-card" />
          ))}
        </div>
      ) : list.length === 0 ? (
        filter === "ARCHIVED" ? (
          <EmptyState icon="truck" title="Nenhum fornecedor arquivado" description="Fornecedores arquivados somem das compras novas, mas o histórico fica." />
        ) : (
          <EmptyState
            icon="truck"
            title="Nenhum fornecedor cadastrado"
            description="Cadastre quem vende pra você e acompanhe o histórico de compras."
            action={
              <Button leftIcon="plus" onClick={() => setFormOpen(true)}>
                Novo fornecedor
              </Button>
            }
          />
        )
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((s, i) => (
            <SupplierCard
              key={s.id}
              orgId={orgId}
              supplier={s}
              index={i}
              onEdit={() => {
                setEditing(s);
                setFormOpen(true);
              }}
              onArchive={() => setArchiving(s)}
            />
          ))}
        </div>
      )}

      <SupplierFormDialog orgId={orgId} supplier={editing} open={formOpen} onOpenChange={setFormOpen} />

      <ConfirmDialog
        open={archiving !== null}
        onOpenChange={(v) => !v && setArchiving(null)}
        danger
        icon="ban"
        title={`Arquivar ${archiving?.nome ?? "fornecedor"}?`}
        description="Não aparece mais como opção em novas compras. O histórico continua acessível."
        confirmLabel="Arquivar"
        onConfirm={handleArchive}
      />
    </div>
  );
}
