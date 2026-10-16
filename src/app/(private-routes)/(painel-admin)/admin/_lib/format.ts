/** Formatadores do painel admin: datas ISO completas (com hora) em pt-BR. */

export function formatDateTime(value?: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function formatDate(value?: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

/** Data de nascimento e afins: só a data, sem deslocar pelo fuso. */
export function formatDateUTC(value?: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

/** "YYYY-MM-DD" pra `<input type="date">`. */
export function toDateInput(value?: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
}

export function fullName(nome?: string | null, sobrenome?: string | null, fallback = "Sem nome"): string {
  return `${nome ?? ""} ${sobrenome ?? ""}`.trim() || fallback;
}

export function initialsOf(nome?: string | null, sobrenome?: string | null): string {
  const a = (nome ?? "").trim()[0] ?? "";
  const b = (sobrenome ?? "").trim()[0] ?? "";
  return `${a}${b}`.toUpperCase() || "?";
}

export function formatCPF(cpf?: string | null): string {
  if (!cpf) return "";
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return cpf;
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

export function formatPhone(phone?: string | null): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "");
  if (digits.length === 11) return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  if (digits.length === 10) return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  return phone;
}
