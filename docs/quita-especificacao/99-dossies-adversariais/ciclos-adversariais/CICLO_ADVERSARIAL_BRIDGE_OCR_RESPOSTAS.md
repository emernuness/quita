# Ciclo Adversarial Bridge OCR — Respostas + Patch v1.1

> **Resposta ao:** `DEVILS_ADVOCATE_BRIDGE_OCR.md`
> **Data:** 17 de maio de 2026
> **Status:** 5 decisões @claude-arquiteto tomadas; 1 confirmação @product pendente
> **Output:** este documento contém respostas E o patch v1.1 a aplicar no Bridge

---

## Sumário executivo

Das 6 perguntas:
- **5 decididas por @claude-arquiteto** (P1, P2, P3, P4, P6)
- **1 pendente @product** (P5 — LGPD data export)

A §14 do patch consolida tudo em formato pronto para colar no Bridge.

---

## P1 — @claude-arquiteto: Endpoint de confirmação manual (BL-1)

### Decisão

**Endpoint dedicado:** `POST /api/v1/settlements/validate-from-image/confirm`

### Por que dedicado em vez de estender o manual

- Mantém o fluxo OCR autocontido (sem inchar `validate` com lógica condicional)
- Frontend chama o endpoint só quando vem do fluxo OCR — sem ambiguidade
- Auditoria fica mais clara (logs separados por endpoint)

### Especificação

```typescript
// modules/settlement-validator/settlement-validator.controller.ts
@Post('validate-from-image/confirm')
@UseGuards(JwtAuthGuard, OcrConsentGuard) // NÃO chama OcrQuotaGuard
@Throttle({ default: { limit: 10, ttl: 60_000 } })
async confirmFromImage(
  @CurrentUser() user,
  @Body() dto: ConfirmFromImageDto,
): Promise<SettlementValidatorOutput & { evaluationId: string }> {
  return await this.validator.confirmFromImage(user.id, dto);
}

// dto/confirm-from-image.dto.ts
export class ConfirmFromImageDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  debtId: string;

  @ApiProperty({ description: 'objectKey retornado no upload original' })
  @IsString()
  @MaxLength(500)
  ocrObjectKey: string;

  @ApiProperty({ description: 'extractedData original (auditoria)' })
  ocrExtractedData: OcrExtractedData;

  @ApiProperty({ description: 'confidence original do OCR' })
  @IsNumber()
  @Min(0)
  @Max(1)
  ocrConfidence: number;

  // Campos editados pelo usuário (podem diferir do extractedData):
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  proposalCashAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  proposalInstallments?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  proposalInstallmentAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  proposalDeadline?: string;
}
```

### Lógica do `confirmFromImage`

```typescript
async confirmFromImage(userId: string, dto: ConfirmFromImageDto) {
  // 1. Verificar que o objectKey pertence ao usuário (segurança)
  if (!dto.ocrObjectKey.startsWith(`${userId}/`)) {
    throw new ForbiddenException('object_not_owned');
  }

  // 2. Chamar validator normal com os valores confirmados (possivelmente editados)
  return await this.validator.validateInternal({
    userId,
    debtId: dto.debtId,
    proposalCashAmount: dto.proposalCashAmount,
    proposalInstallments: dto.proposalInstallments,
    proposalInstallmentAmount: dto.proposalInstallmentAmount,
    proposalDeadline: dto.proposalDeadline ? new Date(dto.proposalDeadline) : undefined,

    // Contexto OCR para persistir na evaluation
    ocrContext: {
      objectKey: dto.ocrObjectKey,
      extractedData: dto.ocrExtractedData,
      confidence: dto.ocrConfidence,
    },
  });
}
```

### Quota e segurança

- `OcrQuotaGuard` **NÃO** roda no confirm (quota já contada no upload original)
- `OcrConsentGuard` roda no confirm (usuário pode ter revogado consentimento entre upload e confirm)
- Verificação de ownership do `objectKey` impede que usuário A confirme imagem de usuário B

---

## P2 — @claude-arquiteto: HEIC (BL-2)

### Decisão

**Rejeitar HEIC no MVP.**

### Justificativa

| Alternativa | Custo | Risco |
|---|---|---|
| `libheif` + `sharp` no Docker | Container 3x maior, build 5x mais lento | Falhas de instalação no Railway |
| `heic2any` no frontend | +200KB no bundle Next.js | Conversão lenta em mobile |
| `heic-convert` no backend (JS puro) | Mais lento, sem aceleração nativa | OK mas adiciona dep |
| **Rejeitar** | 1 mensagem de erro | Usuário precisa mudar setting do iPhone |

iPhones a partir do iOS 11 (2017) já têm setting "Mais Compatível" em Ajustes > Câmera > Formatos. A maior parte dos usuários Premium do Quita estarão em telefones modernos; quem está com HEIC pode resolver em 30 segundos.

### Implementação

§3.5 patcheada para remover `image/heic`:

```typescript
@UseInterceptors(FileInterceptor('image', {
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new BadRequestException('invalid_format'), false);
    }
    cb(null, true);
  },
}))
```

§9.1 patcheado com mensagem mais detalhada:

```
| Formato não aceito (HEIC) | 400 | invalid_format_heic | "iPhones precisam estar em modo 'Mais Compatível': Ajustes > Câmera > Formatos > Mais Compatível. Ou tire um screenshot da foto." |
```

### Reavaliar no pós-MVP

Se métrica `ocr.errors.invalid_format` mostrar > 5% das tentativas vindo de HEIC, considerar `heic2any` no frontend.

---

## P3 — @claude-arquiteto: objectKey + setup do bucket (A-1, A-2)

### Decisão

Ambos aceitos.

### A-1: Renomear campo

```prisma
model SettlementEvaluation {
  // ... campos existentes ...
  usedOcr           Boolean    @default(false) @map("used_ocr")
  ocrObjectKey      String?    @map("ocr_object_key") @db.VarChar(500)  // <-- renomeado
  ocrExtractedData  Json?      @map("ocr_extracted_data")
  ocrConfidence     Decimal?   @map("ocr_confidence") @db.Decimal(3, 2)
}
```

Service usa o objectKey para gerar signed URL sob demanda:

```typescript
async generateSignedUrl(objectKey: string, ttlSeconds = 900): Promise<string> {
  const { data, error } = await this.supabase.storage
    .from('ocr-uploads')
    .createSignedUrl(objectKey, ttlSeconds);

  if (error) throw new StorageError(`signed_url_failed: ${error.message}`);
  return data.signedUrl;
}
```

### A-2: Setup do bucket via migration

**Migration 15:**

```sql
-- 15. 20260617_create_ocr_bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('ocr-uploads', 'ocr-uploads', false, 10485760)  -- 10MB
ON CONFLICT (id) DO NOTHING;

-- Sem policy = bloqueado para anon/authenticated; só service_role acessa
-- (que é o que queremos)
```

Roda no `prisma migrate deploy` automaticamente, sem intervenção manual no dashboard.

---

## P4 — @claude-arquiteto: Race condition + TTL (A-3, A-7)

### Decisão

Ambos aceitos.

### A-3: Lock pessimista no `OcrQuotaGuard`

```typescript
// modules/settlement-validator/guards/ocr-quota.guard.ts
@Injectable()
export class OcrQuotaGuard implements CanActivate {
  constructor(
    private readonly txRunner: TransactionRunner,
    private readonly userRepo: UserRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const userId = req.user.id;

    return this.txRunner.run(async (tx) => {
      // Lock no User (curto) — serializa quota checks por usuário
      await tx.$executeRaw`
        SELECT 1 FROM users WHERE id = ${userId}::uuid FOR UPDATE
      `;

      const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
      if (user.planType !== 'premium') {
        throw new PaymentRequiredException('ocr_premium_only');
      }

      const usage = await tx.settlementEvaluation.count({
        where: {
          userId,
          usedOcr: true,
          evaluatedAt: { gte: startOfMonth(new Date()) },
        },
      });

      if (usage >= 5) {
        throw new PaymentRequiredException('ocr_quota_exceeded');
      }

      return true;
    });
  }
}
```

O `FOR UPDATE` no User trava o registro pela duração da transaction (curta — < 50ms). Dois requests simultâneos do mesmo usuário serializam aqui. Custo: imperceptível.

### A-7: Signed URL TTL 15 minutos

§3.1 patcheada:

```
- **Signed URLs:** geradas sob demanda, TTL 15 minutos (modal de confirmação)
```

Razão: usuário pode demorar lendo modal e editando campos. 5 min era apertado.

Para data export (A-6, P5 pendente abaixo), TTL maior (7 dias) — usuário tem tempo de baixar o ZIP.

---

## P5 — @claude-arquiteto + @product (PENDENTE): Data export de imagens OCR (A-6)

### Proposta técnica

LGPD art. 18 V (portabilidade) — usuário tem direito a receber todos os dados pessoais que mantemos. Imagens OCR são dados pessoais. Inclusão no `DataExport` é obrigatória pela LGPD.

Como já temos auto-delete em 30 dias, apenas imagens dos últimos 30 dias estarão disponíveis. Aceitável: o resto foi descartado conforme política de retenção.

### Implementação

```typescript
// modules/data-export/data-export.service.ts
async generateExport(userId: string): Promise<DataExportPayload> {
  // ... outros dados ...

  const ocrEvaluations = await this.settlementRepo.findManyForExport({
    userId,
    usedOcr: true,
    evaluatedAt: { gte: subDays(new Date(), 30) }, // últimos 30 dias
  });

  const ocrImages = await Promise.all(
    ocrEvaluations.map(async (ev) => ({
      evaluationId: ev.id,
      debtId: ev.debtId,
      capturedAt: ev.evaluatedAt.toISOString(),
      extractedData: ev.ocrExtractedData,
      confidence: ev.ocrConfidence ? Number(ev.ocrConfidence) : null,
      imageDownloadUrl: ev.ocrObjectKey
        ? await this.ocrService.generateSignedUrl(ev.ocrObjectKey, 7 * 24 * 3600) // 7 dias
        : null,
    }))
  );

  return {
    // ... outros campos ...
    ocrImages,
  };
}
```

### Política

- Signed URLs com TTL 7 dias dão tempo para o usuário baixar
- DataExport completo expira em 30 dias (já era política)
- Após DataExport expirar: usuário gera novo, com URLs frescas

### Pendência @product

**Confirma incluir imagens OCR no DataExport com signed URLs TTL 7 dias?**

Recomendação técnica é **obrigatória** por LGPD; pergunta é mais sobre confirmar o approach.

---

## P6 — @claude-arquiteto: Consolidação dos pequenos (M-1 a M-3, A-4, A-5)

### M-1: Env vars adicionadas

§16 da Fase 4 ganha:

```bash
# OCR Premium (OpenAI Vision)
OPENAI_API_KEY=sk-...
OCR_MODEL=gpt-4o-mini
OCR_TIMEOUT_MS=30000

# Supabase Storage (service role para acesso privado a buckets)
SUPABASE_URL=https://...supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
```

Adicionar à validação Zod do envSchema (§16.2 Fase 4):

```typescript
OPENAI_API_KEY: z.string().startsWith('sk-'),
OCR_MODEL: z.string().default('gpt-4o-mini'),
OCR_TIMEOUT_MS: z.coerce.number().default(30_000),
SUPABASE_URL: z.string().url(),
SUPABASE_SERVICE_ROLE_KEY: z.string().min(32),
```

App falha no boot se faltarem.

### M-2: `OcrCostReportJob` mensal

```typescript
// queues/processors/ocr-cost-report.processor.ts
@Injectable()
@Processor('motor-scheduled', { concurrency: 1 })
export class OcrCostReportProcessor extends BaseProcessor {
  async handle(): Promise<any> {
    const monthStart = startOfMonth(new Date());
    const monthLabel = format(monthStart, 'yyyy-MM');

    const result = await this.prisma.settlementEvaluation.aggregate({
      where: {
        usedOcr: true,
        evaluatedAt: { gte: monthStart },
      },
      _count: { id: true },
    });

    const ocrsCount = result._count.id;
    const estimatedCostUSD = ocrsCount * 0.01;
    const estimatedCostBRL = ocrsCount * 0.05;

    this.logger.info({
      month: monthLabel,
      ocrsCount,
      estimatedCostUSD,
      estimatedCostBRL,
      avgConfidence: await this.computeAvgConfidence(monthStart),
    }, 'ocr.cost_report.monthly');

    return { ocrsCount, estimatedCostBRL };
  }
}
```

**Cron:** mensal, dia 1º às 06:00 UTC (depois do `InterestRateUpdate`).

Dashboard de logs (Sentry breadcrumb ou ferramenta externa) gera gráfico a partir desse log.

### M-3: Aviso UI + pós-MVP

Patch no §5.2 (texto do consentimento):

> 6. **VOCÊ É RESPONSÁVEL pelo conteúdo da imagem.** Inclua apenas a proposta de
>    acordo. **NÃO fotografe documentos de identidade (RG, CNH, CPF), rostos
>    de outras pessoas, ou qualquer informação pessoal além da proposta.**

Adicional na UI antes de abrir câmera: banner com mesmo texto.

Detecção automática de PII (rostos, documentos) registrada em `BACKLOG_POS_MVP.md`:

```markdown
## Detecção automática de PII em imagens OCR

**Objetivo:** rejeitar uploads contendo rostos ou documentos de identidade.

**Tecnologias possíveis:**
- Google Vision SafeSearch + LandmarkDetection
- AWS Rekognition (DetectFaces + DetectModerationLabels)
- OpenAI Vision com prompt de pré-validação

**Quando fazer:** após primeiro relato de upload inadequado ou pré-launch de
escala (> 5k usuários).
```

### A-4: `OcrCleanupJob` — documentar atual + tarefa pós-MVP

§3.4 mantém implementação atual (list + filter + delete em batches). Adicionar nota:

```markdown
**Nota de escala.** Para bucket > 50.000 objetos, considerar migração para
SQL direto:

```sql
DELETE FROM storage.objects
WHERE bucket_id = 'ocr-uploads'
  AND created_at < NOW() - INTERVAL '30 days';
```

Registrar em BACKLOG_POS_MVP.md.
```

### A-5: Constante `CONSENT_VERSIONS`

```typescript
// modules/consent/consent-versions.constant.ts
export const CONSENT_VERSIONS = {
  ocr_data_processing: '1.0',
  data_processing_general: '1.0',
  marketing_communications: '1.0',
} as const;

export type ConsentType = keyof typeof CONSENT_VERSIONS;

export function getCurrentConsentVersion(type: ConsentType): string {
  return CONSENT_VERSIONS[type];
}
```

Quando texto mudar materialmente, bumpar versão e disparar re-consentimento de usuários com versão anterior.

---

## §14 (Patch) — Adição ao Bridge OCR

> **Seção §14 oficial do Patch v1.1 do Bridge OCR Premium.** Anexar ao final de `BRIDGE_OCR_PREMIUM.md`, antes da seção 13 (Próximos passos).

```markdown
## 14. Patch v1.1 — Refinamentos pós-ciclo adversarial

### 14.1 Endpoint de confirmação manual (BL-1)

`POST /api/v1/settlements/validate-from-image/confirm`

Endpoint dedicado quando `confidence < 0.7`. Quota NÃO conta novamente
(já contou no upload). Verificação de ownership do objectKey.

[Cole conteúdo de P1]

### 14.2 HEIC rejeitado no MVP (BL-2)

Aceitos apenas: `image/jpeg`, `image/png`, `image/webp`. Mensagem
detalhada para usuários de iPhone explicando como mudar para "Mais Compatível".

Reavaliar pós-MVP se métrica `ocr.errors.invalid_format` mostrar > 5%.

### 14.3 Renomeação para `ocrObjectKey` (A-1)

Schema:
```prisma
ocrObjectKey String? @map("ocr_object_key") @db.VarChar(500)
```

Service gera signed URL sob demanda (TTL 15min para modal, TTL 7d para data export).

### 14.4 Setup do bucket via migration (A-2)

Migration 15: `INSERT INTO storage.buckets ('ocr-uploads', ...)`.

Roda automaticamente no `prisma migrate deploy`.

### 14.5 Race condition em quota (A-3)

`OcrQuotaGuard` envelopa check em `prisma.$transaction` com
`SELECT 1 FROM users WHERE id = ? FOR UPDATE` no início.

Custo: < 50ms por request. Serializa quota checks por usuário.

### 14.6 TTL de signed URL 15 minutos (A-7)

§3.1 atualizado: TTL padrão 15 minutos (modal de confirmação), 7 dias (data export).

### 14.7 Data Export inclui imagens OCR (A-6)

`DataExportService.generateExport` busca últimos 30 dias de OCRs
do usuário e inclui signed URLs (TTL 7 dias) no payload.

[Cole conteúdo de P5]

### 14.8 Env vars adicionadas (M-1)

`OPENAI_API_KEY`, `OCR_MODEL`, `OCR_TIMEOUT_MS`, `SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY`. Validação Zod no envSchema da Fase 4.

### 14.9 `OcrCostReportJob` mensal (M-2)

Cron dia 1º 06:00 UTC. Log estruturado com `ocrsCount`,
`estimatedCostBRL`, `avgConfidence`.

### 14.10 Aviso explícito de PII no consentimento (M-3)

Texto do §5.2 ganha cláusula 6 sobre responsabilidade do usuário e
proibição expressa de fotografar documentos de identidade ou rostos.

Detecção automática de PII registrada em `BACKLOG_POS_MVP.md`.

### 14.11 `OcrCleanupJob` documentado + tarefa pós-MVP (A-4)

Implementação atual (API + batches) mantida. Nota sobre migração para
SQL direto quando bucket > 50.000 objetos.

### 14.12 Constante CONSENT_VERSIONS (A-5)

Versões de consentimento centralizadas em `consent-versions.constant.ts`.

### 14.13 Atualizações de schema consolidadas

**Migrations adicionais:**

```
14. 20260617_add_ocr_fields_to_settlement_evaluation
    - ALTER TABLE settlement_evaluations ADD COLUMN used_ocr BOOLEAN NOT NULL DEFAULT FALSE
    - ALTER TABLE settlement_evaluations ADD COLUMN ocr_object_key VARCHAR(500) NULL
    - ALTER TABLE settlement_evaluations ADD COLUMN ocr_extracted_data JSONB NULL
    - ALTER TABLE settlement_evaluations ADD COLUMN ocr_confidence DECIMAL(3, 2) NULL
    - CREATE INDEX idx_settlement_evaluations_user_id_used_ocr_evaluated_at
      ON settlement_evaluations(user_id, used_ocr, evaluated_at)
      WHERE used_ocr = TRUE  -- partial index

15. 20260617_create_ocr_bucket
    - INSERT INTO storage.buckets VALUES ('ocr-uploads', 'ocr-uploads', false, 10485760)
      ON CONFLICT (id) DO NOTHING
```

**Total acumulado de migrations: 15.**

### 14.14 Atualizações ao §7 (jobs do Bridge + Fase 4)

| Job | Queue | Disparo |
|---|---|---|
| `OcrCleanupJob` | `motor-scheduled` | Cron diário 06:00 UTC |
| `OcrCostReportJob` | `motor-scheduled` | Cron mensal dia 1º 06:00 UTC |

### 14.15 Resumo do impacto do patch v1.1

| Categoria | Total |
|---|---|
| Endpoint novo | 1 (`validate-from-image/confirm`) |
| Schema modificado | `SettlementEvaluation` (`ocrImageUrl` → `ocrObjectKey`) |
| Migrations novas | 2 (14, 15) — total acumulado 15 |
| Constants novas | 1 (`CONSENT_VERSIONS`) |
| Env vars novas | 5 |
| Tipos de imagem aceitos | 3 (JPEG, PNG, WebP) — HEIC rejeitado |
| Bloqueadores resolvidos | 2 de 2 |
| Altos resolvidos | 7 de 7 |
| Médios resolvidos | 3 de 3 |

*Fim do Patch v1.1.*
```

---

## Confirmação pendente @product

| # | Decisão | Recomendação técnica |
|---|---|---|
| **C1 (P5/A-6)** | Data Export inclui imagens OCR via signed URLs TTL 7 dias? | ✅ Sim — exigência LGPD |

Apenas 1 confirmação. As outras 5 perguntas eu decidi como @claude-arquiteto.

---

## Após confirmação

Quando você responder, eu:
1. Aplico C1 no patch (~3min)
2. Atualizo o Bridge com a §14 colada
3. Re-submeto ao devils-advocate
4. Se virar APROVADO → seguimos para **Fase 5 — Telas Web (Next.js)**

---

*Fim do ciclo adversarial. Aguardando 1 confirmação.*
