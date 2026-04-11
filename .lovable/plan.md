
# Catálogo de Profissionais — Mobile-First

## Visão Geral
Plataforma mobile-first em tons de rosa e branco para catálogo de profissionais de um grupo fechado, com painel admin completo usando Supabase (Lovable Cloud).

---

## 1. Banco de Dados (Supabase)
- **professionals** — nome, empresa, logo, segmento, especialidades (tags), serviços, localização, horário, whatsapp, instagram, vantagem/promoção, descrição
- **professional_photos** — galeria/portfólio de cada profissional
- **events** — carrossel de eventos com imagens e ordem de exibição
- **event_images** — imagens dos eventos
- **notifications** — alertas do sistema (novidades, eventos, promoções)
- Storage buckets para uploads de fotos

## 2. Identidade Visual
- Paleta rosa (#E91E63 / #F48FB1 / #FCE4EC) + branco
- Layout 100% mobile (max-width ~430px centralizado)
- Tipografia moderna, cards arredondados, sombras suaves

## 3. Página Inicial (Home)
- **Header**: logo placeholder (esquerda) + ícone de perfil (direita, sem funcionalidade) + ícone de sino (notificações)
- **Barra de pesquisa**: filtra profissionais por segmento em tempo real
- **Carrossel de eventos**: galeria swipeable com imagens do admin
- **Catálogo de profissionais**: cards com foto, nome, segmento (destaque), especialidades (tags), descrição curta

## 4. Página de Perfil do Profissional
- Header com foto/logo, nome da empresa, proprietário
- Segmento destacado + tags de especialidades
- Seções: Serviços, Localização, Vantagem/promoção, Horário de funcionamento
- Botões de contato: WhatsApp + Instagram
- Galeria/portfólio em grid

## 5. Sistema de Notificações
- Ícone de sino no header com badge de contagem
- Dropdown/página com lista de notificações

## 6. Painel Administrativo
- Rota `/admin` com telas para:
  - CRUD de profissionais (incluindo upload de fotos e portfólio)
  - CRUD de eventos (upload de imagens, definir ordem)
  - Enviar notificações
- Interface simples, sem autenticação por enquanto (preparado para futuro)
