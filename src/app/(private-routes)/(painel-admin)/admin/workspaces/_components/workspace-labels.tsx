import { StatusBadge } from "@/components/ui/badge";
import { MODULE_LABEL, WORKSPACE_STAGE_META, WORKSPACE_STATUS_META, metaOf, type StageMeta } from "../../_lib/status-meta";

export { MODULE_LABEL };

export function WorkspaceStatusBadge({ status }: { status: string }) {
  const meta = metaOf(WORKSPACE_STATUS_META, status);
  return <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>;
}

export function stageInfo(etapa: string): StageMeta {
  return WORKSPACE_STAGE_META[etapa] ?? { label: etapa, detail: "", step: null, tone: "neutral" };
}

/** "Etapa 2 de 4 · Operação" enquanto o onboarding não terminou; só o rótulo fora dele. */
export function WorkspaceStageBadge({ etapa }: { etapa: string }) {
  const item = stageInfo(etapa);
  return (
    <StatusBadge tone={item.tone} dot={false}>
      {item.step ? `Etapa ${item.step} de 4 · ${item.label}` : item.label}
    </StatusBadge>
  );
}
