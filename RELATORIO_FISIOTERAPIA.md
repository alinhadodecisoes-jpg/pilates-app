# RELATÓRIO — TAREFA 1: FISIOTERAPIA
**Data:** 2026-06-10

## Problema
- Páginas de fisioterapia (`/admin/fisioterapia` e `/fisioterapeuta/pacientes`) liam direto do Supabase pelo navegador → **bloqueadas por RLS** (dropdown de paciente vazio).
- O dropdown só carregava `role='aluno'` → **não dava para cadastrar/atender quem faz só fisioterapia**.

## O que foi feito
### Nova API `/api/pilates/fisioterapia` (service role)
- `GET` → `cases` (prontuários + nº evoluções), `sessions`, `patients`, `therapists`.
- `patients` = **alunos de pilates + pacientes só-fisio** (`is_physio_patient=true`), cada um com `tipo`: `pilates` | `fisio` | `ambos`.
- `POST action=create_patient` → 3 modos:
  - **vincular existente** (`existing_user_id`) → marca aluno como paciente de fisio;
  - **novo com login** (`create_login` + email + senha) → cria conta no Auth;
  - **novo sem login** → só prontuário (não acessa o app).
- `POST create_case` / `create_session` / `update_session`; `DELETE ?sessionId=`.

### Páginas religadas à API
- `/fisioterapeuta/pacientes`: prontuários via API; dropdown mostra todos os pacientes com rótulo (só fisio / pilates+fisio); botão **+ Novo Paciente** (só-fisio ou ambos, com/sem login).
- `/admin/fisioterapia`: sessões via API; mesmo dropdown; botão **+ Novo Paciente**.

### Isolamento de contagem
Pacientes **só-fisio** (`is_pilates_student=false`) foram **excluídos** de:
`/api/pilates/alunos`, `/api/pilates/stats`, `/api/pilates/financeiro`, e da lista de matrícula de turmas.
→ Assim eles não inflam o número de "alunos de pilates".

## Testes (verificados no dev server)
| Teste | Resultado |
|---|---|
| Listar fisioterapia (pacientes + terapeutas) | ✅ 76 pacientes, 2 terapeutas |
| Criar paciente **só-fisio** | ✅ aparece em fisio (tipo=fisio), **não** em alunos pilates (75 continua 75) |
| Criar paciente **ambos** | ✅ aparece em **alunos pilates E fisio** (tipo=ambos) |
| stats total_alunos | ✅ não inflado (75) |
| Páginas `/fisioterapeuta/pacientes` e `/admin/fisioterapia` | ✅ HTTP 200 |
| Typecheck | ✅ sem erros |

## Observação
Pacientes só-fisio são criados como `role='aluno'` + `is_pilates_student=false` + `is_physio_patient=true` (assim podem ter prontuário e, se quiser, login — sem contar como aluno de pilates).

## Status
✅ Tarefa 1 concluída e verificada. Próximo: **Tarefa 2 — Segurança do App**.
