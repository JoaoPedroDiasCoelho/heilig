# Forma — Next.js

Migração do `loja-oversized-v3.html` para Next.js App Router + TypeScript.

## Rodar

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`.

## Estrutura

- `app/` — página e estilos globais
- `components/Storefront.tsx` — storefront interativo
- `lib/products.ts` — catálogo e tamanhos
- `lib/frames.ts` — frames da animação
- `public/frames/` — 48 frames WebP da camiseta
- `public/products/` — imagens dos 6 produtos

## Catálogo PostgreSQL

O catálogo da home, as páginas de produto e o sitemap leem `public.products` no servidor.
Para ativar o banco:

1. Configure `DATABASE_URL` em `.env.local` (local) ou como variável privada no provedor de deploy. Não use o prefixo `NEXT_PUBLIC_` nem coloque credenciais no Git.
2. Aplique [`db/schema.sql`](db/schema.sql) no banco PostgreSQL.
3. Reinicie o servidor para carregar a configuração.

Se `DATABASE_URL` estiver ausente ou a consulta falhar, o site mantém o catálogo local de `lib/products.ts` como fallback. O pool de conexões é limitado para uso em servidor.

## Administração

O painel fica em `/admin`. Administradores podem cadastrar, editar, ocultar e remover camisas; também podem criar, editar, desativar e remover usuários. Editores podem gerenciar produtos, mas não usuários.

1. Configure `DATABASE_URL` para o PostgreSQL e execute `db/admin-schema.sql` uma vez nesse banco.
2. Para criar o primeiro administrador, preencha `ADMIN_NAME`, `ADMIN_EMAIL` e `ADMIN_PASSWORD` em `.env.local` (senha com no mínimo 12 caracteres) e execute `npm run admin:create`.
3. Remova as três variáveis de provisionamento após criar a conta. O comando não altera contas existentes.
4. Acesse `/admin/login`. As sessões usam cookie HTTP-only e expiram após 8 horas; tentativas de login por e-mail são bloqueadas por 15 minutos após cinco erros.

As imagens dos produtos podem usar um caminho local, como `/products/camisa.jpg`, ou uma URL HTTP(S). Para arquivos versionados junto ao projeto, coloque-os em `public/products/`.

### Upload e galeria de imagens

O envio de fotos do admin usa o Cloudinary, com uploads assinados pelo servidor. Configure `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` e `CLOUDINARY_API_SECRET` como variáveis privadas do ambiente (nunca use `NEXT_PUBLIC_` para a chave secreta).

1. Execute `db/product-images.sql` no PostgreSQL depois de aplicar `db/schema.sql`. A migração cria a galeria e registra a imagem atual de cada camisa como destaque.
2. Salve a camisa e, na tela de edição, envie até 10 imagens de cada vez. São aceitos JPG, PNG, WebP e AVIF de até 10 MB por arquivo.
3. Use “Definir como destaque” para escolher a foto exibida na vitrine. As imagens restantes aparecem em um carrossel na página de detalhes.

Os arquivos são enviados diretamente ao Cloudinary usando uma assinatura temporária criada no servidor. O banco guarda as URLs e identificadores necessários para remover os arquivos quando as imagens ou o produto forem excluídos.

### Destaques e catálogo de produtos

Depois de aplicar `db/schema.sql`, execute `db/admin-schema.sql`, `db/product-images.sql` e `db/product-catalog.sql` uma vez no mesmo PostgreSQL. A migração de catálogo adiciona os campos de destaque e categoria. Os produtos existentes começam em destaque, preservando a home atual; produtos novos podem ser classificados como camisa, boné ou moletom no admin.

O interruptor “Destaque” do admin controla os produtos mostrados na home. A página `/produtos` mostra todos os produtos ativos, incluindo os que também estão em destaque na home, e permite filtrar por faixa de preço, cor e tipo. Ativar um produto e destacá-lo são opções separadas; para aparecer na loja, ele precisa estar ativo e ter imagem.

## WhatsApp

O número está centralizado em `components/Storefront.tsx` na constante `WHATSAPP_NUMBER`.
Troque pelos dígitos do WhatsApp real da loja antes do deploy.

## Deploy

O projeto está preparado para deploy como aplicação Next.js, por exemplo na Vercel.

### Diagnóstico do banco no deploy

Depois do deploy, abra `/api/health/database` no domínio da aplicação para verificar se o PostgreSQL está acessível e se as tabelas e migrações necessárias estão prontas. A resposta não expõe credenciais. Se faltar uma migração, o endpoint informa o arquivo SQL correspondente; se a conexão falhar, consulte as variáveis de ambiente e os logs de funções no painel da Vercel.
