# CronWhats

Aplicação Next.js para criar mensagens com IA e enviá-las diariamente pelo WhatsApp no horário definido.

## O que já está incluído

- login único configurado por variáveis de ambiente;
- conexão com WhatsApp Web por QR Code e sessão persistente;
- agendamentos diários com fuso horário;
- geração de uma mensagem nova pela API da OpenAI;
- histórico do último envio/erro;
- SQLite persistente;
- Docker Compose para VPS.

## Rodar localmente

Requer Node.js 22 ou superior.

```bash
cp .env.example .env
npm install
npm run dev
```

Abra `http://localhost:3000`, entre com as credenciais do `.env` e leia o QR Code em **WhatsApp > Aparelhos conectados > Conectar aparelho**.

## Publicar na VPS

1. Instale Docker e Docker Compose.
2. Envie o projeto para a VPS.
3. Copie `.env.example` para `.env` e configure senhas fortes e a chave da OpenAI.
4. Execute:

```bash
docker compose up -d --build
```

Os dados ficam nos diretórios `data/` e `whatsapp-session/`. Faça backup deles. Em produção, coloque Nginx ou Caddy na frente do serviço com HTTPS e não exponha a porta 3000 diretamente à internet.

## Como o envio funciona

O processo verifica os agendamentos a cada 15 segundos. Ao chegar ao minuto programado no fuso escolhido, ele reserva aquela execução no SQLite, solicita uma mensagem nova à OpenAI e envia pelo WhatsApp. A chave diária/minuto impede envios duplicados mesmo que o processo verifique várias vezes.

## Limitações e cuidados

Este MVP usa `whatsapp-web.js`, que automatiza o WhatsApp Web e **não é uma API oficial da Meta**. A conta pode ser desconectada ou sofrer restrições. Evite spam, obtenha consentimento dos destinatários e use volumes persistentes para não precisar ler o QR Code após cada deploy.

A API oficial do WhatsApp Business é mais estável, porém mensagens iniciadas fora da janela de atendimento precisam usar templates previamente aprovados. Por isso, textos totalmente novos gerados por IA não podem ser enviados livremente nesse cenário.
