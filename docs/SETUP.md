# Pilates App — Guia de Setup

## Pré-requisitos

- Node.js 20+
- npm 10+
- Android Studio (para build mobile)

---

## 1. Instalar dependências

```powershell
cd C:\Users\willa\pilates-app
npm install
```

---

## 2. Configurar variáveis de ambiente

Copie `.env.local` e preencha com suas chaves reais:

```env
NEXT_PUBLIC_SUPABASE_URL=https://qgqzbfyvhhnptmfgjpnd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

RESEND_API_KEY=re_...

NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...

NEXT_PUBLIC_SITE_URL=https://daimach.com.br/pilates
CRON_SECRET_KEY=...
```

---

## 3. Criar as tabelas no Supabase

1. Acesse [app.supabase.com](https://app.supabase.com/project/qgqzbfyvhhnptmfgjpnd)
2. Vá em **SQL Editor**
3. Cole e execute o conteúdo de `sql/pilates_schema.sql`

---

## 4. Rodar em desenvolvimento

```powershell
npm run dev
```

Acesse: `http://localhost:3000`

---

## 5. Build de produção

```powershell
npm run build
npm run start
```

---

## 6. Sincronizar com Android (Capacitor)

```powershell
npm run build
npx cap sync android
```

Depois abra no Android Studio e faça o build do APK.

---

## 7. Instalar APK no celular (via ADB)

```powershell
C:\Users\willa\AppData\Local\Android\Sdk\platform-tools\adb install -r android\app\build\outputs\apk\debug\app-debug.apk
```

---

## Rotas disponíveis

| Rota | Descrição |
|------|-----------|
| `/` | Landing page |
| `/login` | Login com email ou Google |
| `/register` | Cadastro de novo aluno |
| `/admin/dashboard` | Painel administrativo |
| `/admin/alunos` | CRUD de alunos |
| `/admin/turmas` | Grade de turmas |
| `/admin/planos` | Gestão de planos |
| `/aluno/dashboard` | Painel do aluno |
| `/aluno/minhas-aulas` | Aulas agendadas |
| `/aluno/reposicoes` | Marcar reposições |
| `/aluno/evolucao` | Avaliações físicas |

---

## Tabelas do Banco (Supabase)

- `users_pilates` — Perfis com roles: admin, professor, aluno
- `plans_pilates` — Planos de mensalidade
- `classes_pilates` — Grade de turmas
- `enrollments_pilates` — Matrículas fixas
- `attendances_pilates` — Presenças e reposições
- `subscriptions_pilates` — Assinaturas Stripe
- `physical_evaluations_pilates` — Avaliações físicas
