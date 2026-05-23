-- AlterTable
ALTER TABLE "settlement_evaluations" ADD COLUMN     "ocr_confidence" "ConfidenceLevel",
ADD COLUMN     "ocr_extracted_data" JSONB,
ADD COLUMN     "ocr_image_url" VARCHAR(500),
ADD COLUMN     "used_ocr" BOOLEAN NOT NULL DEFAULT false;

