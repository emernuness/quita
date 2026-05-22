# Devils Advocate — Auditoria v2 do Bridge OCR Premium

> **Modo:** Estratégia
> **Escopo auditado:** `BRIDGE_OCR_PREMIUM.md` (v1) + `BRIDGE_OCR_PATCH_v1_1_FINAL.md` (§14 normativa)
> **Versão anterior:** REPROVADO em 17/05/2026, com 2 bloqueadores + 7 altos + 3 médios
> **Data desta auditoria:** 17/05/2026, pós-ciclo adversarial
> **Mantra:** *"Se não sobreviver ao meu interrogatório, não merece produção."*

---

## Veredito final

# ✅ APROVADO

Os 2 bloqueadores foram resolvidos com **especificação executável** — endpoint dedicado de confirmação completo (route + DTO + service logic + regras de segurança) e HEIC removido com mensagem específica. Os 7 altos têm implementação concreta. Os 3 médios viraram itens operacionais documentados. A decisão C1 do @product (Data Export inclui imagens OCR via signed URLs) atende exigência LGPD art. 18 V.

Detectei **5 pendências menores** durante esta re-auditoria. Padrão consistente das auditorias finais: documentos densos sempre revelam detalhes finos sob lente adversarial. Nenhuma invalida a aprovação; todas viram tarefas pequenas (~30min cada) para a Fase 5 ou para a primeira implementação real do Bridge.

O Quita está liberado para **Fase 5 — Telas Web (Next.js)**.

---

## Dossiê de evidências dos 2 bloqueadores

### BL-1 — Fluxo de confirmação manual

✅ **PASSOU**

Evidência material no Patch v1.1:
- §14.1 Endpoint dedicado `POST /api/v1/settlements/validate-from-image/confirm` definido
- DTO `ConfirmFromImageDto` com validações Zod completas
- Lógica do service com 3 regras explícitas: ownership do objectKey, quota NÃO recontada, consent guard aplicado
- `ocrContext` passado adiante para persistir auditoria no `SettlementEvaluation`

### BL-2 — HEIC

✅ **PASSOU**

Evidência material:
- §14.2 Tipos aceitos reduzidos a 3 (JPEG, PNG, WebP)
- `image/heic` removido do `fileFilter`
- Mensagem de erro específica para usuários iPhone explicando setting "Mais Compatível"
- Reavaliação pós-MVP registrada (limite 5% de tentativas HEIC)

---

## Dossiê dos 7 altos

| # | Alto | Resolução | Status |
|---|---|---|---|
| A-1 | `ocrImageUrl` deveria ser `ocrObjectKey` | §14.3 — renomeado; signed URL gerada sob demanda com TTL parametrizável | ✅ |
| A-2 | Setup do bucket não documentado | §14.4 — Migration 15 com `INSERT INTO storage.buckets` (executa no `prisma migrate deploy`) | ✅ |
| A-3 | Race condition em quota | §14.5 — `OcrQuotaGuard` com `FOR UPDATE` na User serializando per-user | ✅ |
| A-4 | `OcrCleanupJob` lista bucket inteiro | §14.11 — implementação atual documentada + tarefa pós-MVP (SQL direto se > 50k objetos) | ✅ |
| A-5 | Versão do consentimento sem estratégia | §14.12 — constante `CONSENT_VERSIONS` + política de re-consentimento para mudanças materiais | ✅ |
| A-6 | Data Export sem imagens OCR | §14.7 — `DataExportService` inclui últimos 30 dias com signed URLs TTL 7 dias (LGPD art. 18 V) | ✅ |
| A-7 | Signed URL TTL 5min apertado | §14.6 — TTL 15min para modal, 7 dias para data export | ✅ |

---

## Dossiê dos 3 médios

| # | Médio | Resolução |
|---|---|---|
| M-1 | Env vars OPENAI/Supabase não listadas | §14.8 — 5 env vars novas com validação Zod no `envSchema` da Fase 4 |
| M-2 | Métricas de custo "manuais" | §14.9 — `OcrCostReportJob` mensal com log estruturado pronto para dashboard |
| M-3 | PII em imagem só com aviso fraco | §14.10 — cláusula 6 explícita no consentimento + tarefa pós-MVP de detecção automática |

---

## Novas pendências menores detectadas (não invalidam aprovação)

### NM-1 — `validator.validateInternal` mencionado mas não especificado

**Sintoma.** §14.1 chama `this.validator.validateInternal({ ..., ocrContext })`. Mas:
- A Fase 3 v1.1 define `validator.validate()` (sem `Internal`)
- `validateInternal` é referenciado mas não declarado

**Solução.** Renomear `validate()` para `validateInternal()` (método compartilhado) e criar um wrapper público `validate()` que chama o internal sem `ocrContext`:

```typescript
async validate(input: SettlementValidatorInput): Promise<SettlementValidatorOutput> {
  return this.validateInternal({ ...input, ocrContext: undefined });
}

async validateInternal(input: SettlementValidatorInput & { ocrContext?: OcrContext }) {
  // ... lógica completa, persiste OCR fields se ocrContext presente
}
```

**Custo de correção.** ~10min na implementação real.

---

### NM-2 — `OcrConsentGuard` mencionado mas não definido

**Sintoma.** §14.1 usa `@UseGuards(JwtAuthGuard, OcrConsentGuard)`. Mas o `OcrConsentGuard` (separado do `OcrQuotaGuard`) não foi especificado.

**Solução.** Definir:

```typescript
// modules/settlement-validator/guards/ocr-consent.guard.ts
@Injectable()
export class OcrConsentGuard implements CanActivate {
  constructor(private readonly consentRepo: ConsentLogRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const userId = req.user.id;

    const latest = await this.consentRepo.findLatestForUser(
      userId,
      'ocr_data_processing',
    );

    if (!latest || !latest.accepted) {
      throw new ForbiddenException('consent_required');
    }
    return true;
  }
}
```

Diferente do `OcrQuotaGuard`: verifica apenas consentimento (não plano, não quota). Usado no `confirm` (quota já contou no upload).

**Custo de correção.** ~15min.

---

### NM-3 — Endpoint para refresh de signed URL não especificado

**Sintoma.** §14.6 menciona: "Frontend, se receber 403 na signed URL (expirou enquanto usuário lia/editava), chama endpoint específico para gerar nova URL". Esse endpoint não foi definido.

**Solução proposta.**

```typescript
@Post('ocr/refresh-signed-url')
@UseGuards(JwtAuthGuard, OcrConsentGuard)
@Throttle({ default: { limit: 10, ttl: 60_000 } })
async refreshSignedUrl(
  @CurrentUser() user,
  @Body() dto: { ocrObjectKey: string },
): Promise<{ signedUrl: string; expiresAt: string }> {
  // Verificar ownership
  if (!dto.ocrObjectKey.startsWith(`${user.id}/`)) {
    throw new ForbiddenException('object_not_owned');
  }

  const signedUrl = await this.ocrService.generateSignedUrl(dto.ocrObjectKey, 900);
  return {
    signedUrl,
    expiresAt: addMinutes(new Date(), 15).toISOString(),
  };
}
```

Frontend chama isso quando detecta 403 na signed URL.

**Custo de correção.** ~20min.

---

### NM-4 — Backend não retorna `expiresAt` da signed URL

**Sintoma.** Os retornos do `validate-from-image` e `validate-from-image/confirm` incluem `imageSignedUrl` mas não dizem **quando** essa URL expira. Frontend precisa adivinhar (TTL 15min hardcoded no cliente).

Resultado: se o backend mudar TTL no futuro, frontend pode ficar dessincronizado.

**Solução.** Retornar `expiresAt` ISO string junto:

```typescript
{
  // ...
  imageSignedUrl: string,
  imageSignedUrlExpiresAt: string, // ISO 8601
}
```

Frontend agenda refresh ~2min antes de expirar.

**Custo de correção.** ~5min.

---

### NM-5 — `findManyForExport` no `settlementRepo` mencionado mas não existe

**Sintoma.** §14.7 chama `this.settlementRepo.findManyForExport({ userId, usedOcr, evaluatedAt })`. Esse método não está declarado nas Fases anteriores.

**Solução.** Adicionar ao `SettlementEvaluationRepository`:

```typescript
async findManyForExport(filter: {
  userId: string;
  usedOcr?: boolean;
  evaluatedAt?: { gte?: Date; lte?: Date };
}): Promise<SettlementEvaluation[]> {
  return this.prisma.settlementEvaluation.findMany({
    where: {
      userId: filter.userId,
      ...(filter.usedOcr !== undefined && { usedOcr: filter.usedOcr }),
      ...(filter.evaluatedAt && { evaluatedAt: filter.evaluatedAt }),
      invalidatedAt: null, // só não invalidadas
    },
    orderBy: { evaluatedAt: 'desc' },
  });
}
```

Trivial. Patch implícito que precisa ser explicitado na implementação.

**Custo de correção.** ~10min.

---

## Comparativo das 7 auditorias

| Auditoria | Bloq | Altos | Médios | Veredito |
|---|---|---|---|---|
| Fases 1 e 2 v1 | 4 | 4 | 1 | 🔴 |
| Fases 1 e 2 v2 | 0 | 0 | 0 | ✅ |
| Fase 3 v1 | 4 | 7 | 4 | 🔴 |
| Fase 3 v1.1 | 0 | 0 | 0 (4 NM) | ✅ |
| Fase 4 v1 | 4 | 7 | 4 | 🔴 |
| Fase 4 v1.1 | 0 | 0 | 0 (6 NM) | ✅ |
| Bridge OCR v1 | 2 | 7 | 3 | 🔴 |
| **Bridge OCR v1.1** | **0** | **0** | **0 (5 NM)** | ✅ **APROVADO** |

O Bridge fechou tudo da auditoria anterior. As 5 NMs detectadas agora são **detalhes de implementação** — falta de especificação explícita de métodos auxiliares (`validateInternal`, `OcrConsentGuard`, `findManyForExport`, endpoint refresh, `expiresAt`). Todas resolvem em < 30min cada durante a Fase 5 ou implementação real.

---

## Critérios objetivos para APROVADO

| # | Critério | Status |
|---|---|---|
| 1 | BL-1: endpoint de confirmação manual com fluxo completo | ✅ §14.1 |
| 2 | BL-2: decisão clara sobre HEIC + mensagem ao usuário | ✅ §14.2 |
| 3 | 7 altos endereçados em patch v1.1 | ✅ §14.3 a §14.7, §14.11, §14.12 |
| 4 | 3 médios com decisão de tratamento | ✅ §14.8, §14.9, §14.10 |
| 5 | LGPD: Data Export inclui imagens OCR (C1) | ✅ §14.7 |

**100% dos critérios atendidos.**

---

## Tarefas para Fase 5 (consolidado das 5 NMs)

| Origem | Tarefa | Esforço |
|---|---|---|
| NM-1 | Renomear `validate()` para `validateInternal()` + criar wrapper público | 10min |
| NM-2 | Implementar `OcrConsentGuard` separado do `OcrQuotaGuard` | 15min |
| NM-3 | Endpoint `POST /api/v1/ocr/refresh-signed-url` | 20min |
| NM-4 | Retornar `expiresAt` ISO string com signed URLs | 5min |
| NM-5 | Implementar `settlementRepo.findManyForExport` | 10min |
| **Total** | — | **~1h** |

Mais leve que as fases anteriores (Fase 3 v1.1 deixou 4 NMs com ~2h; Fase 4 v1.1 deixou 6 NMs com ~3.5h, incluindo a crítica NM-1 do bcrypt).

---

## Comentário final

O Bridge OCR Premium fechou bem. O patch v1.1 resolveu 12 itens (2 bloq + 7 altos + 3 médios) em 530 linhas — proporcionalmente o patch mais cirúrgico até agora. As decisões @claude-arquiteto (endpoint dedicado, rejeição de HEIC, ocrObjectKey, lock pessimista, TTLs distintos) somam com a decisão @product (Data Export inclui imagens) compondo uma feature LGPD-compliant pronta para implementação.

Os 5 NMs detectados agora são **especificação ausente de métodos auxiliares** — não furos conceituais. Apareceram porque o patch focou em decisões macro e deixou implícitos os métodos de suporte (`validateInternal`, `findManyForExport`, `OcrConsentGuard`, refresh endpoint, `expiresAt`). Implementador atento resolve no momento, mas registrar agora evita confusão.

**Quita liberado para Fase 5 — Telas Web (Next.js).**

---

## Próximas entregas

| Fase | Conteúdo | Pré-requisito |
|---|---|---|
| **5** | Fluxo de telas web (Next.js 15): wireframes, estados, copy final em PT-BR, fluxos UI do OCR, plano de beta privado com 10-20 endividados reais. Incluir resoluções de NM-1 a NM-5 do Bridge + NM-1 a NM-6 da Fase 4. | Esta aprovação |
| **6** | Plano de migração do código atual: ordem de aplicação das 15 migrations, estratégia de feature flags, preservação de dados de testers, riscos da migração. | Fase 5 |

---

## Inventário consolidado de migrations (15 totais)

| # | Migration | Origem | Fase |
|---|---|---|---|
| 1-10 | Schema base (24 tabelas, ~282 campos) | Fase 2 v2 + v2.1 | Fase 2 |
| 11 | `phase3_v1_1_adjustments` | Fase 3 v1.1 — `cycleNumber`, `SettlementEvaluation.expiresAt`/`invalidatedAt` | Fase 3 |
| 12 | `drop_ai_insight` | Fase 3 v1.1 — gated atrás de check de zero rows | Fase 3 |
| 13 | `add_refresh_token` | Fase 4 v1.1 — tabela `RefreshToken` | Fase 4 |
| 14 | `add_ocr_fields_to_settlement_evaluation` | Bridge OCR v1.1 — `usedOcr`, `ocrObjectKey`, `ocrExtractedData`, `ocrConfidence` | Bridge |
| 15 | `create_ocr_bucket` | Bridge OCR v1.1 — `INSERT INTO storage.buckets` | Bridge |

---

*Fim do dossiê. Quita liberado para Fase 5.*
