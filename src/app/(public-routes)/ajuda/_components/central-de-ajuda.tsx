"use client";

import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Bricolage_Grotesque } from "next/font/google";
import {
  ChevronDown,
  ChevronRight,
  HelpCircle,
  Search,
  Send,
  Clock,
  Loader2,
} from "lucide-react";
import api, { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { useAuth } from "@/context/AuthContext";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-bricolage-ajuda",
});

/**
 * Central de Ajuda (/ajuda) — layout portado do HTML de referência enviado
 * pelo usuário (2026-08-19), sem a seção de 5 categorias (Ingressos/
 * Eventos/Pagamento/Conta/Segurança) — removida a pedido do usuário no
 * mesmo dia por ser "desnecessária"/não útil. Substitui o link "Acessar
 * ajuda" (antes só visual, empty-events-state.tsx/onboarding-extras.tsx) e
 * "Fale com suporte" (antes mailto:, header-private.tsx/header-public.tsx/
 * footer.tsx) por uma página real, aberta em nova guia.
 *
 * FAQ revisada contra o comportamento real do backend (não contra o texto
 * do HTML de referência, que tinha itens desatualizados):
 * - Pagamento: só PIX e cartão de crédito parcelado — nunca débito
 *   (payment.service.ts só monta payload pix/credit_card).
 * - Entrega: e-mail confirma a COMPRA (sendPurchaseConfirmation); o QR do
 *   ingresso em si só é enviado por WhatsApp, ~1h antes do evento, depois
 *   do freeze T-70 (qr-delivery.service.ts + scheduler.service.ts) —
 *   nunca por e-mail.
 * - Transferência: não depende de o produtor "habilitar" nada — é uma
 *   regra geral do sistema (1 transferência grátis por ingresso,
 *   destinatário precisa ter conta ativa na Nokta, bloqueada perto do
 *   evento pelo freeze T-70). ticket.service.ts, MAX_TRANSFERS=1.
 * - Reembolso: 7 dias corridos da confirmação do pagamento (não "48h antes
 *   do evento"), condicionado a ingresso não usado/transferido/revendido
 *   (politica-de-cancelamento/page.tsx, fonte de verdade textual já
 *   existente no projeto).
 *
 * Busca do hero (2026-08-19): antes era só visual (input sem onChange nem
 * handler nenhum). Agora filtra as FAQ_ITEMS em tempo real (client-side —
 * não é uma busca contra API, o conteúdo pesquisável da página inteira é a
 * FAQ) e mostra um dropdown de resultados sob o próprio campo; clicar num
 * resultado rola até a FAQ e abre aquele item, sem navegar. Fora do hero, a
 * mesma query também filtra a lista de FAQ renderizada abaixo — as duas
 * UIs (dropdown do hero + lista principal) compartilham o mesmo estado e o
 * mesmo matcher (normalizeForSearch/matchesQuery), nunca duas lógicas de
 * busca divergentes.
 */
export default function CentralDeAjuda() {
  const [query, setQuery] = useState("");
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const faqRef = useRef<HTMLDivElement>(null);

  const filteredIndexes = useMemo(() => {
    if (!query.trim()) return FAQ_ITEMS.map((_, i) => i);
    return FAQ_ITEMS.map((_, i) => i).filter((i) => matchesQuery(FAQ_ITEMS[i], query));
  }, [query]);

  function handleSelectResult(index: number) {
    setQuery("");
    setOpenIndex(index);
    // Espera o filtro (query "") re-renderizar a lista completa antes de
    // rolar — senão o item pode não estar montado ainda no DOM.
    requestAnimationFrame(() => {
      faqRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  return (
    <div className={`${bricolage.variable} bg-[#FAF9FC]`}>
      <Hero query={query} onQueryChange={setQuery} onSelectResult={handleSelectResult} />
      <div className="mx-auto w-full max-w-[1268px] px-4 pb-6 sm:px-6">
        <div className="grid grid-cols-1 gap-8 pt-8 lg:grid-cols-[minmax(0,747fr)_minmax(0,487fr)] lg:items-start lg:gap-8">
          <div>
            <Faq
              ref={faqRef}
              query={query}
              filteredIndexes={filteredIndexes}
              openIndex={openIndex}
              onToggle={(i) => setOpenIndex((cur) => (cur === i ? null : i))}
            />
            <PedidoFaixa />
          </div>
          <FaleConosco />
        </div>
      </div>
    </div>
  );
}

interface HeroProps {
  query: string;
  onQueryChange: (value: string) => void;
  onSelectResult: (index: number) => void;
}

function Hero({ query, onQueryChange, onSelectResult }: HeroProps) {
  const [focused, setFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return FAQ_ITEMS.map((item, i) => ({ item, i })).filter(({ item }) => matchesQuery(item, query));
  }, [query]);

  const showDropdown = focused && query.trim().length > 0;

  // Fecha o dropdown ao clicar fora. Usa "click" (não "pointerdown"/
  // "touchstart") de propósito: o dropdown pode crescer além da altura do
  // hero quando há muitos resultados, então rolar a PÁGINA (não o
  // dropdown) pra ver o resto da lista é um gesto legítimo — um listener em
  // pointerdown/touchstart dispara no instante em que o dedo toca a tela,
  // antes de saber se é um toque ou o início de um arrasto/scroll, e
  // fechava o dropdown no meio da rolagem (bug relatado: "rolo pra baixo...
  // primeiro some"). "click" só dispara depois de um tap real sem
  // deslocamento, nunca durante/ao fim de um scroll por touch.
  useEffect(() => {
    if (!showDropdown) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [showDropdown]);

  return (
    // overflow-hidden fica só no header em si (contém o fundo/gradiente
    // decorativo, que nunca precisa vazar) — nunca deve ser aplicado aqui
    // com o dropdown de busca dentro, senão ele corta o dropdown quando
    // este ultrapassa a altura do header (bug real: card "Dúvidas
    // frequentes" aparecia por cima do dropdown recortado no mobile).
    <header
      className="relative"
      style={{
        background:
          "radial-gradient(560px 320px at 76% 34%, rgba(124,58,237,.45) 0%, rgba(124,58,237,0) 68%), radial-gradient(700px 420px at 52% 0%, rgba(88,44,180,.35) 0%, rgba(88,44,180,0) 70%), linear-gradient(160deg,#120A24 0%,#160C2C 42%,#0D0718 100%)",
      }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden bg-gradient-to-b from-[rgba(6,3,13,0.55)] to-transparent" />

      <div className="relative z-10 mx-auto w-full max-w-[970px] px-4 pb-14 pt-14 sm:px-6 sm:pt-[56px]">
        <nav className="flex items-center gap-2 text-[13.5px] font-medium text-[#9A94AC]">
          <Link href="/" className="hover:text-white/80">Início</Link>
          <ChevronRight size={14} className="opacity-70" />
          <span className="text-[#A78BFA]">Central de Ajuda</span>
        </nav>

        <h1 className="mt-[22px] flex items-center gap-2.5 text-[30px] font-bold tracking-[-0.8px] text-white sm:text-[38px]">
          Central de Ajuda
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#A855F7" className="drop-shadow-[0_0_10px_rgba(168,85,247,0.6)]" aria-hidden="true">
            <path d="M12 1.5c1.35 8.1 3.6 10.35 10.5 11.4C15.6 14.1 13.35 16.35 12 22.5c-1.35-6.15-3.6-8.4-10.5-9.6C8.4 11.85 10.65 9.6 12 1.5Z" />
          </svg>
        </h1>

        <p className="mt-3 max-w-[420px] text-[15.5px] font-normal leading-[27px] text-[#C4BED4]">
          Encontre respostas para as dúvidas mais comuns ou fale com a gente.
        </p>

        <div ref={containerRef} className="relative mt-10 max-w-[600px]">
          <div className="relative h-[52px]">
            <Search size={18} className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-[#8B8598]" />
            <input
              type="text"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              onFocus={() => setFocused(true)}
              placeholder="Buscar por tópicos, dúvidas ou palavras-chave..."
              // text-base (16px) sempre, mesmo em mobile — abaixo de 16px o
              // Safari/iOS dá zoom automático na página inteira ao focar o
              // input (mesmo motivo documentado em menu-view.tsx).
              className="h-full w-full rounded-2xl border border-white/[0.13] bg-white/[0.045] pl-[50px] pr-5 text-base text-[#EDEAF5] outline-none placeholder:text-[#8B8598] transition-colors focus:border-[rgba(167,139,250,0.55)] focus:bg-white/[0.07]"
            />
          </div>

          {showDropdown && (
            <div className="absolute left-0 right-0 top-[60px] z-20 overflow-hidden rounded-2xl border border-white/10 bg-[#1A1130] shadow-[0_20px_44px_-14px_rgba(0,0,0,0.55)]">
              {results.length === 0 ? (
                <p className="px-5 py-4 text-sm text-[#9A94AC]">
                  Nenhuma dúvida encontrada para &quot;{query}&quot;. Tente outra palavra ou fale com a gente.
                </p>
              ) : (
                <ul className="max-h-[50vh] overflow-y-auto overscroll-contain py-2 sm:max-h-[320px]">
                  {results.map(({ item, i }) => (
                    <li key={item.q}>
                      <button
                        type="button"
                        onClick={() => onSelectResult(i)}
                        className="block w-full px-5 py-3 text-left transition-colors hover:bg-white/[0.06]"
                      >
                        <p className="text-sm font-medium text-white">{item.q}</p>
                        <p className="mt-0.5 line-clamp-1 text-xs text-[#9A94AC]">{item.a}</p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

const FAQ_ITEMS = [
  {
    q: "Como comprar ingressos na Nokta Tickets?",
    a: "Escolha o evento, selecione os ingressos, informe seus dados e finalize o pagamento por PIX ou cartão de crédito. Você recebe um e-mail confirmando a compra, e o ingresso fica disponível a qualquer momento em \"Meus ingressos\", dentro da sua conta.",
  },
  {
    q: "Quais as formas de pagamento aceitas?",
    a: "PIX (aprovação quase imediata) e cartão de crédito, com opção de parcelamento conforme as taxas exibidas no checkout. Não trabalhamos com cartão de débito.",
  },
  {
    q: "Como e quando eu recebo meu ingresso?",
    a: "O ingresso já fica disponível em \"Meus ingressos\" assim que o pagamento é confirmado. O QR Code de entrada é enviado por WhatsApp perto da data do evento — não por e-mail — para o número verificado na sua conta, por isso é importante manter telefone e verificação em dia.",
  },
  {
    q: "Posso transferir meu ingresso para outra pessoa?",
    a: "Sim. Cada ingresso pode ser transferido gratuitamente uma vez, direto em \"Meus ingressos\", para o e-mail de outra conta já cadastrada e ativa na Nokta. A transferência fica indisponível perto do horário do evento e não é possível depois que o ingresso já foi utilizado.",
  },
  {
    q: "O que fazer se eu não encontrar meu ingresso?",
    a: "Acesse \"Meus ingressos\" com a conta usada na compra — é sempre a fonte mais atualizada. Confira também se o QR chegou no WhatsApp do número verificado da conta. Se ainda assim não encontrar, fale com a gente pelo formulário ao lado.",
  },
  {
    q: "Como solicitar reembolso ou cancelamento?",
    a: "Você pode cancelar e pedir reembolso total em até 7 dias corridos após a confirmação do pagamento, desde que o ingresso ainda não tenha sido utilizado, transferido ou revendido — sem precisar justificar o motivo. Depois desse prazo, só há reembolso se o evento for cancelado ou em caso de erro do produtor.",
  },
];

function normalizeForSearch(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

function matchesQuery(item: { q: string; a: string }, query: string): boolean {
  const needle = normalizeForSearch(query.trim());
  if (!needle) return true;
  return normalizeForSearch(item.q).includes(needle) || normalizeForSearch(item.a).includes(needle);
}

interface FaqProps {
  query: string;
  filteredIndexes: number[];
  openIndex: number | null;
  onToggle: (index: number) => void;
}

const Faq = forwardRef<HTMLDivElement, FaqProps>(function Faq(
  { query, filteredIndexes, openIndex, onToggle },
  ref,
) {
  return (
    <div
      ref={ref}
      className="scroll-mt-6 rounded-[14px] border border-[#EFEDF6] bg-white px-5 pb-[22px] pt-[34px] shadow-[0_1px_2px_rgba(26,22,48,0.03)] sm:px-7"
    >
      <h2 className="text-xl font-bold tracking-[-0.4px] text-[#1A1630]">Dúvidas frequentes</h2>

      <div className="mt-4">
        {filteredIndexes.length === 0 ? (
          <p className="py-6 text-center text-sm text-[#8A8698]">
            Nenhuma dúvida encontrada para &quot;{query}&quot;. Tente outra palavra ou fale com a gente ao lado.
          </p>
        ) : (
          filteredIndexes.map((i) => {
            const item = FAQ_ITEMS[i];
            const open = openIndex === i;
            return (
              <div key={item.q} className="border-b border-[#F1EFF7] last:border-b-0">
                <button
                  type="button"
                  onClick={() => onToggle(i)}
                  className="flex w-full items-center justify-between gap-4 py-3.5 text-left text-sm font-medium tracking-[-0.1px] text-[#241F3C]"
                  aria-expanded={open}
                >
                  {item.q}
                  <ChevronDown
                    size={16}
                    className={`shrink-0 text-[#9B96AB] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                  />
                </button>
                {open && (
                  <div className="pb-4 text-[13px] leading-[22px] text-[#8A8698]">{item.a}</div>
                )}
              </div>
            );
          })
        )}
      </div>

      <Link
        href="/termos"
        className="mt-4 flex items-center justify-center gap-[9px] text-sm font-semibold text-[#7C3AED]"
      >
        Ver termos e políticas completos
        <span className="flex h-5 w-5 items-center justify-center rounded-[5px] bg-[#F3ECFD]">
          <ChevronRight size={12} strokeWidth={2.4} />
        </span>
      </Link>
    </div>
  );
});

function PedidoFaixa() {
  const { isAuthenticated, isAuthResolved } = useAuth();

  // Deslogado: "Ver meus pedidos" tem que levar pro login (com redirect de
  // volta pra /meus-ingressos), nunca deixar o next/link levar direto pra
  // /meus-ingressos — essa rota sozinha, sem sessão, cai na home da Nokta
  // Tickets em vez de pedir login (comportamento reportado como
  // "equivocado" pelo usuário).
  const href = !isAuthResolved || isAuthenticated
    ? "/meus-ingressos"
    : `/login?redirect=${encodeURIComponent("/meus-ingressos")}`;

  return (
    <div className="mt-[15px] flex flex-col items-start gap-4 rounded-xl border border-[#EFE7FC] bg-[#F5F0FE] p-[22px] sm:flex-row sm:items-center">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#EBE0FC]">
        <HelpCircle size={22} strokeWidth={1.9} className="text-[#7C3AED]" />
      </span>
      <span className="flex-1">
        <h4 className="text-[13.5px] font-semibold text-[#1A1630]">Teve um problema com seu pedido?</h4>
        <p className="mt-[5px] text-xs font-normal leading-[18px] text-[#8A8698]">
          Acesse &quot;Meus ingressos&quot; com a conta usada na compra para ver todos os detalhes do pedido.
        </p>
      </span>
      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full shrink-0 rounded-[9px] border-[1.5px] border-[#D6C4F7] bg-white px-[18px] py-[11px] text-center text-[13px] font-semibold text-[#7C3AED] transition-colors hover:border-[#7C3AED] hover:bg-[#FBF8FF] sm:w-auto"
      >
        Ver meus pedidos
      </Link>
    </div>
  );
}

const ASSUNTOS = [
  { value: "compra_ingressos", label: "Compra de ingressos" },
  { value: "pagamento_estorno", label: "Pagamento e estorno" },
  { value: "minha_conta", label: "Minha conta" },
  { value: "sou_produtor", label: "Sou produtor" },
  { value: "outro", label: "Outro assunto" },
] as const;

function FaleConosco() {
  const [assunto, setAssunto] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    if (!assunto) {
      toast.error("Selecione um assunto.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/support-contact", { assunto, mensagem, email });
      toast.success("Mensagem enviada! Vamos te responder em breve.");
      setAssunto("");
      setMensagem("");
      setEmail("");
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível enviar sua mensagem. Tente novamente."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-[14px] border border-[#EFEDF6] bg-white px-6 pb-[30px] pt-[34px] shadow-[0_1px_2px_rgba(26,22,48,0.03)]">
      <p className="text-[12.5px] font-normal text-[#8A8698]">Ainda não encontrou?</p>
      <h2 className="mt-1 text-[21px] font-bold tracking-[-0.4px] text-[#1A1630]">Fale conosco</h2>
      <p className="mt-[18px] border-l-2 border-[#7C3AED] pl-3.5 text-[12.5px] font-normal leading-[19px] text-[#8A8698]">
        Mande sua mensagem que nossa equipe vai te responder o mais rápido possível.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="mt-[22px]">
          <label htmlFor="ajuda-email" className="block text-xs font-semibold text-[#4A4560]">
            Seu e-mail
          </label>
          <input
            id="ajuda-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            disabled={submitting}
            // text-base (16px): abaixo disso o Safari/iOS dá zoom automático
            // na página ao focar o campo (mesmo padrão de menu-view.tsx).
            className="mt-2 h-11 w-full rounded-[9px] border border-[#E9E6F2] bg-white px-3.5 text-base text-[#241F3C] outline-none transition-shadow placeholder:text-[#9B96AB] focus:border-[#7C3AED] focus:shadow-[0_0_0_3px_rgba(124,58,237,0.1)]"
          />
        </div>

        <div className="mt-[22px]">
          <label htmlFor="ajuda-assunto" className="block text-xs font-semibold text-[#4A4560]">
            Assunto
          </label>
          <div className="relative mt-2">
            <select
              id="ajuda-assunto"
              required
              value={assunto}
              onChange={(e) => setAssunto(e.target.value)}
              disabled={submitting}
              // text-base (16px), mesmo motivo do input de e-mail acima.
              className="h-11 w-full appearance-none rounded-[9px] border border-[#E9E6F2] bg-white px-3.5 pr-10 text-base text-[#9B96AB] outline-none transition-shadow focus:border-[#7C3AED] focus:shadow-[0_0_0_3px_rgba(124,58,237,0.1)]"
            >
              <option value="" disabled>Selecione um assunto</option>
              {ASSUNTOS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <ChevronDown size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9B96AB]" />
          </div>
        </div>

        <div className="mt-[22px]">
          <label htmlFor="ajuda-mensagem" className="block text-xs font-semibold text-[#4A4560]">
            Mensagem
          </label>
          <div className="relative mt-2">
            <textarea
              id="ajuda-mensagem"
              required
              maxLength={1000}
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              disabled={submitting}
              placeholder="Descreva sua dúvida ou problema"
              // text-base (16px), mesmo motivo do input de e-mail acima.
              className="h-28 w-full resize-none rounded-[9px] border border-[#E9E6F2] bg-white p-3.5 pb-6 text-base leading-6 text-[#241F3C] outline-none transition-shadow placeholder:text-[#9B96AB] focus:border-[#7C3AED] focus:shadow-[0_0_0_3px_rgba(124,58,237,0.1)]"
            />
            <span className="pointer-events-none absolute bottom-2.5 right-3 text-[11px] text-[#A9A4B8]">
              {mensagem.length}/1000
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-[22px] flex h-[46px] w-full items-center justify-center gap-2.5 rounded-[9px] bg-[#5B21D8] text-sm font-semibold tracking-[-0.1px] text-white shadow-[0_8px_18px_-8px_rgba(91,33,216,0.55)] transition-all hover:-translate-y-px hover:bg-[#4A18BC] disabled:opacity-60"
        >
          {submitting ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} strokeWidth={1.9} />}
          Enviar mensagem
        </button>
      </form>

      <p className="mt-[22px] flex items-center justify-center gap-[9px] text-[12.5px] font-normal text-[#8A8698]">
        <Clock size={15} strokeWidth={1.8} />
        Tempo médio de resposta: até 24h úteis
      </p>
    </div>
  );
}
