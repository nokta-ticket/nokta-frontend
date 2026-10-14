/** Usuário como devolvido por `GET /admin/usuarios/:id`. */
export interface AdminUser {
  id: number;
  nome: string | null;
  sobrenome: string | null;
  email: string;
  cpf: string | null;
  telefone: string | null;
  dataNascimento: string | null;
  role: string;
  ativo: boolean;
  bloqueado?: boolean;
  bloqueadoMotivo?: string | null;
  nivelProdutor?: number | null;
  qtdIngressos?: number | null;
  qtdCompras?: number | null;
  createdAt?: string | null;
}
