export function formatarCPF(cpf: string): string {
  const digits = cpf.replace(/\D/g, '').padStart(11, '0')
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}
