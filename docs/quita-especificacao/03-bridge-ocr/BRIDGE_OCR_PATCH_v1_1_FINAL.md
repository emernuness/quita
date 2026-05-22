# Bridge OCR v1.1 — Patch Final (§14)

> **Anexar ao final do documento:** `BRIDGE_OCR_PREMIUM.md`, antes da seção 13 ("Próximos passos")
> **Versão:** v1.1
> **Data:** 17 de maio de 2026
> **Origem:** ciclo adversarial completo (devils-advocate v1 + respostas + decisão @product)
> **Confirmação @product:** C1 (Data Export inclui imagens OCR) ✅

---

## 14. Patch v1.1 — Refinamentos pós-ciclo adversarial

Resolução completa dos 2 bloqueadores + 7 altos + 3 médios detectados pelo devils-advocate. Esta seção é normativa: o que está aqui prevalece sobre as definições anteriores quando há conflito.

---

### 14.1 Endpoint de confirmação manual (BL-1)

Quando `confidence < 0.7`, o frontend exibe modal com campos pré-preenchidos editáveis. Ao confirmar, chama **endpoint dedicado**:

```
POST /api/v1/settlements/validate-from-image/confirm
```

#### Especificação

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
```

#### DTO

```typescript
// dto/confirm-from-image.dto.ts
export class ConfirmFromImageDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  debtId: string;

  @ApiProperty({ description: 'objectKey retornado no upload original' })
  @IsString()
  @MaxLength(500)
  ocrObjectKey: string;

  @ApiProperty({ description: 'extractedData original — preservado para auditoria' })
  ocrExtractedData: OcrExtractedData;

  @ApiProperty({ minimum: 0, maximum: 1 })
  @IsNumber()
  @Min(0)
  @Max(1)
  ocrConfidence: number;

  // Campos editados pelo usuário (podem diferir do extractedData):
  @ApiPropertyOptional()
  @IsOptional() @IsNumber() @Min(0)
  proposalCashAmount?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsInt() @Min(1)
  proposalInstallments?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsNumber() @Min(0)
  proposalInstallmentAmount?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsDateString()
  proposalDeadline?: string;
}
```

#### Lógica do service

```typescript
async confirmFromImage(userId: string, dto: ConfirmFromImageDto) {
  // 1. Verificação de ownership do objectKey (segurança)
  if (!dto.ocrObjectKey.startsWith(`${userId}/`)) {
    throw new ForbiddenException('object_not_owned');
  }

  // 2. Chama validator com os valores confirmados + contexto OCR
  return await this.validator.validateInternal({
    userId,
    debtId: dto.debtId,
    proposalCashAmount: dto.proposalCashAmount,
    proposalInstallments: dto.proposalInstallments,
    proposalInstallmentAmount: dto.proposalInstallmentAmount,
    proposalDeadline: dto.proposalDeadline ? new Date(dto.proposalDeadline) : undefined,

    ocrContext: {
      objectKey: dto.ocrObjectKey,
      extractedData: dto.ocrExtractedData,
      confidence: dto.ocrConfidence,
    },
  });
}
```

#### Regras

- **Quota NÃO conta de novo:** já foi contada no upload inicial. `OcrQuotaGuard` ausente intencionalmente
- **`OcrConsentGuard` aplicado:** usuário pode ter revogado consentimento entre upload e confirmação
- **Verificação de ownership:** `ocrObjectKey` começa com `{userId}/`; impede usuário A confirmar imagem de usuário B
- **`validator.validateInternal`** é o método interno (já chamado pelo `validate()` original); aceita `ocrContext` opcional que dispara persistência de `ocrObjectKey`, `ocrExtractedData`, `ocrConfidence`, `usedOcr=true` no `SettlementEvaluation`

---

### 14.2 HEIC rejeitado no MVP (BL-2)

Tipos aceitos: **`image/jpeg`, `image/png`, `image/webp`**. HEIC removido.

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

Mensagem de erro específica para HEIC (§9.1):

```
| Formato HEIC | 400 | invalid_format_heic | "iPhones precisam estar em modo 'Mais Compatível': Ajustes > Câmera > Formatos > Mais Compatível. Você também pode tirar um screenshot da foto e enviar." |
```

**Reavaliar pós-MVP** se métrica `ocr.errors.invalid_format` mostrar > 5% das tentativas vindas de HEIC.

---

### 14.3 Renomeação `ocrImageUrl` → `ocrObjectKey` (A-1)

Schema atualizado:

```prisma
model SettlementEvaluation {
  // ... campos existentes ...
  usedOcr           Boolean    @default(false) @map("used_ocr")
  ocrObjectKey      String?    @map("ocr_object_key") @db.VarChar(500)
  ocrExtractedData  Json?      @map("ocr_extracted_data")
  ocrConfidence     Decimal?   @map("ocr_confidence") @db.Decimal(3, 2)
}
```

Service gera signed URL sob demanda:

```typescript
async generateSignedUrl(objectKey: string, ttlSeconds = 900): Promise<string> {
  const { data, error } = await this.supabase.storage
    .from('ocr-uploads')
    .createSignedUrl(objectKey, ttlSeconds);

  if (error) throw new StorageError(`signed_url_failed: ${error.message}`);
  return data.signedUrl;
}
```

TTL padrão **15 minutos** (modal de confirmação). Para data export: **7 dias** (§14.7).

---

### 14.4 Setup do bucket via migration (A-2)

**Migration 15:**

```sql
-- 15. 20260617_create_ocr_bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('ocr-uploads', 'ocr-uploads', false, 10485760)  -- 10MB
ON CONFLICT (id) DO NOTHING;

-- Sem policy para anon/authenticated = bloqueado por default.
-- Apenas service_role acessa, conforme política do bucket privado.
```

Roda automaticamente no `prisma migrate deploy` no pre-start do Railway. Sem intervenção manual no dashboard.

---

### 14.5 Lock pessimista no `OcrQuotaGuard` (A-3)

```typescript
// modules/settlement-validator/guards/ocr-quota.guard.ts
@Injectable()
export class OcrQuotaGuard implements CanActivate {
  constructor(
    private readonly txRunner: TransactionRunner,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const userId = req.user.id;

    return this.txRunner.run(async (tx) => {
      // Lock no User pela duração da transaction (curta, < 50ms)
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

Dois requests simultâneos do mesmo usuário serializam no `FOR UPDATE`. Custo perceptível: < 50ms por request. Jobs de usuários diferentes não competem.

---

### 14.6 Signed URL TTL 15 minutos (A-7)

§3.1 atualizado:

```
- Signed URLs: geradas sob demanda
  - Modal de confirmação (frontend): TTL 15 minutos
  - Data Export (download): TTL 7 dias
```

Frontend, se receber 403 na signed URL (expirou enquanto usuário lia/editava), chama endpoint específico para gerar nova URL antes de confirmar.

---

### 14.7 Data Export inclui imagens OCR (A-6) — DECISÃO C1

Conformidade LGPD art. 18 V (portabilidade): titular tem direito a receber todos os dados pessoais. Imagens OCR são dados pessoais; auto-delete de 30 dias limita o escopo do export aos últimos 30 dias.

#### Implementação

```typescript
// modules/data-export/data-export.service.ts
async generateExport(userId: string): Promise<DataExportPayload> {
  // ... outros dados (User, Income, Expense, Debt, Payment, etc.) ...

  // Buscar evaluations com OCR dos últimos 30 dias
  const ocrEvaluations = await this.settlementRepo.findManyForExport({
    userId,
    usedOcr: true,
    evaluatedAt: { gte: subDays(new Date(), 30) },
  });

  // Gerar signed URLs para cada uma (TTL 7 dias)
  const ocrImages = await Promise.all(
    ocrEvaluations.map(async (ev) => ({
      evaluationId: ev.id,
      debtId: ev.debtId,
      capturedAt: ev.evaluatedAt.toISOString(),
      extractedData: ev.ocrExtractedData,
      confidence: ev.ocrConfidence ? Number(ev.ocrConfidence) : null,
      imageDownloadUrl: ev.ocrObjectKey
        ? await this.ocrService.generateSignedUrl(ev.ocrObjectKey, 7 * 24 * 3600)
        : null,
    }))
  );

  return {
    // ... outros campos ...
    ocrImages,
  };
}
```

#### Payload do export (estrutura)

```typescript
interface DataExportPayload {
  // ... campos existentes ...
  ocrImages: Array<{
    evaluationId: string;
    debtId: string;
    capturedAt: string;
    extractedData: OcrExtractedData;
    confidence: number | null;
    imageDownloadUrl: string | null; // signed URL TTL 7 dias
  }>;
}
```

#### Política

- DataExport completo expira em 30 dias (política já existente da §16 LGPD da Fase 3)
- Após DataExport expirar: usuário pode gerar novo, com URLs frescas se as imagens ainda existirem
- Se imagem já foi deletada (passou dos 30 dias do `OcrCleanupJob`): `imageDownloadUrl: null`

---

### 14.8 Env vars adicionadas (M-1)

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

Validação Zod no `envSchema` (§16.2 da Fase 4):

```typescript
OPENAI_API_KEY: z.string().startsWith('sk-'),
OCR_MODEL: z.string().default('gpt-4o-mini'),
OCR_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),
SUPABASE_URL: z.string().url(),
SUPABASE_SERVICE_ROLE_KEY: z.string().min(32),
```

App **falha no boot** se faltarem ou estiverem mal-formadas.

---

### 14.9 `OcrCostReportJob` mensal (M-2)

```typescript
// queues/processors/ocr-cost-report.processor.ts
@Injectable()
@Processor('motor-scheduled', { concurrency: 1 })
export class OcrCostReportProcessor extends BaseProcessor {
  async handle(): Promise<any> {
    const monthStart = startOfMonth(subMonths(new Date(), 1)); // mês anterior
    const monthEnd = endOfMonth(monthStart);
    const monthLabel = format(monthStart, 'yyyy-MM');

    const result = await this.prisma.settlementEvaluation.aggregate({
      where: {
        usedOcr: true,
        evaluatedAt: { gte: monthStart, lte: monthEnd },
      },
      _count: { id: true },
      _avg: { ocrConfidence: true },
    });

    const ocrsCount = result._count.id;
    const avgConfidence = Number(result._avg.ocrConfidence ?? 0);
    const estimatedCostUSD = ocrsCount * 0.01;
    const estimatedCostBRL = ocrsCount * 0.05;

    this.logger.info({
      month: monthLabel,
      ocrsCount,
      avgConfidence,
      estimatedCostUSD,
      estimatedCostBRL,
    }, 'ocr.cost_report.monthly');

    return { ocrsCount, estimatedCostBRL };
  }
}
```

**Cron:** mensal, dia 2 às 06:00 UTC (depois do `InterestRateUpdate` que roda dia 1º). Reporta o mês anterior completo.

Dashboard de logs (Sentry breadcrumb, Datadog ou Grafana) gera gráfico mensal a partir do log `ocr.cost_report.monthly`.

---

### 14.10 Aviso explícito de PII no consentimento (M-3)

Texto do §5.2 ganha **cláusula 6**:

```
6. VOCÊ É RESPONSÁVEL pelo conteúdo da imagem enviada.

   Inclua apenas a proposta de acordo. NÃO fotografe:
   - Documentos de identidade (RG, CNH, CPF, passaporte)
   - Rostos de outras pessoas
   - Cartões de crédito ou débito
   - Qualquer informação pessoal além da proposta

   O Quita não tem como detectar automaticamente se a imagem contém
   esse tipo de informação. Imagens enviadas com esses dados serão
   processadas e ficarão armazenadas por até 30 dias.
```

UI também mostra esse aviso como banner antes de abrir câmera.

#### Detecção automática registrada em `BACKLOG_POS_MVP.md`

```markdown
## Detecção automática de PII em imagens OCR

**Quando:** após primeiro relato de upload inadequado OU pré-launch de escala
(> 5k usuários Premium ativos).

**Tecnologias candidatas:**
- Google Vision SafeSearch + LandmarkDetection
- AWS Rekognition (DetectFaces + DetectModerationLabels)
- OpenAI Vision com prompt de pré-validação (chamada extra antes do parser)

**Custo estimado adicional:** US$ 0,005-0,010 por imagem (mais barato que
o OCR principal).
```

---

### 14.11 `OcrCleanupJob` documentado + tarefa pós-MVP (A-4)

§3.4 mantém implementação atual (list API + filter + delete em batches). Adicionar nota:

```markdown
**Nota de escala.** A implementação atual lista o bucket via Storage API em
batches de 100 objetos. Para buckets com mais de 50.000 objetos, a operação
pode demorar e atingir rate limit do Supabase.

**Migração futura:** quando bucket > 50.000 objetos, substituir por SQL direto:

```sql
DELETE FROM storage.objects
WHERE bucket_id = 'ocr-uploads'
  AND created_at < NOW() - INTERVAL '30 days';
```

Requer permissão service_role no banco. Registrar em BACKLOG_POS_MVP.md.
```

---

### 14.12 Constante `CONSENT_VERSIONS` (A-5)

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

Quando o texto do consentimento mudar materialmente, bumpar versão (`'1.0'` → `'1.1'`). Política de re-consentimento:
- Mudanças **materiais** (novos terceiros, nova finalidade): re-consentimento obrigatório de todos os usuários com versão anterior
- Mudanças **menores** (clarificação de texto): apenas registra nova versão; aceite anterior continua válido

`ConsentLog.version` registra qual versão foi aceita. Auditoria preservada.

---

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
      WHERE used_ocr = TRUE  -- partial index para query de quota

15. 20260617_create_ocr_bucket
    - INSERT INTO storage.buckets VALUES ('ocr-uploads', 'ocr-uploads', false, 10485760)
      ON CONFLICT (id) DO NOTHING
```

**Total acumulado de migrations: 15.**

---

### 14.14 Atualizações à tabela de jobs

| Job | Queue | Disparo |
|---|---|---|
| `OcrCleanupJob` | `motor-scheduled` | Cron diário 06:00 UTC |
| `OcrCostReportJob` | `motor-scheduled` | Cron mensal dia 2 às 06:00 UTC |

(Os 2 já estavam previstos como infraestrutura, agora estão consolidados na tabela de jobs.)

---

### 14.15 Resumo do impacto do patch v1.1

| Categoria | Total |
|---|---|
| Endpoints novos | 1 (`POST /settlements/validate-from-image/confirm`) |
| Schema modificado | `SettlementEvaluation` ganha 4 campos OCR |
| Migrations novas | 2 (14, 15) — total acumulado **15** |
| Constants novas | 1 (`CONSENT_VERSIONS`) |
| Env vars novas | 5 (`OPENAI_API_KEY`, `OCR_MODEL`, `OCR_TIMEOUT_MS`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) |
| Jobs novos | 2 (`OcrCleanupJob`, `OcrCostReportJob`) |
| Tipos de imagem aceitos | 3 (JPEG, PNG, WebP) — HEIC rejeitado |
| Bloqueadores resolvidos | 2 de 2 |
| Altos resolvidos | 7 de 7 |
| Médios resolvidos | 3 de 3 |
| LGPD: Data Export inclui imagens OCR | ✅ Conformidade art. 18 V |

---

*Fim do Patch v1.1.*
