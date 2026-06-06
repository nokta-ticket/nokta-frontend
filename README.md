# Nokta Frontend

Frontend da plataforma Nokta Tickets, construído com Next.js 15, React 19 e App Router.

## Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS 4
- Radix UI
- Axios

## Áreas principais

- catálogo público de eventos;
- login, cadastro e recuperação de senha;
- checkout;
- favoritos;
- revenda pública;
- área do cliente com ingressos;
- painel do produtor;
- painel administrativo.

## Requisitos

- Node.js 18+
- npm
- API do backend acessível

## Configuração

1. Instale as dependências:

```bash
npm install
```

2. Copie `env.example.txt` para `.env` e ajuste os valores:

```env
NEXT_PUBLIC_API_URL="http://localhost:3333/api"
NEXT_PUBLIC_STORAGE_URL="http://localhost:3333/storage"
REVALIDATE_SECRET="change-me"
```

## Rodando localmente

```bash
npm run dev
```

Aplicação padrão:

- `http://localhost:3000`

## Scripts úteis

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Observações importantes

- O frontend depende de `NEXT_PUBLIC_API_URL` para comunicação com a API.
- O helper de mídia aceita URLs absolutas do Supabase e também caminhos relativos compatíveis com `NEXT_PUBLIC_STORAGE_URL`.
- Existe uma rota interna de revalidação em `app/api/revalidate-evento/route.ts` que usa `REVALIDATE_SECRET`.
- O projeto já está com `npm run build` e `npm run lint` funcionando sem etapa interativa.
- Para validar fluxos completos de compra, revenda e email, o backend deve estar rodando com as integrações configuradas.
- Existe workflow de CI em `.github/workflows/ci.yml` para validar lint e build.
