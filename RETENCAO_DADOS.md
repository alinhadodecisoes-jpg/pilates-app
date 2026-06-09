# Política de Retenção de Dados — Daimach.Movement

**Versão:** 1.0  
**Data:** 2026-06-09  
**Responsável:** Administrador do Sistema  
**Base legal:** LGPD (Lei 13.709/2018) — Art. 16 (conservação após o tratamento)

---

## 1. Princípio Geral

O Daimach.Movement retém os dados dos alunos e pacientes por **no mínimo 24 meses** após o encerramento do vínculo, para fins de:
- Continuidade de cuidado (histórico de saúde, lesões, fisioterapia)
- Obrigações legais (registros de saúde, comprovantes de pagamento)
- Defesa em litígios (evidência de atendimento e evolução do aluno)

---

## 2. Regra de "Exclusão" de Aluno

> ⚠️ **NUNCA usar DELETE** em registros históricos de alunos.

Quando um aluno sai do estúdio ou solicita remoção:

```sql
-- CORRETO: soft-delete — marca como inativo, preserva histórico
UPDATE users_pilates SET status = 'inativo' WHERE id = '<user_id>';

-- ERRADO: apaga o aluno e cascateia tudo (PROIBIDO)
-- DELETE FROM users_pilates WHERE id = '<user_id>';
```

O aluno **inativo** não aparece nas listagens operacionais, mas seus dados ficam preservados.

---

## 3. Tabelas com Retenção Obrigatória (24 meses)

| Tabela | Tipo de dado | Retenção mínima |
|--------|-------------|-----------------|
| `payment_history` | Pagamentos e mensalidades | 5 anos (obrigação fiscal) |
| `attendances_pilates` | Histórico de presença | 24 meses |
| `physical_evaluations_pilates` | Avaliações físicas (peso, medidas, fotos) | 24 meses |
| `health_records` | Ficha de saúde (LGPD sensível) | 24 meses após fim do vínculo |
| `physio_cases` | Casos de fisioterapia | 5 anos (prontuário clínico, CFT) |
| `physio_evolutions` | Evoluções SOAP | 5 anos (prontuário clínico, CFT) |
| `bookings` | Reservas de aulas | 12 meses |
| `notifications_log` | Log de notificações | 90 dias |
| `backup_log` | Histórico de backups | Indefinido (metadado) |

---

## 4. Tabelas que PODEM ser limpas

| Tabela | Critério para limpeza |
|--------|----------------------|
| `push_subscriptions` | Token inválido há mais de 6 meses |
| `class_sessions` | Sessões canceladas com mais de 12 meses |
| `bookings` com `status='canceled'` | Após 12 meses |

---

## 5. Dados Sensíveis (LGPD — Dado de Saúde)

As seguintes tabelas contêm dados de saúde (art. 5º, II LGPD — categoria especial):
- `health_records` — ficha de saúde, condições crônicas, medicamentos
- `physical_evaluations_pilates` — medidas corporais, fotos
- `physio_cases` / `physio_evolutions` — prontuário clínico

**Obrigações:**
- Acesso restrito a admin, professor, fisioterapeuta e o próprio aluno
- Consentimento explícito registrado em `health_records.consent_signed`
- Não compartilhar com terceiros sem nova autorização
- Direito de portabilidade: aluno pode solicitar exportação dos próprios dados

---

## 6. Solicitação de Exclusão pelo Titular (LGPD Art. 18)

Quando um aluno solicitar exclusão dos seus dados:

1. Verificar se existem obrigações legais que impeçam a exclusão (contrato, pagamentos pendentes, prontuário clínico)
2. Se não houver impedimento: marcar `status = 'inativo'` + `consent_signed = false` em `health_records`
3. Após 24 meses: pode-se anonimizar os registros (trocar nome/email por dados genéricos, manter estatísticas agregadas)
4. Registrar o pedido e a ação tomada

**Contato do titular:** disponível na política de privacidade em `daimach.com.br/privacidade`

---

## 7. Backup e Segurança

- **Backup semanal automático** para Google Drive (pasta "Daimach Backups" — acesso privado)
- Backup inclui todas as tabelas da seção 3
- Arquivos nomeados: `daimach_backup_YYYY-MM-DD.json`
- Acesso ao Drive restrito ao administrador do estúdio
- Ver painel em: `/admin/backups`

---

## 8. Revisão desta Política

Esta política deve ser revisada:
- A cada 12 meses
- Após mudanças significativas na lei (LGPD, CFT, CFN)
- Após incidentes de segurança

---

> Este documento deve ser mantido atualizado pelo administrador do sistema.
> Para dúvidas: consultar o encarregado de dados (DPO) da Daimach.Movement.
