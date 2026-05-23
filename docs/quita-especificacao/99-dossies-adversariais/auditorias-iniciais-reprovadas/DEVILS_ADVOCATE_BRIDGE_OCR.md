# Devils Advocate — Auditoria do Bridge OCR Premium

> **Modo:** Estratégia
> **Escopo auditado:** `BRIDGE_OCR_PREMIUM.md` (694 linhas, 13 seções)
> **Data:** 17 de maio de 2026
> **Mantra:** *"Se não sobreviver ao meu interrogatório, não merece produção."*

---

## Veredito provisório

# 🔴 REPROVADO

O Bridge cobre bem **provider, storage, quota, consentimento LGPD, fluxo macro, custos e erros**. Mas tem **2 bloqueadores que afetam a implementação direta** + 7 altos com lacunas reais + 3 médios. Documento menor que as fases anteriores, porém com furos finos típicos da última iteração antes da implementação.

Custo estimado de correção: **~3h de patch v1.1**, em parte porque algumas lacunas exigem decisão arquitetural pequena (ex: nome correto do campo, biblioteca alternativa para HEIC).

---

## Resumo dos achados

| Severidade | Total |
|---|---|
| 🔴 Bloqueadores | **2** |
| 🟠 Altos | **7** |
| 🟡 Médios | **3** |

---

## Fase 1 — Radiografia

### 🔴 Bloqueadores (2)

---

#### BL-1 — Fluxo de confirmação manual sem endpoint dedicado

§6 (fluxo end-to-end) e §7.2 (`SettlementValidatorImageOutput`) descrevem o caso de `confidence < 0.7`:

> `Retorna 200 com { needsManualConfirmation: true, extractedData, imageSignedUrl }`
> `UI mostra modal com campos pré-preenchidos EDITÁVEIS`

Tudo certo até aí. **O que acontece quando o usuário confirma manualmente os campos?**

- Chama `POST /api/v1/settlements/validate` (endpoint tradicional sem imagem)?
- Mas como preservar `usedOcr=true`, `ocrImageUrl=objectKey`, `ocrExtractedData` na `SettlementEvaluation` resultante?
- O endpoint tradicional não conhece esses campos.

O documento define o caminho até o ponto da incerteza, mas não fecha. Resultado:
- Implementador inventa solução (possivelmente errada)
- Ou cria evaluation duplicada
- Ou perde rastreamento do OCR (e da quota usada)

**Solução proposta.** Dois caminhos possíveis:

**Opção A** — Endpoint dedicado de confirmação:
```
POST /api/v1/settlements/validate-from-image/confirm
Body: {
  objectKey: string,       // referência à imagem já uploadada
  extractedData: { ... }, // valores eventualmente editados pelo usuário
  debtId: string,
}
```

**Opção B** — Estender o endpoint atual com flag:
```
POST /api/v1/settlements/validate
Body: {
  ...campos manuais...,
  ocrContext?: {
    objectKey: string,
    originalExtractedData: { ... },
    confidence: number,
  },
}
```

Recomendo **Opção A** — endpoint dedicado deixa o fluxo OCR autocontido, evita inchar o endpoint manual com lógica condicional.

**Importante.** Quota deve ser contada **uma vez** no upload inicial, não no confirm. Caso contrário, usuário com baixa confidence gasta 2 OCRs (uma no upload + uma no confirm). Confirmar = não conta nova OCR.

**Custo de correção.** ~45min: definir endpoint A, ajustar service, atualizar fluxo no §6.

---

#### BL-2 — Conversão HEIC via `sharp` não funciona out-of-the-box

§3.5 lista `image/heic` como tipo aceito. §6 menciona "Converte HEIC → JPEG (se necessário, via sharp)".

**Problema.** `sharp` (libvips) **não suporta HEIC nativamente**. Requer `libheif` instalado no sistema operacional + binding compilado. Em ambientes Docker (Railway, Fly.io), a imagem base do Node não inclui libheif, e instalar libheif aumenta significativamente o tamanho do container e o tempo de build.

Alternativas reais:
1. **`heic-convert`** (npm) — JS puro, sem deps nativas, mais lento mas funciona em qualquer ambiente
2. **`@photo-sphere-viewer/heic-helper`** — similar
3. **Conversão no frontend** antes do upload — JS browser API ou lib client-side; reduz carga no backend
4. **Rejeitar HEIC** no MVP — recusa upload e pede que o usuário converta para JPEG/PNG

**Recomendação.** Opção 3 (frontend) ou Opção 4 (rejeitar).

- Opção 3: usar `heic2any` no Next.js antes do upload. Conversão acontece no navegador do usuário. Backend recebe sempre JPEG/PNG/WebP.
- Opção 4: simplifica MVP. Tela mostra erro amigável: "Use JPG ou PNG. Em iPhones, vá em Ajustes > Câmera > Formatos > Mais Compatível".

**Decisão recomendada para MVP:** Opção 4. Reduz superfície técnica. Adicionar Opção 3 quando UX impactar conversão.

**Custo de correção.** ~30min: remover `image/heic` da §3.5, ajustar §6, adicionar mensagem de erro específica na §9.1.

---

### 🟠 Altos (7)

---

#### A-1 — `ocrImageUrl` deveria ser `ocrObjectKey`

§8 define `ocrImageUrl: String?` no schema. Mas signed URLs **expiram em 5min** (§3.1). Salvar URL no banco é inútil — fica inválida em minutos.

O que **realmente precisa** ser salvo: o `objectKey` no bucket (`{userId}/{uuid}.jpg`). A signed URL é gerada **sob demanda** quando o usuário precisa ver a imagem (modal de confirmação, page de detalhes).

**Patch:**

```prisma
ocrObjectKey  String?  @map("ocr_object_key") @db.VarChar(500)
```

E no service:
```typescript
async generateSignedUrl(objectKey: string, ttlSeconds = 300): Promise<string> {
  const { data } = await this.supabase.storage
    .from('ocr-uploads')
    .createSignedUrl(objectKey, ttlSeconds);
  return data.signedUrl;
}
```

Quando o front pede a imagem, backend gera signed URL fresca.

---

#### A-2 — Setup do bucket Supabase não documentado

§3.1 menciona o bucket `ocr-uploads` mas não diz **como criar**. Manual no dashboard? Migration?

Para Supabase, buckets são criados via:
- Dashboard (manual, não versionado)
- SQL via migration (`INSERT INTO storage.buckets ...`)
- SDK no boot da app (idempotente)

**Recomendação.** Migration SQL na sequência 15:

```
15. 20260617_create_ocr_bucket
    - INSERT INTO storage.buckets (id, name, public)
      VALUES ('ocr-uploads', 'ocr-uploads', false)
      ON CONFLICT (id) DO NOTHING
    - (sem policy de acesso = bloqueado por default; só service_role acessa)
```

Roda no `prisma migrate deploy` automaticamente.

---

#### A-3 — Race condition em quota

`OcrQuotaGuard` faz `count + check < 5 → permite`. Dois uploads simultâneos do mesmo usuário Premium com 4 OCRs já feitos:
- Guard A: count=4, permite
- Guard B: count=4, permite (mesmo momento)
- Resultado: 6 OCRs no mês

Não é crítico (1 a mais não quebra nada), mas é furo conhecido e fácil de fechar.

**Soluções:**
- **(a) Lock pessimista** no User durante check (`SELECT ... FOR UPDATE`)
- **(b) Throttle por usuário no endpoint** (já tem 5/min, mas dois requests no mesmo segundo passam)
- **(c) Aceitar overflow controlado** — limite no DB com check constraint que rejeita o 6º

Recomendação: **(a) Lock pessimista** + transaction:

```typescript
async canActivate(context): Promise<boolean> {
  return this.txRunner.run(async (tx) => {
    const usage = await tx.$queryRaw`
      SELECT COUNT(*) FROM settlement_evaluations
      WHERE user_id = ${userId}
        AND used_ocr = true
        AND evaluated_at >= ${startOfMonth(new Date())}
      FOR UPDATE
    `;
    if (usage >= 5) throw new PaymentRequiredException('ocr_quota_exceeded');
    return true;
  });
}
```

`FOR UPDATE` em tabela de leitura é incomum mas funciona. Alternativa: usar advisory lock por user.

**Custo de correção.** ~20min.

---

#### A-4 — `OcrCleanupJob` lista bucket inteiro

§3.4 lista o bucket em batches de 100 com `sortBy: created_at ASC`. Para 10.000 arquivos, são 100 chamadas ao Storage API por execução do job — viável. Para 1M arquivos (escala futura), é problemático.

**Mitigação para escala futura.** Substituir por consulta direta à tabela `storage.objects` (que Supabase expõe via SQL):

```sql
DELETE FROM storage.objects
WHERE bucket_id = 'ocr-uploads'
  AND created_at < NOW() - INTERVAL '30 days';
```

Vai diretamente no índice, milhares de vezes mais rápido. Requer permissão de service_role no banco (que já temos).

**Decisão.** Documentar o caminho atual (API + batches) mas registrar tarefa pós-MVP de migrar para SQL direto quando bucket > 50.000 objetos.

---

#### A-5 — Versão do consentimento sem estratégia

§5.4 faz `this.getCurrentVersion('ocr_data_processing')` mas não define **onde** vive essa versão.

Para o MVP, **constante em código** é suficiente:

```typescript
// modules/consent/consent-versions.constant.ts
export const CONSENT_VERSIONS = {
  ocr_data_processing: '1.0',
  data_processing_general: '1.0',
  marketing_communications: '1.0',
} as const;
```

Quando o texto do consentimento mudar (ex: nova versão de Política de Privacidade), bumpar para `'1.1'` e — se a mudança for material — solicitar re-consentimento de todos os usuários que aceitaram a versão anterior.

**Custo de correção.** ~10min. Adicionar ao patch.

---

#### A-6 — Data export não inclui imagens OCR

LGPD art. 18 inciso V (portabilidade): titular tem direito a receber **todos** os dados que detemos sobre ele. Imagens de OCR são dados pessoais — devem ser incluídas no `DataExport`.

§3.4 já garante TTL de 30 dias, então só as imagens dos últimos 30 dias seriam exportáveis. Aceitável: depois de 30 dias, dados originais foram descartados.

**Patch.** Em `DataExportService.generateExport(userId)`:

```typescript
const ocrImages = await this.settlementRepo.listOcrImagesForUser(userId);
const signedUrls = await Promise.all(
  ocrImages.map(async (img) => ({
    evaluationId: img.id,
    capturedAt: img.evaluatedAt,
    extractedData: img.ocrExtractedData,
    imageDownloadUrl: await this.ocrService.generateSignedUrl(img.ocrObjectKey, 60 * 60 * 24 * 7), // 7 dias
  }))
);

// incluir signedUrls no payload do export
```

Signed URLs com TTL de 7 dias dão tempo para o usuário baixar os arquivos.

---

#### A-7 — Signed URL TTL 5 min apertado para UX

§3.1 define signed URL com TTL 5 min. Cenário:
- Usuário tira foto da proposta
- Backend processa, retorna `needsManualConfirmation: true` com signed URL
- Usuário lê com calma, edita campos, **demora 7 minutos**
- Frontend tenta confirmar → signed URL no preview já expirou
- UX quebra

**Solução.** Aumentar TTL para 15 min OU regenerar URL automaticamente quando expira (frontend detecta 403 e pede nova).

Para o MVP, mais simples: **TTL 15 minutos**. Risco de exposição: signed URL ainda exige acesso à URL exata, gerada por backend autenticado. Vazamento é improvável.

---

### 🟡 Médios (3)

---

#### M-1 — `OPENAI_API_KEY` não listada nas env vars da Fase 4

§16 da Fase 4 (env vars) **não inclui** `OPENAI_API_KEY`. Adicionar ao patch:

```bash
# OCR Premium (OpenAI Vision)
OPENAI_API_KEY=sk-...
OCR_MODEL=gpt-4o-mini
OCR_TIMEOUT_MS=30000

# Supabase Storage (já tem URL/key da própria Supabase)
SUPABASE_SERVICE_ROLE_KEY=...
```

---

#### M-2 — Métricas de custo OCR "manuais"

§10.2 lista `ocr.cost_estimate.monthly` como métrica "manual". Sem dashboard automático, ninguém vai olhar. Em escala, isso é como dirigir sem velocímetro.

**Sugestão.** Cron mensal `OcrCostReportJob` que conta OCRs do mês × custo unitário e loga estruturado:

```typescript
this.logger.info({
  ocrsCount: usage,
  estimatedCostUSD: usage * 0.01,
  estimatedCostBRL: usage * 0.05,
  month: format(new Date(), 'yyyy-MM'),
}, 'ocr.cost_report.monthly');
```

Em Sentry ou ferramenta de logs, dá pra criar dashboard a partir disso. Tarefa de Fase 5.

---

#### M-3 — Detecção de PII em imagem (rosto, RG)

§12 cita o risco de "Imagem com dado pessoal sensível além da proposta (rosto, RG visível)". Mitigação proposta é fraca ("Política de privacidade alerta").

**Realidade.** Não conseguimos impedir que o usuário fotografe coisa demais. O que podemos fazer:
- Aviso visível no UI antes da câmera: "Inclua apenas a proposta. Evite documentos de identidade e rostos."
- Notar no consentimento: "Você é responsável por enviar apenas o conteúdo da proposta."
- Auto-delete 30 dias minimiza retenção

Detecção automática de RG/CNH/rosto é overengineering para o MVP. Registrar como melhoria pós-MVP.

---

## Fase 5 — Interrogatório

6 perguntas. 4 técnicas @claude-arquiteto; 2 consultas (@product confirma).

---

**P1 @claude-arquiteto** (BL-1)
Endpoint dedicado de confirmação manual (`POST /settlements/validate-from-image/confirm`) ou estender endpoint manual com flag `ocrContext`? Recomendo dedicado. Confirma?

---

**P2 @claude-arquiteto** (BL-2)
HEIC: rejeitar no MVP (mais simples) ou suportar via `heic2any` no frontend? Recomendo **rejeitar**. Confirma?

---

**P3 @claude-arquiteto** (A-1, A-2)
- Renomear `ocrImageUrl` → `ocrObjectKey` (gera signed URL sob demanda)
- Adicionar migration 15 para criar bucket Supabase via SQL

Confirma ambos?

---

**P4 @claude-arquiteto** (A-3, A-7)
- Lock pessimista no `OcrQuotaGuard` para race condition
- Signed URL TTL 15min (em vez de 5min)

Confirma ambos?

---

**P5 @claude-arquiteto + @product** (A-6)
Data export incluir imagens OCR via signed URLs com TTL 7 dias? LGPD art. 18 V exige portabilidade. Confirma?

---

**P6 @claude-arquiteto** (M-1 a M-3, A-4, A-5)
Consolidar os pequenos no patch:
- M-1: env vars `OPENAI_API_KEY`, `OCR_MODEL`, `OCR_TIMEOUT_MS`, `SUPABASE_SERVICE_ROLE_KEY`
- M-2: `OcrCostReportJob` mensal com log estruturado
- M-3: Aviso visível na UI + registrar detecção automática como pós-MVP
- A-4: Documentar atual + tarefa pós-MVP de migrar para SQL direto
- A-5: Constante `CONSENT_VERSIONS` em código

Confirma?

---

## Fase 7 — Critérios para APROVADO

| # | Critério | Status |
|---|---|---|
| 1 | BL-1: fluxo de confirmação manual com endpoint dedicado | ❌ |
| 2 | BL-2: decisão clara sobre HEIC | ❌ |
| 3 | 7 altos endereçados em patch v1.1 | ❌ |
| 4 | 3 médios com decisão de tratamento | ❌ |

---

## Comparativo das 6 auditorias

| Auditoria | Bloq | Altos | Médios | Veredito |
|---|---|---|---|---|
| Fases 1 e 2 v1 | 4 | 4 | 1 | 🔴 |
| Fases 1 e 2 v2 | 0 | 0 | 0 | ✅ |
| Fase 3 v1 | 4 | 7 | 4 | 🔴 |
| Fase 3 v1.1 | 0 | 0 | 0 (4 NM) | ✅ |
| Fase 4 v1 | 4 | 7 | 4 | 🔴 |
| Fase 4 v1.1 | 0 | 0 | 0 (6 NM) | ✅ |
| **Bridge OCR v1** | **2** | **7** | **3** | 🔴 |

Bridge tem **metade dos bloqueadores** das fases grandes (consistente com tamanho menor) mas mesmo número de altos (típico de pontas finas).

---

## Comentário final

O Bridge faz bem o que é grande (provider justificado, fluxo macro, custos, LGPD, erros) mas escorrega em pontas finas onde a implementação precisa de instrução exata. Os 2 bloqueadores são exemplos clássicos: o que parecia óbvio (HEIC) tem armadilha técnica; o que parecia coberto (fluxo de confirmação) tem buraco no final do tubo.

Os 7 altos são de duas naturezas:
- **Detalhes de implementação** (objectKey vs URL, setup do bucket, env vars, TTL apertado) — fácil corrigir
- **Conformidade LGPD** (export inclui imagens, versionamento de consentimento) — material para a Política de Privacidade

Patch v1.1 (~3h de trabalho) resolve tudo. Pequeno em comparação às fases anteriores, e a estrutura geral do Bridge está sólida.

*Fim do dossiê. Aguardando ciclo adversarial.*
