import { colors, spacing } from "@/theme/tokens";
import { onboardingDebtSchema } from "@quita/shared";
import type { OnboardingDebtInput } from "@quita/shared";
import DateTimePicker from "@react-native-community/datetimepicker";
import type { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Feather } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	KeyboardAvoidingView,
	LayoutAnimation,
	Platform,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	UIManager,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSaveDebts } from "../../src/hooks/useOnboarding";
import { maskCurrency, unmaskCurrency } from "../../src/utils/masks";
import { validateWithZod } from "../../src/utils/validation";

// --- Android LayoutAnimation enablement ---
if (
	Platform.OS === "android" &&
	UIManager.setLayoutAnimationEnabledExperimental
) {
	UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- Constants ---

const STATUS_OPTIONS = ["ATRASADA", "NEGOCIANDO", "EM DIA"] as const;
type DebtStatusLabel = (typeof STATUS_OPTIONS)[number];

const JUROS_OPTIONS = ["Sim", "Não", "Não sei"] as const;
type JurosOption = (typeof JUROS_OPTIONS)[number];

const NATURE_OPTIONS = [
	{
		key: "installment" as const,
		label: "PARCELA TODO MÊS",
		subtitle: "Financiamento, carnê, cartão parcelado",
	},
	{
		key: "recurring" as const,
		label: "CONTA FIXA",
		subtitle: "Condomínio, aluguel, internet",
	},
	{
		key: "one_time" as const,
		label: "PAGO SÓ UMA VEZ",
		subtitle: "Empréstimo pessoal, dívida avulsa",
	},
] as const;
type NatureKey = (typeof NATURE_OPTIONS)[number]["key"];

const STATUS_MAP: Record<DebtStatusLabel, string> = {
	ATRASADA: "overdue",
	NEGOCIANDO: "renegotiated",
	"EM DIA": "on_time",
};

const JUROS_MAP: Record<JurosOption, boolean | null> = {
	Sim: true,
	Não: false,
	"Não sei": null,
};

const OVERDUE_PILLS = [1, 2, 3, 4, 5] as const;

type CategoryInfo = { id: string; name: string; icon: string };

function formatBRL(value: number): string {
	return `R$ ${value.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}

/** Format Date → DD/MM/AAAA for display */
function formatDateDisplay(date: Date): string {
	const d = String(date.getDate()).padStart(2, "0");
	const m = String(date.getMonth() + 1).padStart(2, "0");
	const y = date.getFullYear();
	return `${d}/${m}/${y}`;
}

/** Format Date → YYYY-MM-DD for API/Zod */
function formatDateISO(date: Date): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, "0");
	const d = String(date.getDate()).padStart(2, "0");
	return `${y}-${m}-${d}`;
}

/** Trigger smooth layout animation for progressive disclosure */
function animateLayout() {
	LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
}

// --- Component ---

export default function DebtDetailScreen() {
	const router = useRouter();
	const { categories: categoriesJson } = useLocalSearchParams<{
		categories: string;
	}>();
	const saveDebts = useSaveDebts();

	const allCategories: CategoryInfo[] = useMemo(() => {
		try {
			return JSON.parse(categoriesJson || "[]");
		} catch {
			return [];
		}
	}, [categoriesJson]);

	const [categoryIndex, setCategoryIndex] = useState(0);
	const currentCategory = allCategories[categoryIndex];
	const isLastCategory = categoryIndex === allCategories.length - 1;

	const [collectedDebts, setCollectedDebts] = useState<OnboardingDebtInput[]>(
		[],
	);
	const debtsForCurrentCategory = useMemo(
		() => collectedDebts.filter((d) => d.categoryId === currentCategory?.id),
		[collectedDebts, currentCategory?.id],
	);

	// Form state
	const [credor, setCredor] = useState("");
	const [nature, setNature] = useState<NatureKey | null>(null);
	const [status, setStatus] = useState<DebtStatusLabel>("ATRASADA");
	const [overdueMonths, setOverdueMonths] = useState<number | null>(null);
	const [overdueCustom, setOverdueCustom] = useState("");
	const [valorMensal, setValorMensal] = useState("");
	const [valorTotal, setValorTotal] = useState("");
	const [totalParcelas, setTotalParcelas] = useState("");
	const [parcelaAtual, setParcelaAtual] = useState("");
	const [juros, setJuros] = useState<JurosOption | null>(null);
	const [dueDate, setDueDate] = useState<Date | null>(null);
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [errors, setErrors] = useState<Record<string, string>>({});

	const isOverdue = status === "ATRASADA";
	const effectiveOverdueMonths =
		overdueMonths === -1
			? Number.parseInt(overdueCustom, 10) || null
			: overdueMonths;

	// --- Progressive Disclosure ---
	// Block 1 (always visible): CREDOR + NATUREZA
	// Block 2 (when nature selected): SITUAÇÃO + overdue + nature-specific fields
	// Block 3 (when block 2 complete): VALOR TOTAL + JUROS + VENCIMENTO
	const showBlock2 = nature !== null;
	const showBlock3 =
		nature === "one_time" || valorMensal.length > 0;

	// Auto-suggestion for valor total
	const autoSuggestion = useMemo(() => {
		const monthly = unmaskCurrency(valorMensal);
		if (
			nature === "recurring" &&
			monthly > 0 &&
			effectiveOverdueMonths &&
			effectiveOverdueMonths > 0
		) {
			return monthly * effectiveOverdueMonths;
		}
		if (nature === "installment" && monthly > 0) {
			const total = Number.parseInt(totalParcelas, 10);
			const current = Number.parseInt(parcelaAtual, 10);
			if (total > 0 && current > 0 && current <= total) {
				return monthly * (total - current + 1);
			}
		}
		return null;
	}, [
		valorMensal,
		nature,
		effectiveOverdueMonths,
		totalParcelas,
		parcelaAtual,
	]);

	const resetForm = useCallback(() => {
		setCredor("");
		setNature(null);
		setStatus("ATRASADA");
		setOverdueMonths(null);
		setOverdueCustom("");
		setValorMensal("");
		setValorTotal("");
		setTotalParcelas("");
		setParcelaAtual("");
		setJuros(null);
		setDueDate(null);
		setShowDatePicker(false);
		setErrors({});
	}, []);

	const buildDebtData = useCallback(() => {
		const totalAmount = unmaskCurrency(valorTotal);
		const monthlyAmount = unmaskCurrency(valorMensal);
		const dueDateISO = dueDate ? formatDateISO(dueDate) : undefined;
		const parsedTotalParcelas = Number.parseInt(totalParcelas, 10);
		const parsedParcelaAtual = Number.parseInt(parcelaAtual, 10);

		return {
			categoryId: currentCategory?.id || "",
			creditor: credor.trim(),
			nature: nature || ("one_time" as const),
			totalAmount,
			monthlyAmount:
				nature !== "one_time" && monthlyAmount > 0
					? monthlyAmount
					: undefined,
			overdueMonths:
				isOverdue && effectiveOverdueMonths
					? effectiveOverdueMonths
					: undefined,
			totalInstallments:
				nature === "installment" && parsedTotalParcelas > 0
					? parsedTotalParcelas
					: undefined,
			currentInstallment:
				nature === "installment" && parsedParcelaAtual > 0
					? parsedParcelaAtual
					: undefined,
			hasInterest: juros != null ? JUROS_MAP[juros] : undefined,
			dueDate: dueDateISO,
			status: STATUS_MAP[status] as
				| "on_time"
				| "overdue"
				| "renegotiated"
				| "paid",
		};
	}, [
		credor,
		nature,
		valorTotal,
		valorMensal,
		status,
		isOverdue,
		effectiveOverdueMonths,
		totalParcelas,
		parcelaAtual,
		juros,
		dueDate,
		currentCategory?.id,
	]);

	const validateForm = useCallback(() => {
		const data = buildDebtData();
		const formErrors: Record<string, string> = {};
		if (!nature) {
			formErrors.nature = "Escolha como funciona essa dívida";
		}
		if (isOverdue && overdueMonths === -1 && !overdueCustom.trim()) {
			formErrors.overdueMonths = "Informe quantos meses de atraso";
		}
		if (nature === "installment") {
			const tp = Number.parseInt(totalParcelas, 10);
			const pa = Number.parseInt(parcelaAtual, 10);
			if (tp > 0 && pa > 0 && pa > tp) {
				formErrors.currentInstallment =
					"Parcela atual não pode ser maior que o total";
			}
		}
		if (Object.keys(formErrors).length > 0) {
			setErrors((prev) => ({ ...prev, ...formErrors }));
			return { success: false as const, errors: formErrors };
		}
		// Validate with Zod for error messages, but return the raw data
		// from buildDebtData() to avoid Zod stripping fields due to
		// Metro bundler caching stale schema versions
		const zodResult = validateWithZod(onboardingDebtSchema, data);
		if (!zodResult.success) {
			return zodResult;
		}
		return { success: true as const, data: data as OnboardingDebtInput };
	}, [buildDebtData, nature, isOverdue, overdueMonths, overdueCustom, totalParcelas, parcelaAtual]);

	const handleAddAnother = useCallback(() => {
		const result = validateForm();
		if (!result.success) {
			setErrors(result.errors);
			return;
		}
		setCollectedDebts((prev) => [...prev, result.data]);
		resetForm();
	}, [validateForm, resetForm]);

	const handleAdvance = useCallback(() => {
		const hasFormData = credor.trim() || valorTotal;
		if (hasFormData) {
			const result = validateForm();
			if (!result.success) {
				setErrors(result.errors);
				return;
			}
			const allDebts = [...collectedDebts, result.data];
			if (isLastCategory) {
				saveDebts.mutate(allDebts, {
					onSuccess: () => router.push("/(onboarding)/expenses"),
					onError: (error) =>
						Alert.alert(
							"Erro",
							error.message || "Não foi possível salvar as dívidas.",
						),
				});
			} else {
				setCollectedDebts(allDebts);
				setCategoryIndex((i) => i + 1);
				resetForm();
			}
		} else if (debtsForCurrentCategory.length > 0) {
			if (isLastCategory) {
				saveDebts.mutate(collectedDebts, {
					onSuccess: () => router.push("/(onboarding)/expenses"),
					onError: (error) =>
						Alert.alert(
							"Erro",
							error.message || "Não foi possível salvar as dívidas.",
						),
				});
			} else {
				setCategoryIndex((i) => i + 1);
				resetForm();
			}
		} else {
			setErrors({ creditor: "Adicione pelo menos uma dívida" });
		}
	}, [
		credor,
		valorTotal,
		validateForm,
		collectedDebts,
		isLastCategory,
		saveDebts,
		router,
		resetForm,
		debtsForCurrentCategory.length,
	]);

	const handleRemoveDebt = useCallback(
		(index: number) => {
			setCollectedDebts((prev) => {
				const inCat = prev.filter(
					(d) => d.categoryId === currentCategory?.id,
				);
				const toRemove = inCat[index];
				if (!toRemove) return prev;
				const gi = prev.indexOf(toRemove);
				if (gi === -1) return prev;
				return [...prev.slice(0, gi), ...prev.slice(gi + 1)];
			});
		},
		[currentCategory?.id],
	);

	const handleBack = useCallback(() => {
		if (categoryIndex > 0) {
			setCategoryIndex((i) => i - 1);
			resetForm();
		} else {
			router.back();
		}
	}, [categoryIndex, router, resetForm]);

	const clearFieldError = useCallback((field: string) => {
		setErrors((prev) => {
			if (!prev[field]) return prev;
			const next = { ...prev };
			delete next[field];
			return next;
		});
	}, []);

	// --- Date Picker handlers ---
	const handleDateChange = useCallback(
		(event: DateTimePickerEvent, selectedDate?: Date) => {
			// Android: close picker on any event (set or dismissed)
			if (Platform.OS === "android") {
				setShowDatePicker(false);
			}
			if (selectedDate) {
				setDueDate(selectedDate);
				clearFieldError("dueDate");
			}
		},
		[clearFieldError],
	);

	const handleDateConfirm = useCallback(() => {
		setShowDatePicker(false);
	}, []);

	const handleClearDate = useCallback(() => {
		setDueDate(null);
		setShowDatePicker(false);
	}, []);

	// --- Valor mensal handler with disclosure animation ---
	const handleValorMensalChange = useCallback(
		(text: string) => {
			const masked = maskCurrency(text);
			// Animate when block 3 visibility changes (empty ↔ filled)
			if ((!valorMensal && masked) || (valorMensal && !masked)) {
				animateLayout();
			}
			setValorMensal(masked);
		},
		[valorMensal],
	);

	if (!currentCategory) {
		return (
			<SafeAreaView style={styles.safeArea}>
				<View
					style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
				>
					<Text style={{ color: colors.textSecondary }}>
						Nenhuma categoria selecionada.
					</Text>
				</View>
			</SafeAreaView>
		);
	}

	const progress =
		((categoryIndex + 1) / (allCategories.length + 1)) * 25 + 50;

	return (
		<SafeAreaView style={styles.safeArea}>
			<View style={styles.progressBarTrack}>
				<View style={[styles.progressBarFill, { width: `${progress}%` }]} />
			</View>

			<KeyboardAvoidingView
				style={styles.flex}
				behavior={Platform.OS === "ios" ? "padding" : "height"}
			>
				<ScrollView
					style={styles.flex}
					contentContainerStyle={styles.scrollContent}
					keyboardShouldPersistTaps="handled"
					showsVerticalScrollIndicator={false}
				>
					<Text style={styles.stepIndicator}>
						Categoria {categoryIndex + 1} de {allCategories.length} · você pode
						editar depois
					</Text>

					<Pressable style={styles.backButton} onPress={handleBack} hitSlop={12}>
						<Feather name="arrow-left" size={20} color={colors.textPrimary} />
						<Text style={styles.backText}>VOLTAR</Text>
					</Pressable>

					<View style={styles.categoryLabel}>
						<Feather
							name={
								currentCategory.icon as React.ComponentProps<
									typeof Feather
								>["name"]
							}
							size={14}
							color={colors.successGreen}
						/>
						<Text style={styles.stepLabel}>
							{currentCategory.name.toUpperCase()}
						</Text>
					</View>

					<Text style={styles.title}>Detalhe da dívida</Text>

					{/* Summary of added debts */}
					{debtsForCurrentCategory.length > 0 && (
						<View style={styles.addedDebtsSection}>
							<Text style={styles.addedDebtsTitle}>
								DÍVIDAS ADICIONADAS ({debtsForCurrentCategory.length})
							</Text>
							{debtsForCurrentCategory.map((debt, idx) => (
								<View
									key={`${debt.creditor}-${idx}`}
									style={styles.addedDebtCard}
								>
									<View style={styles.addedDebtInfo}>
										<Text style={styles.addedDebtCreditor} numberOfLines={1}>
											{debt.creditor}
										</Text>
										<Text style={styles.addedDebtAmount}>
											{formatBRL(debt.totalAmount)}
											{debt.monthlyAmount
												? ` · ${formatBRL(debt.monthlyAmount)}/mês`
												: ""}
										</Text>
									</View>
									<Pressable
										onPress={() => handleRemoveDebt(idx)}
										hitSlop={8}
										style={styles.removeButton}
									>
										<Feather name="x" size={16} color={colors.dangerRed} />
									</Pressable>
								</View>
							))}
						</View>
					)}

					{/* ═══════════════════════════════════════════════ */}
					{/* BLOCK 1 — Always visible: CREDOR + NATUREZA   */}
					{/* ═══════════════════════════════════════════════ */}
					<View style={styles.fieldsContainer}>
						{/* 1. CREDOR */}
						<View style={styles.fieldWrapper}>
							<Text style={styles.fieldLabel}>CREDOR</Text>
							<TextInput
								style={styles.fieldInput}
								value={credor}
								onChangeText={(t) => {
									setCredor(t);
									clearFieldError("creditor");
								}}
								placeholder="Ex: Nubank, Condomínio, Casas Bahia"
								placeholderTextColor={colors.textSecondary}
								maxLength={100}
							/>
							{errors.creditor ? (
								<Text style={styles.errorText}>{errors.creditor}</Text>
							) : null}
						</View>

						{/* 2. COMO FUNCIONA ESSA DÍVIDA? */}
						<View style={styles.fieldWrapper}>
							<Text style={styles.fieldLabel}>COMO FUNCIONA ESSA DÍVIDA?</Text>
							<View style={styles.natureColumn}>
								{NATURE_OPTIONS.map((opt) => (
									<Pressable
										key={opt.key}
										style={[
											styles.naturePill,
											nature === opt.key && styles.naturePillSelected,
										]}
										onPress={() => {
											if (opt.key !== nature) {
												animateLayout();
												setNature(opt.key);
												setValorMensal("");
												setTotalParcelas("");
												setParcelaAtual("");
											}
											clearFieldError("nature");
										}}
									>
										<Text
											style={[
												styles.naturePillLabel,
												nature === opt.key && styles.naturePillLabelSelected,
											]}
										>
											{opt.label}
										</Text>
										<Text
											style={[
												styles.naturePillSubtitle,
												nature === opt.key &&
													styles.naturePillSubtitleSelected,
											]}
										>
											{opt.subtitle}
										</Text>
									</Pressable>
								))}
							</View>
							{errors.nature ? (
								<Text style={styles.errorText}>{errors.nature}</Text>
							) : null}
						</View>
					</View>

					{/* ═══════════════════════════════════════════════════════════════ */}
					{/* BLOCK 2 — After nature selected: SITUAÇÃO + nature fields     */}
					{/* ═══════════════════════════════════════════════════════════════ */}
					{showBlock2 && (
						<View style={styles.fieldsContainer}>
							{/* 3. SITUAÇÃO */}
							<View style={styles.fieldWrapper}>
								<Text style={styles.fieldLabel}>SITUAÇÃO DESSA DÍVIDA</Text>
								<View style={styles.pillRow}>
									{STATUS_OPTIONS.map((opt) => (
										<Pressable
											key={opt}
											style={[
												styles.pillButton,
												status === opt && styles.pillButtonSelected,
											]}
											onPress={() => {
												setStatus(opt);
												if (opt !== "ATRASADA") {
													setOverdueMonths(null);
													setOverdueCustom("");
												}
											}}
										>
											<Text
												style={[
													styles.pillButtonText,
													status === opt && styles.pillButtonTextSelected,
												]}
											>
												{opt}
											</Text>
										</Pressable>
									))}
								</View>
								<Text style={styles.helperText}>
									Se não souber, escolha a opção mais próxima.
								</Text>
							</View>

							{/* 4. HÁ QUANTOS MESES? (if overdue) */}
							{isOverdue && (
								<View style={styles.fieldWrapper}>
									<Text style={styles.fieldLabel}>
										HÁ QUANTOS MESES ESTÁ ATRASADA?
									</Text>
									<View style={styles.overduePillRow}>
										{OVERDUE_PILLS.map((n) => (
											<Pressable
												key={n}
												style={[
													styles.overduePill,
													overdueMonths === n && styles.overduePillSelected,
												]}
												onPress={() => {
													setOverdueMonths(n);
													setOverdueCustom("");
												}}
											>
												<Text
													style={[
														styles.overduePillText,
														overdueMonths === n &&
															styles.overduePillTextSelected,
													]}
												>
													{n}
												</Text>
											</Pressable>
										))}
										<Pressable
											style={[
												styles.overduePill,
												overdueMonths === -1 && styles.overduePillSelected,
											]}
											onPress={() => setOverdueMonths(-1)}
										>
											<Text
												style={[
													styles.overduePillText,
													overdueMonths === -1 &&
														styles.overduePillTextSelected,
												]}
											>
												6+
											</Text>
										</Pressable>
									</View>
									{overdueMonths === -1 && (
										<TextInput
											style={[styles.fieldInput, { marginTop: spacing.sm }]}
											value={overdueCustom}
											onChangeText={(t) => {
												setOverdueCustom(t.replace(/\D/g, ""));
												clearFieldError("overdueMonths");
											}}
											placeholder="Quantos meses?"
											placeholderTextColor={colors.textSecondary}
											keyboardType="numeric"
											maxLength={3}
										/>
									)}
									{errors.overdueMonths ? (
										<Text style={styles.errorText}>
											{errors.overdueMonths}
										</Text>
									) : null}
									<Text style={styles.helperText}>
										Não precisa ser exato, uma estimativa já ajuda.
									</Text>
								</View>
							)}

							{/* 5. CONDITIONAL FIELDS BY NATURE */}
							{nature === "installment" && (
								<>
									<View style={styles.fieldWrapper}>
										<Text style={styles.fieldLabel}>VALOR DA PARCELA</Text>
										<TextInput
											style={styles.fieldInput}
											value={valorMensal}
											onChangeText={handleValorMensalChange}
											placeholder="R$ 0,00"
											placeholderTextColor={colors.textSecondary}
											keyboardType="numeric"
										/>
									</View>
									<View style={styles.fieldWrapper}>
										<Text style={styles.fieldLabel}>PARCELA ATUAL</Text>
										<View style={styles.installmentRow}>
											<TextInput
												style={[styles.fieldInput, styles.installmentInput]}
												value={parcelaAtual}
												onChangeText={(t) => {
													setParcelaAtual(t.replace(/\D/g, ""));
													clearFieldError("currentInstallment");
												}}
												placeholder="3"
												placeholderTextColor={colors.textSecondary}
												keyboardType="numeric"
												maxLength={3}
											/>
											<Text style={styles.installmentSeparator}>de</Text>
											<TextInput
												style={[styles.fieldInput, styles.installmentInput]}
												value={totalParcelas}
												onChangeText={(t) => {
													setTotalParcelas(t.replace(/\D/g, ""));
													clearFieldError("currentInstallment");
												}}
												placeholder="10"
												placeholderTextColor={colors.textSecondary}
												keyboardType="numeric"
												maxLength={3}
											/>
										</View>
										{errors.currentInstallment ? (
											<Text style={styles.errorText}>
												{errors.currentInstallment}
											</Text>
										) : null}
										<Text style={styles.helperText}>
											Em qual parcela você está e quantas são no total.
										</Text>
									</View>
								</>
							)}

							{nature === "recurring" && (
								<View style={styles.fieldWrapper}>
									<Text style={styles.fieldLabel}>VALOR MENSAL</Text>
									<TextInput
										style={styles.fieldInput}
										value={valorMensal}
										onChangeText={handleValorMensalChange}
										placeholder="R$ 0,00"
										placeholderTextColor={colors.textSecondary}
										keyboardType="numeric"
									/>
									<Text style={styles.helperText}>
										Quanto essa conta custa por mês.
									</Text>
								</View>
							)}
						</View>
					)}

					{/* ═══════════════════════════════════════════════════════════ */}
					{/* BLOCK 3 — Final fields: VALOR TOTAL + JUROS + VENCIMENTO  */}
					{/* ═══════════════════════════════════════════════════════════ */}
					{showBlock2 && showBlock3 && (
						<View style={styles.fieldsContainer}>
							{/* 6. VALOR TOTAL */}
							<View style={styles.fieldWrapper}>
								<Text style={styles.fieldLabel}>VALOR TOTAL DA DÍVIDA</Text>
								<TextInput
									style={styles.fieldInput}
									value={valorTotal}
									onChangeText={(t) => {
										setValorTotal(maskCurrency(t));
										clearFieldError("totalAmount");
									}}
									placeholder="R$ 0,00"
									placeholderTextColor={colors.textSecondary}
									keyboardType="numeric"
								/>
								{autoSuggestion && !valorTotal && (
									<Pressable
										onPress={() =>
											setValorTotal(
												maskCurrency(
													String(Math.round(autoSuggestion * 100)),
												),
											)
										}
									>
										<Text style={styles.autoSuggestion}>
											Usar {formatBRL(autoSuggestion)}?{" "}
											{nature === "recurring"
												? `(${formatBRL(unmaskCurrency(valorMensal))} x ${effectiveOverdueMonths} meses)`
												: `(restam ${Number.parseInt(totalParcelas, 10) - Number.parseInt(parcelaAtual, 10) + 1} parcelas de ${formatBRL(unmaskCurrency(valorMensal))})`}
										</Text>
									</Pressable>
								)}
								{errors.totalAmount ? (
									<Text style={styles.errorText}>{errors.totalAmount}</Text>
								) : null}
								<Text style={styles.helperText}>
									Quanto você deve hoje no total.
								</Text>
							</View>

							{/* 7. JUROS */}
							<View style={styles.fieldWrapper}>
								<Text style={styles.fieldLabel}>TEM JUROS OU MULTA?</Text>
								<View style={styles.pillRow}>
									{JUROS_OPTIONS.map((opt) => (
										<Pressable
											key={opt}
											style={[
												styles.pillButton,
												juros === opt && styles.pillButtonSelected,
											]}
											onPress={() => setJuros(opt)}
										>
											<Text
												style={[
													styles.pillButtonText,
													juros === opt && styles.pillButtonTextSelected,
												]}
											>
												{opt}
											</Text>
										</Pressable>
									))}
								</View>
							</View>

							{/* 8. VENCIMENTO — Native Date Picker */}
							<View style={styles.fieldWrapper}>
								<Text style={styles.fieldLabel}>VENCIMENTO (SE SOUBER)</Text>
								<Pressable
									style={styles.datePickerTrigger}
									onPress={() => {
										setShowDatePicker(true);
										clearFieldError("dueDate");
									}}
									accessibilityRole="button"
									accessibilityLabel="Selecionar data de vencimento"
								>
									<Text
										style={[
											styles.datePickerText,
											!dueDate && styles.datePickerPlaceholder,
										]}
									>
										{dueDate
											? formatDateDisplay(dueDate)
											: "Toque para selecionar a data"}
									</Text>
									<Feather
										name="calendar"
										size={20}
										color={dueDate ? colors.textPrimary : colors.textSecondary}
									/>
								</Pressable>

								{dueDate && (
									<Pressable onPress={handleClearDate} hitSlop={8}>
										<Text style={styles.clearDateText}>Limpar data</Text>
									</Pressable>
								)}

								{showDatePicker && (
									<View style={styles.datePickerContainer}>
										<DateTimePicker
											value={dueDate || new Date()}
											mode="date"
											display={
												Platform.OS === "ios" ? "spinner" : "default"
											}
											onChange={handleDateChange}
											locale="pt-BR"
											maximumDate={new Date(2100, 11, 31)}
											minimumDate={new Date(2000, 0, 1)}
										/>
										{Platform.OS === "ios" && (
											<Pressable
												onPress={handleDateConfirm}
												style={styles.datePickerDone}
											>
												<Text style={styles.datePickerDoneText}>
													Confirmar
												</Text>
											</Pressable>
										)}
									</View>
								)}

								{errors.dueDate ? (
									<Text style={styles.errorText}>{errors.dueDate}</Text>
								) : null}
							</View>
						</View>
					)}

					{/* Add another + info — only visible when block 3 is shown */}
					{showBlock2 && showBlock3 && (
						<>
							<Pressable
								style={({ pressed }) => [
									styles.addAnotherButton,
									pressed && styles.addAnotherButtonPressed,
								]}
								onPress={handleAddAnother}
							>
								<Feather name="plus" size={18} color={colors.textPrimary} />
								<Text style={styles.addAnotherButtonText}>
									ADICIONAR OUTRA DÍVIDA NESTA CATEGORIA
								</Text>
							</Pressable>

							<View style={styles.infoCard}>
								<Text style={styles.infoCardText}>
									Você pode ter várias dívidas na mesma categoria. Ex: 3 cartões
									de crédito diferentes.
								</Text>
							</View>
						</>
					)}
				</ScrollView>

				{/* Bottom CTA */}
				<View style={styles.bottomContainer}>
					<Pressable
						style={({ pressed }) => [
							styles.primaryButton,
							pressed && !saveDebts.isPending && styles.primaryButtonPressed,
							saveDebts.isPending && styles.primaryButtonDisabled,
						]}
						onPress={handleAdvance}
						disabled={saveDebts.isPending}
					>
						{saveDebts.isPending ? (
							<ActivityIndicator color={colors.surface} />
						) : (
							<Text style={styles.primaryButtonText}>
								{isLastCategory ? "SALVAR DÍVIDAS" : "PRÓXIMA CATEGORIA"}
							</Text>
						)}
					</Pressable>
				</View>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

// --- Styles ---

const styles = StyleSheet.create({
	safeArea: { flex: 1, backgroundColor: colors.background },
	flex: { flex: 1 },
	progressBarTrack: {
		height: 4,
		backgroundColor: colors.border,
		width: "100%",
	},
	progressBarFill: { height: 4, backgroundColor: colors.successGreen },
	scrollContent: {
		paddingHorizontal: spacing.lg,
		paddingTop: spacing.md,
		paddingBottom: spacing.xl,
	},
	stepIndicator: {
		fontSize: 13,
		color: colors.textSecondary,
		marginBottom: spacing.lg,
	},
	backButton: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		marginBottom: spacing.md,
		alignSelf: "flex-start",
	},
	backText: {
		fontSize: 11,
		fontWeight: "600",
		letterSpacing: 2,
		color: colors.textPrimary,
	},
	categoryLabel: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		marginBottom: spacing.sm,
	},
	stepLabel: {
		fontSize: 11,
		fontWeight: "600",
		color: colors.successGreen,
		letterSpacing: 3,
	},
	title: {
		fontSize: 28,
		fontWeight: "800",
		color: colors.textPrimary,
		marginBottom: spacing.lg,
	},

	// Added debts summary
	addedDebtsSection: { marginBottom: spacing.lg, gap: spacing.sm },
	addedDebtsTitle: {
		fontSize: 11,
		fontWeight: "600",
		color: colors.textSecondary,
		letterSpacing: 2,
	},
	addedDebtCard: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: colors.surface,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: 8,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
	},
	addedDebtInfo: { flex: 1 },
	addedDebtCreditor: {
		fontSize: 14,
		fontWeight: "600",
		color: colors.textPrimary,
	},
	addedDebtAmount: {
		fontSize: 13,
		color: colors.textSecondary,
		marginTop: 2,
	},
	removeButton: { padding: spacing.xs },

	// Fields
	fieldsContainer: { gap: spacing.lg, marginBottom: spacing.lg },
	fieldWrapper: { gap: spacing.xs },
	fieldLabel: {
		fontSize: 11,
		fontWeight: "600",
		color: colors.textSecondary,
		letterSpacing: 3,
		textTransform: "uppercase",
	},
	fieldInput: {
		height: 52,
		fontSize: 18,
		fontWeight: "500",
		color: colors.textPrimary,
		borderBottomWidth: 2,
		borderBottomColor: colors.borderStrong,
		paddingHorizontal: 0,
		paddingVertical: spacing.sm,
	},
	errorText: { fontSize: 12, color: colors.dangerRed, marginTop: 4 },
	helperText: {
		fontSize: 12,
		color: colors.textSecondary,
		lineHeight: 18,
		marginTop: spacing.xs,
	},

	// Nature pills (vertical)
	natureColumn: { gap: spacing.sm, marginTop: spacing.xs },
	naturePill: {
		borderWidth: 2,
		borderColor: colors.borderStrong,
		borderRadius: 8,
		paddingHorizontal: spacing.md,
		paddingVertical: 12,
		backgroundColor: colors.surface,
	},
	naturePillSelected: {
		backgroundColor: colors.textPrimary,
		borderColor: colors.textPrimary,
	},
	naturePillLabel: {
		fontSize: 13,
		fontWeight: "700",
		color: colors.textPrimary,
		letterSpacing: 1,
	},
	naturePillLabelSelected: { color: colors.surface },
	naturePillSubtitle: {
		fontSize: 12,
		color: colors.textSecondary,
		marginTop: 2,
	},
	naturePillSubtitleSelected: { color: colors.overlayLight },

	// Status pills
	pillRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs },
	pillButton: {
		flex: 1,
		height: 44,
		borderWidth: 2,
		borderColor: colors.borderStrong,
		borderRadius: 8,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: colors.surface,
	},
	pillButtonSelected: {
		backgroundColor: colors.textPrimary,
		borderColor: colors.textPrimary,
	},
	pillButtonText: {
		fontSize: 11,
		fontWeight: "700",
		color: colors.textPrimary,
		letterSpacing: 1,
	},
	pillButtonTextSelected: { color: colors.surface },

	// Overdue pills
	overduePillRow: {
		flexDirection: "row",
		gap: spacing.xs,
		marginTop: spacing.xs,
	},
	overduePill: {
		width: 44,
		height: 44,
		borderWidth: 2,
		borderColor: colors.borderStrong,
		borderRadius: 8,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: colors.surface,
	},
	overduePillSelected: {
		backgroundColor: colors.textPrimary,
		borderColor: colors.textPrimary,
	},
	overduePillText: {
		fontSize: 14,
		fontWeight: "700",
		color: colors.textPrimary,
	},
	overduePillTextSelected: { color: colors.surface },

	// Installment row
	installmentRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.sm,
	},
	installmentInput: { flex: 1, textAlign: "center" },
	installmentSeparator: {
		fontSize: 16,
		fontWeight: "600",
		color: colors.textSecondary,
	},

	// Auto suggestion
	autoSuggestion: {
		fontSize: 13,
		color: colors.accentBlue,
		marginTop: spacing.xs,
		fontWeight: "500",
	},

	// Date picker
	datePickerTrigger: {
		height: 52,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		borderBottomWidth: 2,
		borderBottomColor: colors.borderStrong,
		paddingVertical: spacing.sm,
	},
	datePickerText: {
		fontSize: 18,
		fontWeight: "500",
		color: colors.textPrimary,
	},
	datePickerPlaceholder: {
		color: colors.textSecondary,
	},
	clearDateText: {
		fontSize: 12,
		color: colors.accentBlue,
		fontWeight: "500",
		marginTop: spacing.xs,
	},
	datePickerContainer: {
		marginTop: spacing.sm,
		backgroundColor: colors.surface,
		borderRadius: 12,
		overflow: "hidden",
	},
	datePickerDone: {
		alignItems: "center",
		paddingVertical: 12,
		borderTopWidth: 1,
		borderTopColor: colors.border,
	},
	datePickerDoneText: {
		fontSize: 16,
		fontWeight: "600",
		color: colors.accentBlue,
	},

	// Add another
	addAnotherButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: spacing.sm,
		height: 48,
		borderWidth: 2,
		borderColor: colors.borderStrong,
		borderRadius: 8,
		borderStyle: "dashed",
		marginBottom: spacing.md,
	},
	addAnotherButtonPressed: { opacity: 0.6 },
	addAnotherButtonText: {
		fontSize: 11,
		fontWeight: "700",
		color: colors.textPrimary,
		letterSpacing: 1,
	},

	// Info card
	infoCard: {
		backgroundColor: colors.infoBackground,
		padding: spacing.md,
		borderRadius: 12,
	},
	infoCardText: { fontSize: 13, color: colors.accentBlue, lineHeight: 19 },

	// Bottom CTA
	bottomContainer: {
		paddingHorizontal: spacing.lg,
		paddingBottom: spacing.md,
		paddingTop: spacing.sm,
	},
	primaryButton: {
		backgroundColor: colors.textPrimary,
		height: 52,
		borderRadius: 8,
		justifyContent: "center",
		alignItems: "center",
	},
	primaryButtonPressed: { opacity: 0.85 },
	primaryButtonDisabled: { opacity: 0.6 },
	primaryButtonText: {
		color: colors.surface,
		fontSize: 14,
		fontWeight: "700",
		letterSpacing: 2,
	},
});
