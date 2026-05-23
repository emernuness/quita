# Quita — Bridge OCR Premium (entre Fase 4 e Fase 5)

> **Status:** rascunho para validação
> **Data:** 17 de maio de 2026
> **Insumo:** Fase 4 v1.1 aprovada + direcionamentos da Fase 1 v2 e Fase 3 v1.1
> **Escopo:** feature Premium de OCR para proposta de acordo
> **Não cobre:** UI/UX (Fase 5), outras features Premium (Chat com IA — v2)

---

## Sumário executivo

O Bridge especifica a única feature Premium do MVP que **toca infraestrutura externa**: OCR de proposta de acordo. Usuário Premium tira foto/screenshot da proposta de credor (carta, e-mail, captura de WhatsApp); a imagem vai para **OpenAI Vision API**, retorna JSON estruturado, alimenta o `settlement-validator` da Fase 3.

A imagem fica armazenada em **Supabase Storage** por 30 dias e depois é deletada automaticamente. Antes do **primeiro upload**, o usuário aceita consentimento LGPD específico registrado em `ConsentLog`.

**Quota:** Free 0/mês (UI esconde o botão), Premium 5/mês (contagem dinâmica via `SettlementEvaluation`).

**Custo estimado por usuário Premium ativo:** ~R$ 0,25/mês em OpenAI (5 imagens × ~R$ 0,05 cada com `gpt-4o-mini`). Cabe folgado nos R$ 9,90/mês da Premium.

---

## 1. Princípios

**1.1 OCR é conveniência, não obrigatório.** A validação manual (digitar valores) continua disponível e é o caminho padrão. OCR economiza tempo e reduz erro de digitação.

**1.2 Confiança calibrada.** OpenAI Vision retorna `confidence`. Abaixo de 0.7 → motor pede confirmação manual de cada campo extraído. Acima de 0.7 → mostra valores pré-preenchidos editáveis.

**1.3 LGPD por design.** A imagem é dado financeiro sensível. Consentimento específico, armazenamento privado, retenção limitada, log de auditoria, direito de revogação. Tudo registrado.

**1.4 Falha visível, recuperação manual.** OpenAI fora do ar → modal explica + oferece "Digitar manualmente". Nunca prende o usuário.

**1.5 Sem treinamento da OpenAI nos dados.** API tier da OpenAI explicitamente não usa dados para treinar modelos (padrão da plataforma). Validar nos Termos antes do lançamento.

---

## 2. Provider: OpenAI Vision

### 2.1 Por que OpenAI Vision (`gpt-4o-mini`)

| Critério | OpenAI Vision (gpt-4o-mini) | Google Vision OCR | Tesseract OSS |
|---|---|---|---|
| Compreensão semântica | ✅ Entende "5x de R$ 200" como `installments=5, installmentAmount=200` | ❌ Só extrai texto bruto | ❌ Só extrai texto bruto |
| Custo por imagem | ~US$ 0,01 (R$ 0,05) | US$ 0,0015 | Gratuito |
| Output estruturado | ✅ JSON direto via prompt | ❌ Precisa parser próprio | ❌ Precisa parser próprio |
| Multilingual PT-BR | ✅ Nativo | ✅ Nativo | Médio |
| Manuscritos | ✅ Aceitável | ✅ Bom | ❌ Ruim |
| Captura de tela WhatsApp | ✅ Ótimo | OK | Ruim |
| Termos de Uso (treinamento) | ✅ API não treina nos dados | ✅ Não treina | n/a |

**Decisão.** `gpt-4o-mini` com Vision. Compreensão semântica direta vale mais que economia de centavos em OCR puro. Resultado vai direto para o `settlement-validator` sem parser intermediário.

### 2.2 Modelo e API

- **Modelo:** `gpt-4o-mini` (entrada multimodal: texto + imagem)
- **Endpoint:** `POST https://api.openai.com/v1/chat/completions`
- **Custo:** ~US$ 0,15 / 1M input tokens + US$ 0,60 / 1M output tokens (preços atuais)
- **Imagem típica:** ~1.500 tokens input + 200 tokens output ≈ US$ 0,01

### 2.3 Prompt determinístico

```typescript
const OCR_PROMPT = `Você é um assistente que extrai dados estruturados de propostas
de acordo de dívida brasileiras. A imagem pode ser uma carta de credor, e-mail
impresso, captura de tela de chat (WhatsApp, SMS) ou mensagem de aplicativo de
banco.

Extraia os seguintes campos. Use null para qualquer campo que não esteja
explicitamente mencionado ou que você não tenha certeza:

- cashAmount: valor à vista oferecido (número decimal em Reais, sem símbolo)
- installments: número total de parcelas
- installmentAmount: valor de cada parcela (número decimal em Reais)
- deadline: prazo de validade da proposta (formato ISO 8601 YYYY-MM-DD)
- creditor: nome do credor (banco, financeira, loja)
- originalDebt: valor da dívida original mencionada (número decimal em Reais)
- confidence: sua confiança na extração entre 0.0 (incerta) e 1.0 (clara)

REGRAS:
1. Responda APENAS com JSON válido, sem texto adicional antes ou depois.
2. Se a imagem não parece uma proposta de acordo, retorne todos campos null
   e confidence: 0.
3. Para valores em Reais, ignore "R$" e separadores de milhar. Use ponto como
   separador decimal.
4. Se houver múltiplas opções (ex: "à vista R$ 1500 ou 10x R$ 200"),
   extraia ambas (cashAmount E installments+installmentAmount).
5. Se o prazo for relativo ("em 15 dias"), calcule a data ISO assumindo
   que a foto foi tirada hoje.

Formato esperado:
{"cashAmount":number|null,"installments":number|null,"installmentAmount":number|null,"deadline":string|null,"creditor":string|null,"originalDebt":number|null,"confidence":number}
`;
```

### 2.4 Chamada à API

```typescript
async function callOpenAIVision(imageBase64: string): Promise<OcrExtractedData> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${this.config.get('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: OCR_PROMPT },
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${imageBase64}`, detail: 'high' },
            },
          ],
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 500,
      temperature: 0, // determinístico
    }),
    signal: AbortSignal.timeout(30_000), // 30s timeout
  });

  if (!response.ok) {
    throw new OcrProviderError(`OpenAI Vision failed: ${response.status}`);
  }

  const data = await response.json();
  const rawContent = data.choices[0].message.content;
  return ocrExtractedDataSchema.parse(JSON.parse(rawContent));
}
```

### 2.5 Validação Zod do output

```typescript
// @quita/shared/src/schemas/ocr.schema.ts
export const ocrExtractedDataSchema = z.object({
  cashAmount: z.number().positive().nullable(),
  installments: z.number().int().positive().max(120).nullable(),
  installmentAmount: z.number().positive().nullable(),
  deadline: z.string().datetime().nullable().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable()),
  creditor: z.string().min(2).max(255).nullable(),
  originalDebt: z.number().positive().nullable(),
  confidence: z.number().min(0).max(1),
});

export type OcrExtractedData = z.infer<typeof ocrExtractedDataSchema>;
```

Se o output da OpenAI não passa no Zod, joga `OcrParseError` → frontend mostra modal "Não consegui ler a imagem. Que tal digitar manualmente?".

---

## 3. Storage: Supabase Storage

### 3.1 Setup

- **Bucket:** `ocr-uploads` (privado, sem acesso público)
- **Path pattern:** `{userId}/{uuid}.{ext}`
  - Não usar nome original do arquivo (evita vazar PII no path)
  - UUID v4 gerado no backend
  - Extensão preservada (jpg/png/webp/heic)
- **Acesso:** apenas via service role no backend; frontend nunca recebe URL direta
- **Signed URLs:** geradas sob demanda, TTL 5 minutos (para preview no modal de confirmação)

### 3.2 Política RLS (Row Level Security)

```sql
-- Bucket criado via Supabase dashboard ou migration:
INSERT INTO storage.buckets (id, name, public) VALUES ('ocr-uploads', 'ocr-uploads', false);

-- Apenas service_role lê/escreve. Nenhuma policy para anon ou authenticated:
-- (sem policy = bloqueado por default)
```

### 3.3 Upload

```typescript
async uploadImage(userId: string, file: Express.Multer.File): Promise<string> {
  const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
  const objectKey = `${userId}/${randomUUID()}${ext}`;

  const { data, error } = await this.supabase.storage
    .from('ocr-uploads')
    .upload(objectKey, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) throw new StorageError(`Upload failed: ${error.message}`);
  return objectKey;
}
```

### 3.4 Auto-delete em 30 dias

Job diário (`OcrCleanupJob`) lista objetos no bucket com mais de 30 dias e os deleta.

```typescript
// queues/processors/ocr-cleanup.processor.ts
@Processor('motor-scheduled', { concurrency: 1 })
export class OcrCleanupProcessor extends BaseProcessor {
  async handle(): Promise<any> {
    const cutoff = subDays(new Date(), 30);

    // Lista objetos do bucket em batches
    let totalDeleted = 0;
    let offset = 0;
    const batchSize = 100;

    while (true) {
      const { data: objects } = await this.supabase.storage
        .from('ocr-uploads')
        .list('', { limit: batchSize, offset, sortBy: { column: 'created_at', order: 'asc' } });

      if (!objects || objects.length === 0) break;

      const toDelete = objects.filter(o => new Date(o.created_at!) < cutoff);
      if (toDelete.length === 0) break;

      const paths = toDelete.map(o => o.name);
      await this.supabase.storage.from('ocr-uploads').remove(paths);
      totalDeleted += toDelete.length;

      if (objects.length < batchSize) break;
      offset += batchSize;
    }

    this.logger.info({ totalDeleted, cutoff }, 'ocr.cleanup.done');
    return { totalDeleted };
  }
}
```

**Cron:** diário 06:00 UTC (sucessor ao `RefreshTokenCleanup` das 05:00).

### 3.5 Tipos e limites

| Tipo MIME aceito | Extensão | Razão |
|---|---|---|
| `image/jpeg` | `.jpg` / `.jpeg` | Padrão de câmeras |
| `image/png` | `.png` | Screenshots |
| `image/webp` | `.webp` | Android moderno |
| `image/heic` | `.heic` | iOS — converter para JPEG no backend antes de enviar para OpenAI |

**Tamanho máximo:** 10 MB. Multer config:

```typescript
@UseInterceptors(FileInterceptor('image', {
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new BadRequestException('invalid_format'), false);
    }
    cb(null, true);
  },
}))
```

---

## 4. Quota: Free vs Premium

### 4.1 Política

| Plano | Quota OCR/mês | UI |
|---|---|---|
| Free | 0 | Botão "Tirar foto" escondido; aparece como "Premium 🔒" desabilitado |
| Premium | 5 | Botão habilitado; mostra "X de 5 usados este mês" |

### 4.2 Contagem dinâmica via `SettlementEvaluation`

Não precisa de campo dedicado em `User`. A contagem é uma query:

```typescript
async getOcrUsageThisMonth(userId: string): Promise<number> {
  return this.prisma.settlementEvaluation.count({
    where: {
      userId,
      usedOcr: true,
      evaluatedAt: { gte: startOfMonth(new Date()) },
    },
  });
}
```

`SettlementEvaluation.usedOcr` (Boolean, default false) já estava previsto no Patch v1.1 da Fase 3 (§20.10). Marca-se `true` quando a evaluation veio de OCR.

### 4.3 Guard de quota

```typescript
// modules/settlement-validator/guards/ocr-quota.guard.ts
@Injectable()
export class OcrQuotaGuard implements CanActivate {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly settlementRepo: SettlementEvaluationRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const userId = req.user.id;
    const user = await this.userRepo.findById(userId);

    if (user.planType !== 'premium') {
      throw new PaymentRequiredException('ocr_premium_only');
    }

    const usageThisMonth = await this.settlementRepo.countOcrUsageThisMonth(userId);
    if (usageThisMonth >= 5) {
      throw new PaymentRequiredException('ocr_quota_exceeded');
    }

    return true;
  }
}
```

`PaymentRequiredException` retorna **HTTP 402** com payload claro.

---

## 5. LGPD: consentimento específico

### 5.1 Tipo de consentimento

Reaproveita a tabela `ConsentLog` (já existe). Novo `consentType`: `ocr_data_processing`.

### 5.2 Texto do consentimento

```
PROCESSAMENTO DE IMAGEM PARA OCR

Ao tirar foto ou enviar imagem de uma proposta de acordo, você concorda que:

1. A imagem será enviada para a OpenAI (provedor de inteligência artificial)
   para extração automática dos valores e prazos da proposta.

2. A OpenAI não usa imagens da nossa conta de API para treinar seus modelos
   (conforme política atual da OpenAI Platform).

3. A imagem original ficará armazenada no nosso servidor por até 30 dias e
   depois será descartada automaticamente. Não será compartilhada com outros
   parceiros nem usada para outros fins.

4. Você pode revogar este consentimento a qualquer momento em Configurações
   > Privacidade. Após revogar, futuras imagens não serão aceitas.

5. Os dados extraídos da imagem (valores, prazos) são tratados como qualquer
   outro dado financeiro do Quita, conforme nossa Política de Privacidade.

Ao continuar, você confirma que leu e concorda com este processamento.

[ ] Li e concordo
[Botão: Cancelar]   [Botão: Concordar e continuar]
```

### 5.3 Fluxo de aceite

1. Usuário clica em "Tirar foto da proposta" pela **primeira vez** (no app)
2. Frontend chama `GET /api/v1/consent/check?type=ocr_data_processing`
3. Backend responde `{ accepted: false }` na primeira vez
4. Frontend exibe modal de consentimento
5. Se aceita: `POST /api/v1/consent/accept { type: 'ocr_data_processing', version: '1.0' }`
6. Backend grava `ConsentLog { userId, consentType, accepted: true, version: '1.0', ipAddress, userAgent }`
7. Frontend continua para câmera/upload
8. Próximas vezes: `check` retorna `{ accepted: true }`, fluxo pula o modal

### 5.4 Revogação

```typescript
@Post('consent/revoke')
@UseGuards(JwtAuthGuard)
async revokeConsent(@CurrentUser() user, @Body() dto: { type: string }) {
  await this.consentRepo.create({
    userId: user.id,
    consentType: dto.type,
    accepted: false,
    version: this.getCurrentVersion(dto.type),
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });
}
```

Cada aceite/revogação cria nova linha em `ConsentLog` (não sobrescreve). Histórico completo preservado.

Após revogação: `OcrQuotaGuard` checa o último `ConsentLog` com `consentType='ocr_data_processing'`; se `accepted: false`, bloqueia com `403 Forbidden` e `code: 'consent_revoked'`.

---

## 6. Fluxo end-to-end

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Usuário Premium abre "Validar acordo" em dívida X        │
│    UI: botão "📷 Tirar foto da proposta"                     │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Primeira vez? → modal de consentimento LGPD              │
│    POST /api/v1/consent/check?type=ocr_data_processing       │
└─────────────────────────┬───────────────────────────────────┘
                          │ aceito
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. UI abre câmera ou input de arquivo                       │
│    Usuário tira foto / seleciona imagem                     │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. POST /api/v1/settlements/validate-from-image              │
│    Headers: Cookie httpOnly (auth)                          │
│    Body: multipart/form-data (image + debtId)               │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. OcrQuotaGuard:                                           │
│    - planType === 'premium' ?                                │
│    - usageThisMonth < 5 ?                                    │
│    - consent accepted (latest) ?                            │
└─────────────────────────┬───────────────────────────────────┘
                          │ OK
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. SettlementValidatorService.validateFromImage:            │
│    a) Converte HEIC → JPEG (se necessário, via sharp)        │
│    b) Upload no Supabase Storage → objectKey                │
│    c) Envia base64 para OpenAI Vision                       │
│    d) Valida output com Zod                                 │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. Se confidence < 0.7:                                      │
│    Retorna 200 com { needsManualConfirmation: true,         │
│                       extractedData, imageSignedUrl }       │
│    UI mostra modal com campos pré-preenchidos EDITÁVEIS     │
└─────────────────────────┬───────────────────────────────────┘
                          │ confidence >= 0.7
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. Chama settlementValidator.validate(extractedData, debtId)│
│    Cria SettlementEvaluation com usedOcr=true,              │
│      ocrImageUrl=objectKey, ocrExtractedData=JSON           │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 9. Retorna 201 com {                                         │
│      extractedData, validation: SettlementValidatorOutput,  │
│      evaluationId, imageSignedUrl (TTL 5min)               │
│    }                                                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Contratos TypeScript

### 7.1 Service novo: `OcrService`

```typescript
// modules/ocr/ocr.module.ts
@Module({
  imports: [HttpModule, ConfigModule, SupabaseStorageModule],
  providers: [OcrService, OpenAiVisionClient],
  exports: [OcrService],
})
export class OcrModule {}

// modules/ocr/ocr.service.ts
export interface OcrService {
  uploadAndExtract(userId: string, file: Express.Multer.File): Promise<OcrResult>;
  generateSignedUrl(objectKey: string, ttlSeconds?: number): Promise<string>;
}

export interface OcrResult {
  objectKey: string;
  extractedData: OcrExtractedData;
  imageSignedUrl: string;
}
```

### 7.2 Extensão do `SettlementValidatorService`

```typescript
// modules/settlement-validator/settlement-validator.service.ts
export interface SettlementValidatorService {
  // ... métodos existentes ...

  validateFromImage(
    userId: string,
    debtId: string,
    file: Express.Multer.File,
  ): Promise<SettlementValidatorImageOutput>;
}

export interface SettlementValidatorImageOutput {
  extractedData: OcrExtractedData;
  needsManualConfirmation: boolean;
  validation?: SettlementValidatorOutput; // só se confidence >= 0.7
  imageSignedUrl: string;
  evaluationId?: string; // só se confidence >= 0.7
}
```

### 7.3 Controller endpoint

```typescript
// modules/settlement-validator/settlement-validator.controller.ts
@Controller('settlements')
export class SettlementValidatorController {
  @Post('validate-from-image')
  @UseGuards(JwtAuthGuard, OcrQuotaGuard)
  @UseInterceptors(FileInterceptor('image', { /* ... limits da §3.5 ... */ }))
  @Throttle({ default: { limit: 5, ttl: 60_000 } }) // 5 OCRs por minuto por user
  async validateFromImage(
    @CurrentUser() user,
    @Body() dto: ValidateFromImageDto,
    @UploadedFile() image: Express.Multer.File,
  ): Promise<SettlementValidatorImageOutput> {
    if (!image) throw new BadRequestException('image_required');
    return await this.validator.validateFromImage(user.id, dto.debtId, image);
  }
}

// dto/validate-from-image.dto.ts
export class ValidateFromImageDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  debtId: string;
}
```

---

## 8. Atualizações de schema

Já previstas no Patch v1.1 da Fase 3 (§20.10), agora detalhadas:

```prisma
model SettlementEvaluation {
  // ... campos existentes ...
  usedOcr           Boolean    @default(false) @map("used_ocr")
  ocrImageUrl       String?    @map("ocr_image_url") @db.VarChar(500)
  ocrExtractedData  Json?      @map("ocr_extracted_data")
  ocrConfidence     Decimal?   @map("ocr_confidence") @db.Decimal(3, 2)
}
```

**Migration 14** (após 13 do refresh token):

```
14. 20260617_add_ocr_fields_to_settlement_evaluation
    - ALTER TABLE settlement_evaluations ADD COLUMN used_ocr BOOLEAN NOT NULL DEFAULT FALSE
    - ALTER TABLE settlement_evaluations ADD COLUMN ocr_image_url VARCHAR(500) NULL
    - ALTER TABLE settlement_evaluations ADD COLUMN ocr_extracted_data JSONB NULL
    - ALTER TABLE settlement_evaluations ADD COLUMN ocr_confidence DECIMAL(3, 2) NULL
    - CREATE INDEX idx_settlement_evaluations_user_id_used_ocr_evaluated_at
      ON settlement_evaluations(user_id, used_ocr, evaluated_at)
      WHERE used_ocr = TRUE  -- partial index
```

O partial index acelera a query de quota (`countOcrUsageThisMonth`).

---

## 9. Tratamento de erros

### 9.1 Mapa de erros

| Cenário | HTTP | Code | Mensagem usuário |
|---|---|---|---|
| Usuário Free | 402 | `ocr_premium_only` | "OCR de proposta é exclusivo do Premium. Faça upgrade para usar." |
| Quota mensal estourada | 402 | `ocr_quota_exceeded` | "Você usou seus 5 OCRs deste mês. Reinicia no dia 1º." |
| Consentimento não dado | 403 | `consent_required` | (frontend dispara modal de consentimento, não exibe erro) |
| Consentimento revogado | 403 | `consent_revoked` | "Você revogou o consentimento de OCR. Habilite em Configurações > Privacidade para usar." |
| Imagem > 10 MB | 413 | `image_too_large` | "Imagem grande demais. Tente uma foto menor (máx 10 MB)." |
| Formato inválido | 400 | `invalid_format` | "Formato não aceito. Use JPG, PNG ou WebP." |
| OpenAI Vision retornou 4xx (rate limit, malformado) | 429 | `ocr_provider_busy` | "Estamos com lentidão para processar imagens. Tente em alguns minutos." |
| OpenAI Vision retornou 5xx ou timeout | 503 | `ocr_provider_unavailable` | "Serviço de OCR temporariamente fora. Você pode digitar manualmente?" |
| Output da OpenAI não passa no Zod | 422 | `ocr_parse_failed` | "Não consegui ler essa imagem. Que tal digitar manualmente?" |
| `confidence < 0.7` | 200 | `needs_manual_confirmation` | (não é erro — UI mostra campos editáveis pré-preenchidos) |
| Imagem confidence 0 (não é proposta) | 200 | `not_a_proposal` | "Essa imagem não parece uma proposta de acordo. Tem certeza?" |
| Erro de upload no Storage | 500 | `storage_failed` | "Falha ao salvar a imagem. Tente novamente." |
| Erro genérico | 500 | `internal_error` | "Algo deu errado. Tente novamente em alguns minutos." |

### 9.2 Degradação graceful

Quando algo falha entre `image_too_large` e `internal_error`, o frontend **mantém** o estado do modal do `settlement-validator` e oferece botão "Digitar manualmente" que pula direto para o formulário tradicional. Usuário nunca fica preso.

---

## 10. Custos e monitoramento

### 10.1 Estimativa por mês

| Item | Cálculo | R$/mês |
|---|---|---|
| OpenAI Vision (por usuário Premium ativo, 5 OCRs/mês) | 5 × R$ 0,05 | R$ 0,25 |
| Supabase Storage (5 imagens × ~500KB = 2.5MB acumulados, ainda mais 30 dias = 2.5MB) | ~2.5MB armazenado | R$ 0,00 (free tier 1GB) |
| Para 1.000 Premium ativos | 1.000 × R$ 0,25 | R$ 250 |

A R$ 9,90/mês × 1.000 Premium = **R$ 9.900 de receita**, custo OCR **R$ 250** = 2.5% do receita Premium. Folgado.

### 10.2 Métricas a observar

| Métrica | Onde | Alerta se |
|---|---|---|
| `ocr.requests.count` | Pino + Sentry tag | n/a (volume) |
| `ocr.requests.latency_p95` | Pino | > 30s (OpenAI lento) |
| `ocr.confidence.avg` | Pino | < 0.5 (modelo regredindo ou imagens ruins) |
| `ocr.errors.openai_5xx` | Sentry | > 10 em 1h |
| `ocr.errors.parse_failed` | Sentry | > 5% das requests |
| `ocr.cost_estimate.monthly` | Manual | > R$ 500 (sinal de aumento de Premium) |

---

## 11. Estratégia de testes

### 11.1 Unit tests

- `OcrService.uploadAndExtract` com `OpenAiVisionClient` mockado retornando outputs canônicos
- Validação Zod do output
- Conversão HEIC → JPEG via sharp
- `OcrQuotaGuard` com cenários: Free, Premium sem quota, Premium com quota OK, consent revogado

### 11.2 Integration tests

- Pipeline end-to-end com OpenAI mockado:
  - Imagem válida com confidence alta → cria evaluation com `usedOcr=true`
  - Imagem com confidence baixa → retorna `needsManualConfirmation: true` sem criar evaluation
  - Imagem mal formada → erro 422
- Upload no Supabase Storage com bucket de teste

### 11.3 E2E (sob demanda, não no CI)

- Upload real de 5-10 fixtures (capturas reais de propostas anonimizadas)
- Verifica confidence média > 0.7

### 11.4 Fixtures de imagem

Pasta `apps/api/test/fixtures/ocr-images/`:
- `proposta-banco-clara.jpg` — carta formal, alta confidence esperada
- `proposta-whatsapp.png` — captura de chat, média confidence
- `proposta-rabiscada.jpg` — manuscrita, baixa confidence
- `nao-eh-proposta.jpg` — imagem aleatória, confidence 0

---

## 12. Riscos e contingências

| Risco | Prob | Impacto | Mitigação |
|---|---|---|---|
| OpenAI muda Termos e passa a treinar nos dados | Baixa | Alto (LGPD) | Monitorar TOS; rotina trimestral de validação; alternativa Google Vision pronta |
| OpenAI Vision retorna alucinação (valores inventados) | Média | Médio | `temperature: 0` + Zod strict + confidence threshold; manual override sempre disponível |
| Custo OpenAI escala muito (sucesso do Premium) | Baixa | Médio | Quota mensal já implementada; aumentar para 10/mês se preciso (custo R$ 0,50/user) |
| Imagem com dado pessoal sensível além da proposta (rosto, RG visível) | Média | Alto | Política de privacidade alerta; auto-delete 30 dias; nunca expor em logs |
| OpenAI Vision indisponível (incidente) | Baixa | Médio | Fallback: modal "digitar manualmente"; Sentry alert |
| Supabase Storage cresce sem limite | Baixa | Médio | Cron diário de cleanup; alerta se bucket > 5GB |
| Usuário envia 100 imagens em segundos (abuse) | Média | Baixo | `Throttle 5/min` no endpoint + quota mensal |
| Imagem maliciosa (zip-bomb disfarçado de JPEG, exploit em parser) | Baixa | Alto | Multer já valida MIME type; sharp valida conteúdo; OpenAI rejeita não-imagens |
| Usuário Free descobre endpoint e tenta usar via Postman | Baixa | Baixo | `OcrQuotaGuard` valida planType antes de qualquer processamento |

---

## 13. Próximos passos

Com o Bridge OCR Premium especificado, o caminho continua para a **Fase 5 — Telas Web (Next.js)**:

- Wireframes de cada nova tela (Espelho, Plano do Mês, Cadastro de Dívida, Avaliar Acordo com OCR, etc.)
- Como pedir informações pesadas de forma leve (refinamento progressivo)
- Estados de loading, erro, empty para o OCR
- Copy final em PT-BR de cada modal/banner
- Plano de beta privado com 10-20 pessoas endividadas reais

**Itens da Fase 5 que dependem deste Bridge:**
- Modal de consentimento LGPD para OCR (texto da §5.2)
- Modal de "tirar foto / selecionar arquivo" com preview
- Modal de confirmação manual quando `confidence < 0.7`
- Tela de upgrade Premium quando Free tenta usar OCR
- Banner "X de 5 OCRs usados este mês" no menu

---

*Fim do Bridge OCR Premium.*
