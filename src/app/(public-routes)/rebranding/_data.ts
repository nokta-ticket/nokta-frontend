/**
 * Conteúdo do relatório do rebranding (/rebranding). Capturas em
 * public/rebranding/<id>-m.jpg (celular, 390px) e <id>-d.jpg (desktop, 1440px).
 */
export interface RebrandPage { id: string; name: string; route: string; items: string[] }
export interface RebrandArea { id: string; title: string; lede: string; pages: RebrandPage[] }

export const AREAS: RebrandArea[] = [
  {
    id: "publico",
    title: "Bilheteria pública",
    lede: "O site que o comprador usa (noktatickets.com.br). Sempre escuro, pôster em primeiro lugar, barra de navegação inferior no celular.",
    pages: [
      { id: "home", name: "Home", route: "/", items: ["Desktop: banner grande chamando produtores (arte gerada no Higgsfield: pista com lasers rosa) passando por baixo do header.", "Celular: o banner sai e o topo vira um carrossel grande de destaques, um card por vez com espiada do próximo e pontinhos de posição.", "Cards de evento no desktop inclinam em 3D seguindo o mouse, com brilho rosa e a linha \"Ver ingressos\" que aparece no hover.", "Lista de próximos eventos em linhas no celular e grade no desktop, com \"Carregar mais\" e estado de erro com \"Tentar de novo\"."] },
      { id: "busca", name: "Buscar eventos", route: "/eventos", items: ["Campo de busca grande com debounce, espelhado na URL (?name=).", "Linhas no celular, grade no desktop, estado vazio \"Nenhum rolê com esse nome ainda\".", "Busca rápida no header do desktop (⌘K no Mac, Ctrl K no Windows), com resultados ao vivo e atalhos."] },
      { id: "evento", name: "Página do evento", route: "/evento/[slug]", items: ["Banner na proporção real 818×355, sem cortar a arte.", "Lotes em linhas com preço, taxa e parcelas, stepper de 44px, selos Esgotado/Em breve.", "Cupom, tabela de parcelas em folha inferior, programação em linha do tempo, mapa escuro com \"Como chegar\" (Maps/Waze/Uber/99).", "Celular: barra fixa de compra. Desktop: card de compra fixo à direita.", "Toda a lógica antiga mantida: corte de vendas 2h antes, rastreio de promoter (?ref=), lista VIP, compartilhar."] },
      { id: "vip", name: "Lista VIP", route: "/vip/[slug]", items: ["Card de retirada com estados Aberta/Encerrada/Esgotada/Indisponível.", "Estado \"garantido\" com atalho pro ingresso."] },
      { id: "checkout", name: "Checkout", route: "/evento/[slug]/checkout", items: ["Fluxo focado com header mínimo: resumo, cupom e código de promoter recolhíveis, proteção de compra, Pix ou cartão.", "Reserva com contagem regressiva (alerta quando faltam 2 min), tela do Pix com QR, copia-e-cola e \"aguardando\", cartão com 3DS obrigatório, sucesso com confete.", "Celular: total + botão fixos embaixo. Desktop: resumo fixo à direita.", "Taxas, gross-up do gateway e 3DS preservados; cálculo extraído pra um módulo testado (lib/payment-fees)."] },
      { id: "revenda", name: "Revenda oficial", route: "/revenda", items: ["Lista no estilo Buscar, preço do comprador em destaque e original riscado, filtro por evento, paginação."] },
      { id: "revenda-detalhe", name: "Anúncio de revenda", route: "/revenda/[id]", items: ["Agora público: dá pra ver o anúncio sem login; o login só aparece na compra.", "Pagamento Pix/cartão em folha inferior no celular e diálogo no desktop."] },
    ],
  },
  {
    id: "conta",
    title: "Login e conta do comprador",
    lede: "Telas de entrada nunca ocupam a tela toda: o card abre por cima da página em que a pessoa estava, desfocada, e clicar fora volta.",
    pages: [
      { id: "login", name: "Entrar", route: "/login", items: ["Card sobre a página atual desfocada (rota interceptada). Aberto direto pela URL, mostra a home desfocada atrás.", "Clique fora, Esc ou X fecham. No celular o card sobe de baixo.", "Google/Apple, e-mail e senha, confirmação por código de 6 dígitos quando a conta não foi confirmada.", "Rota protegida sem login agora leva ao login e volta pra onde a pessoa ia (?redirect=). Antes caía na home sem explicação."] },
      { id: "cadastro", name: "Criar conta", route: "/register", items: ["Mesmo card. Formulário → código pelo WhatsApp → pronto.", "Sugestão de e-mail com erro de digitação, força de senha, e-mail já cadastrado avisado no campo."] },
      { id: "recuperar", name: "Recuperar senha", route: "/recuperar-senha", items: ["Mesmo card, mensagem genérica de segurança, troca de senha via link."] },
      { id: "ingressos", name: "Meus ingressos", route: "/meus-ingressos", items: ["Estilo carteira: Próximos/Passados, busca, um card por evento com quantidade de ingressos."] },
      { id: "ingresso", name: "Ingresso", route: "/meus-ingressos/[id]", items: ["Cartão com picote, QR grande em fundo branco (contraste pro leitor), deslize entre ingressos do mesmo pedido.", "Compartilhar, salvar imagem/PDF, transferir; revenda e reembolso em \"Mais opções\"."] },
      { id: "minhas-revendas", name: "Minhas revendas", route: "/minhas-revendas", items: ["Cards com status e cancelamento com confirmação."] },
      { id: "favoritos", name: "Favoritos", route: "/favoritos", items: ["Mesmos cards da busca, remoção otimista com desfazer em caso de erro."] },
      { id: "perfil", name: "Perfil", route: "/perfil", items: ["Dados e endereço com ViaCEP, troca de foto com recorte redondo, \"Sair da conta\"."] },
    ],
  },
  {
    id: "institucional",
    title: "Institucional e páginas legais",
    lede: "Conteúdo com os dados reais da empresa (Nokta Tecnologia Ltda., CNPJ 59.386.582/0001-39, Av. Paulista 1471) num só lugar: src/lib/company.ts.",
    pages: [
      { id: "institucional", name: "Site nokta.live", route: "/institucional", items: ["Hero com título em display, seções pra produtores e pra bares, números, perguntas frequentes e rodapé com razão social, CNPJ e endereço.", "Continua estática (cache de 60s), sem chamada de API."] },
      { id: "para-produtores", name: "Para produtores", route: "/para-produtores", items: ["Versão enxuta da chamada pra produtores dentro do site de ingressos."] },
      { id: "ajuda", name: "Central de ajuda", route: "/ajuda", items: ["Categorias, perguntas frequentes e formulário de contato com o e-mail de suporte visível."] },
      { id: "termos", name: "Termos, privacidade e cancelamento", route: "/termos · /privacidade · /politica-de-cancelamento", items: ["Leitura confortável com índice, data de atualização e identificação da empresa no topo. Texto legal original mantido.", "Política de cancelamento e termos da bilheteria agora abrem sem login (estavam bloqueados pro visitante)."] },
    ],
  },
  {
    id: "painel",
    title: "Painel do produtor",
    lede: "app.nokta.live. Sidebar escura com o item ativo em degradê rosa, topbar sólida, claro e escuro (escuro por padrão). No celular, a navegação abre numa gaveta e toda lista vira cards.",
    pages: [
      { id: "dash-inicio", name: "Início", route: "/dashboard/inicio", items: ["Saudação, pendências em alerta, 3 números do período, desempenho financeiro e checklist.", "Período Hoje/7 dias/30 dias/Personalizado na topbar; alternância claro/escuro."] },
      { id: "dash-explorar", name: "Explore a Nokta", route: "/dashboard/explorar", items: ["Grade de recursos com status (Ativa/Disponível/Necessária), ativar em lote e desativar com confirmação."] },
      { id: "dash-onboarding", name: "Primeiros passos", route: "/dashboard/onboarding", items: ["Etapas no topo, um card por etapa, botões Voltar/Continuar fixos no celular. Progresso salvo como antes."] },
      { id: "dash-eventos", name: "Eventos", route: "/dashboard/eventos", items: ["3 números, busca, Ativos/Rascunhos/Todos, cards de evento com barra de vendas e ações."] },
      { id: "dash-criar", name: "Criar evento", route: "/dashboard/eventos/criar", items: ["Assistente em 4 etapas (informações, detalhes, ingressos, imagens) com busca de CEP e recorte do banner 818×355."] },
      { id: "dash-editor", name: "Editor do evento", route: "/dashboard/eventos/[id]", items: ["Cabeçalho com status, ver página, publicar/despublicar; seções em abas que rolam no celular.", "Lotes agrupados com edição em gaveta, listas VIP com link copiável, cupons, equipe."] },
      { id: "dash-vendas", name: "Vendas do evento", route: "/dashboard/eventos/[id]?tab=vendas", items: ["Números de faturamento, gráfico de vendas por dia e pedidos recentes com status."] },
      { id: "dash-convidados", name: "Convidados", route: "/dashboard/convidados", items: ["Cortesias por evento, convite por e-mail, status de envio do QR."] },
      { id: "dash-promotores", name: "Promotores", route: "/dashboard/promotores", items: ["Abas promotores, atribuições, vendas e acertos; convite e atribuição em diálogo."] },
      { id: "dash-crm", name: "CRM", route: "/dashboard/crm", items: ["Contatos com filtros (painel lateral no desktop, gaveta no celular), públicos, campanhas, modelos e canais."] },
      { id: "dash-fin-tickets", name: "Financeiro (ingressos)", route: "/dashboard/financeiro", items: ["Saldo disponível, em custódia, saque em andamento e contestações; extrato, saques com verificação extra mantida.", "Quando a organização também tem bar, alterna entre Ingressos e Bar e restaurante."] },
      { id: "dash-insights-tickets", name: "Insights (ingressos)", route: "/dashboard/insights", items: ["Ingressos vendidos, disponíveis, arrecadação, eventos e gráfico mensal."] },
      { id: "dash-equipe", name: "Equipe", route: "/dashboard/equipe", items: ["Membros e convites, ações na própria linha, detalhe do membro em gaveta com papel e permissões."] },
      { id: "dash-config", name: "Configurações", route: "/dashboard/configuracoes", items: ["Abas organização, perfil, jurídico e financeiro (cadastro de recebedor com etapas), unidades, horários, integração com o Claude."] },
      { id: "check-in", name: "Check-in na portaria", route: "/dashboard/check-in", items: ["Tela escura focada na câmera, resultado grande verde/vermelho, histórico das leituras. Pareamento de aparelho mantido."] },
    ],
  },
  {
    id: "bar",
    title: "Bar e restaurante",
    lede: "O módulo de operação da casa. Pensado pro celular do garçom e do caixa: toques grandes, gavetas de baixo, nada escondido em menus.",
    pages: [
      { id: "venue-inicio", name: "Início do bar", route: "/dashboard/inicio", items: ["Faturamento do dia, comandas abertas, reservas, alertas de estoque e atalhos (nova reserva, abrir comanda)."] },
      { id: "venue-operacao", name: "Mesas e comandas", route: "/dashboard/operacao", items: ["Mesas em grade com status, filtro por área, comanda em gaveta, novo pedido com variação e adicionais, pagamento com troco."] },
      { id: "venue-pedidos", name: "Pedidos e preparo", route: "/dashboard/operacao/pedidos", items: ["Fila por status (colunas no desktop, lista no celular), novos pedidos pulsando."] },
      { id: "venue-caixa", name: "Caixa", route: "/dashboard/operacao/caixa", items: ["Abertura, esperado, contado e diferença; movimentações e fechamento."] },
      { id: "venue-reservas", name: "Reservas", route: "/dashboard/reservas", items: ["Agenda do dia por horário, lista, fila de espera, disponibilidade com sugestão de mesas."] },
      { id: "venue-avaliacoes", name: "Avaliações", route: "/dashboard/avaliacoes", items: ["Notas por critério, reclamação principal, marcar como resolvida."] },
      { id: "venue-cardapio", name: "Cardápio", route: "/dashboard/cardapio", items: ["Capa e logo, publicar, compartilhar e QR; produtos, categorias (arrastar pra ordenar), adicionais e estações.", "Prévia ao vivo numa moldura de celular ao lado (no celular, botão \"Ver prévia\")."] },
      { id: "venue-estoque", name: "Estoque", route: "/dashboard/estoque", items: ["Itens em alerta, valor em estoque, compras; reposição pendente, itens com barra de nível, compras, movimentações, inventário e fornecedores."] },
      { id: "venue-financeiro", name: "Financeiro do bar", route: "/dashboard/financeiro", items: ["Caixa ou competência, receitas, resultado, contas a pagar, conciliação por dia e relatório de fechamento de caixa."] },
      { id: "venue-insights", name: "Insights do bar", route: "/dashboard/insights", items: ["Vendas, operação, produtos, reservas, estoque e financeiro, com agrupamento automático pelo período."] },
      { id: "venue-setup", name: "Configuração guiada", route: "/dashboard/venue/onboarding", items: ["Etapas sobre, estrutura, cardápio, equipe, preferências e revisão."] },
      { id: "cardapio-publico", name: "Cardápio público", route: "/cardapio/[slug]", items: ["O que o cliente vê pelo QR da mesa: capa e logo da casa, abas Cardápio/Tabacaria, destaques, itens com foto e preço, favoritos."] },
      { id: "avaliacao-publica", name: "Avaliação pública", route: "/avaliacao/[slug]", items: ["Gostei/Não gostei, notas por critério, WhatsApp e consentimento de novidades."] },
      { id: "home-bar", name: "Página da casa", route: "/[slug]", items: ["Logo, capa, aberto agora, horários, comodidades e links. Agora abre também em localhost pra teste."] },
    ],
  },
  {
    id: "admin",
    title: "Administração Nokta",
    lede: "Painel interno da equipe Nokta, no mesmo vocabulário do painel do produtor.",
    pages: [
      { id: "admin-dashboard", name: "Dashboard", route: "/admin/dashboard", items: ["Usuários, eventos, ingressos vendidos e receita; gráfico mensal; atalhos."] },
      { id: "admin-usuarios", name: "Usuários", route: "/admin/usuarios", items: ["Lista com busca e filtros, cards no celular; detalhe com dados, compras, ingressos, segurança e auditoria."] },
      { id: "admin-workspaces", name: "Organizações", route: "/admin/workspaces", items: ["Status, módulos ativos, taxas e bloqueio."] },
      { id: "admin-evidencias", name: "Nokta Protect", route: "/admin/evidencias", items: ["Investigação de ingresso em seções recolhíveis, veredito e download do dossiê."] },
    ],
  },
];
