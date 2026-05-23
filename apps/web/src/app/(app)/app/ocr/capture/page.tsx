"use client";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Select } from "@/components/Select";
import { useDebts } from "@/hooks/useDebts";
import { useOcrSignedUpload } from "@/hooks/useOcrQuota";
import { Camera, FileImage, Upload } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";

export default function OcrCapturePage() {
	const router = useRouter();
	const params = useSearchParams();
	const initialDebtId = params.get("debtId") ?? "";

	const { data: debts } = useDebts();
	const [debtId, setDebtId] = useState(initialDebtId);
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const fileRef = useRef<HTMLInputElement>(null);
	const cameraRef = useRef<HTMLInputElement>(null);
	const signedUpload = useOcrSignedUpload();

	const activeDebts = (debts ?? []).filter((d) => d.status !== "paid");

	async function handleFile(file: File) {
		if (!debtId) {
			setError("Escolha uma dívida primeiro.");
			return;
		}
		if (file.size > 5 * 1024 * 1024) {
			setError("Arquivo muito grande. Máximo 5MB.");
			return;
		}
		setError(null);
		setUploading(true);
		try {
			const contentType = file.type as "image/png" | "image/jpeg" | "image/jpg" | "image/webp";
			const { uploadUrl, key } = await signedUpload.mutateAsync(contentType);

			const putResp = await fetch(uploadUrl, {
				method: "PUT",
				body: file,
				headers: { "Content-Type": contentType },
			});
			if (!putResp.ok) {
				throw new Error("Upload para R2 falhou.");
			}

			router.push(`/app/ocr/confirm?debtId=${debtId}&key=${encodeURIComponent(key)}`);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Erro no upload.");
			setUploading(false);
		}
	}

	function onPick(e: React.ChangeEvent<HTMLInputElement>) {
		const f = e.target.files?.[0];
		if (f) handleFile(f);
	}

	return (
		<>
			<h1 className="text-[24px] font-bold mb-2">Envie a proposta</h1>
			<p className="text-[14px] text-[var(--color-ink-2)] mb-6">
				Tire foto ou envie imagem PNG/JPG até 5MB.
			</p>

			<Card className="p-6 mb-4">
				<div className="space-y-4">
					<Select label="Dívida" value={debtId} onChange={(e) => setDebtId(e.target.value)}>
						<option value="">Escolha…</option>
						{activeDebts.map((d) => (
							<option key={d.id} value={d.id}>
								{d.creditor} (R$ {(d.totalAmount - d.amountPaid).toFixed(2)} restante)
							</option>
						))}
					</Select>

					<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
						<button
							type="button"
							onClick={() => fileRef.current?.click()}
							disabled={!debtId || uploading}
							className="flex flex-col items-center gap-2 rounded-[12px] border border-dashed border-[var(--color-border)] p-6 hover:border-[var(--color-teal)] disabled:opacity-50 disabled:cursor-not-allowed"
						>
							<Upload className="w-6 h-6 text-[var(--color-teal)]" />
							<div className="text-[14px] font-semibold">Enviar arquivo</div>
							<div className="text-[11px] text-[var(--color-ink-3)]">PNG, JPG, WEBP</div>
						</button>

						<button
							type="button"
							onClick={() => cameraRef.current?.click()}
							disabled={!debtId || uploading}
							className="flex flex-col items-center gap-2 rounded-[12px] border border-dashed border-[var(--color-border)] p-6 hover:border-[var(--color-teal)] disabled:opacity-50 disabled:cursor-not-allowed"
						>
							<Camera className="w-6 h-6 text-[var(--color-teal)]" />
							<div className="text-[14px] font-semibold">Tirar foto</div>
							<div className="text-[11px] text-[var(--color-ink-3)]">Câmera do celular</div>
						</button>
					</div>

					<input
						ref={fileRef}
						type="file"
						accept="image/png,image/jpeg,image/webp"
						className="hidden"
						onChange={onPick}
					/>
					<input
						ref={cameraRef}
						type="file"
						accept="image/*"
						capture="environment"
						className="hidden"
						onChange={onPick}
					/>

					{uploading ? (
						<div className="flex items-center gap-2 text-[13px] text-[var(--color-ink-2)]">
							<FileImage className="w-4 h-4" /> Enviando…
						</div>
					) : null}
				</div>
			</Card>

			{error ? (
				<div className="rounded-[8px] border border-[var(--color-danger-bg)] bg-[var(--color-danger-bg)] px-4 py-3 text-[13px] text-[var(--color-danger-fg)] mb-4">
					{error}
				</div>
			) : null}

			<div className="flex justify-between">
				<Button variant="ghost" onClick={() => router.back()}>
					Voltar
				</Button>
			</div>
		</>
	);
}
