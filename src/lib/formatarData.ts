function toDateParts(value: string): [number, number, number] | null {
  if (!value) return null;
  // Aceita "YYYY-MM-DD" ou ISO completo "YYYY-MM-DDTHH:mm:ss.sssZ"
  const dateOnly = value.split('T')[0];
  const parts = dateOnly.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  return parts as [number, number, number];
}

export function formatarDataBR(dateStr: string): string {
  const parts = toDateParts(dateStr);
  if (!parts) return '';
  const [year, month, day] = parts;
  return new Date(year, month - 1, day).toLocaleDateString('pt-BR');
}

export function formatarDataCurta(dataISO: string): string {
  const parts = toDateParts(dataISO);
  if (!parts) return '';
  const [ano, mes, dia] = parts;
  const data = new Date(ano, mes - 1, dia);
  const formatada = data.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  });
  return formatada.charAt(0).toUpperCase() + formatada.slice(1);
}
