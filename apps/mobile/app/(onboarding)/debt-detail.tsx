import { Feather } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import type { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { onboardingDebtSchema } from "@quita/shared";
import type { OnboardingDebtInput } from "@quita/shared";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
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
import { Button } from "../../src/components";
import { useSaveDebts } from "../../src/hooks/useOnboarding";
import { badges, colors, fonts, radius, spacing } from "../../src/theme/tokens";
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

const STATUS_OPTIONS = [
	{ key: "ATRASADA" as const, label: "Atrasada" },
	{ key: "NEGOCIANDO" as const, label: "Negociando" },
	{ key: "EM DIA" as const, label: "Em dia" },
];
type DebtStatusLabel = (typeof STATUS_OPTIONS)[number]["key"];

const JUROS_OPTIONS = ["Sim", "Não", "Não sei"] as const;
type JurosOption = (typeof JUROS_OPTIONS)[number];

const NATURE_OPTIONS = [
	{
		key: "installment" as const,
		label: "Parcela todo mês",
		subtitle: "Financiamento, carnê, cartão parcelado",
	},
	{
		key: "recurring" as const,
		label: "Conta fixa",
		subtitle: "Condomínio, aluguel, internet",
	},
	{
		key: "one_time" as const,
		label: "Pago só uma vez",
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

	const showBlock2 = nature !== null;
	const showBlock3 = nature === "one_time" || valorMensal.length > 0;

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
				nature !== "one_time" && monthlyAmount > 0 ? monthlyAmount : undefined,
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
		const zodResult = validateWithZod(onboardingDebtSchema, data);
		if (!zodResult.success) {
			return zodResult;
		}
		return { success: true as const, data: data as OnboardingDebtInput };
	}, [
		buildDebtData,
		nature,
		isOverdue,
		overdueMonths,
		overdueCustom,
		totalParcelas,
		parcelaAtual,
	]);

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

	const handleValorMensalChange = useCallback(
		(text: string) => {
			const masked = maskCurrency(text);
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
				<View style={styles.emptyStateWrapper}>
					<Text style={styles.emptyStateText}>
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

					<Pressable
						style={styles.backButton}
						onPress={handleBack}
						hitSlop={12}
					>
						<Feather name="arrow-left" size={20} color={colors.textPrimary} />
						<Text style={styles.backText}>Voltar</Text>
					</Pressable>

					<View style={styles.categoryLabel}>
						<Feather
							name={
								currentCategory.icon as React.ComponentProps<
									typeof Feather
								>["name"]
							}
							size={14}
							color={colors.brandTealDark}
						/>
						<Text style={styles.stepLabel}>{currentCategory.name}</Text>
					</View>

					<Text style={styles.title}>Detalhe da dívida</Text>

					{/* Summary of added debts */}
					{debtsForCurrentCategory.length > 0 && (
						<View style={styles.addedDebtsSection}>
							<Text style={styles.addedDebtsTitle}>
								Dívidas adicionadas ({debtsForCurrentCategory.length})
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

					{/* BLOCK 1 — CREDOR + NATUREZA */}
					<View style={styles.fieldsContainer}>
						<View style={styles.fieldWrapper}>
							<Text style={styles.fieldLabel}>Credor</Text>
							<TextInput
								style={styles.fieldInput}
								value={credor}
								onChangeText={(t) => {
									setCredor(t);
									clearFieldError("creditor");
								}}
								placeholder="Ex: Nubank, Condomínio, Casas Bahia"
								placeholderTextColor={colors.textTertiary}
								maxLength={100}
							/>
							{errors.creditor ? (
								<Text style={styles.errorText}>{errors.creditor}</Text>
							) : null}
						</View>

						<View style={styles.fieldWrapper}>
							<Text style={styles.fieldLabel}>Como funciona essa dívida?</Text>
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

					{/* BLOCK 2 — SITUAÇÃO + nature fields */}
					{showBlock2 && (
						<View style={styles.fieldsContainer}>
							<View style={styles.fieldWrapper}>
								<Text style={styles.fieldLabel}>Situação dessa dívida</Text>
								<View style={styles.pillRow}>
									{STATUS_OPTIONS.map((opt) => {
										const selected = status === opt.key;
										const variant =
											opt.key === "ATRASADA"
												? "danger"
												: opt.key === "NEGOCIANDO"
													? "warning"
													: "success";
										const badge = badges[variant];
										return (
											<Pressable
												key={opt.key}
												style={[
													styles.statusPill,
													selected && {
														backgroundColor: badge.background,
														borderColor: badge.dot,
													},
												]}
												onPress={() => {
													setStatus(opt.key);
													if (opt.key !== "ATRASADA") {
														setOverdueMonths(null);
														setOverdueCustom("");
													}
												}}
											>
												<View
													style={[
														styles.statusDot,
														{
															backgroundColor: selected
																? badge.dot
																: colors.gray400,
														},
													]}
												/>
												<Text
													style={[
														styles.statusPillText,
														selected && { color: badge.color },
													]}
												>
													{opt.label}
												</Text>
											</Pressable>
										);
									})}
								</View>
								<Text style={styles.helperText}>
									Se não souber, escolha a opção mais próxima.
								</Text>
							</View>

							{isOverdue && (
								<View style={styles.fieldWrapper}>
									<Text style={styles.fieldLabel}>
										Há quantos meses está atrasada?
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
											placeholderTextColor={colors.textTertiary}
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

							{nature === "installment" && (
								<>
									<View style={styles.fieldWrapper}>
										<Text style={styles.fieldLabel}>Valor da parcela</Text>
										<TextInput
											style={styles.fieldInput}
											value={valorMensal}
											onChangeText={handleValorMensalChange}
											placeholder="R$ 0,00"
											placeholderTextColor={colors.textTertiary}
											keyboardType="numeric"
										/>
									</View>
									<View style={styles.fieldWrapper}>
										<Text style={styles.fieldLabel}>Parcela atual</Text>
										<View style={styles.installmentRow}>
											<TextInput
												style={[styles.fieldInput, styles.installmentInput]}
												value={parcelaAtual}
												onChangeText={(t) => {
													setParcelaAtual(t.replace(/\D/g, ""));
													clearFieldError("currentInstallment");
												}}
												placeholder="3"
												placeholderTextColor={colors.textTertiary}
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
												placeholderTextColor={colors.textTertiary}
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
									<Text style={styles.fieldLabel}>Valor mensal</Text>
									<TextInput
										style={styles.fieldInput}
										value={valorMensal}
										onChangeText={handleValorMensalChange}
										placeholder="R$ 0,00"
										placeholderTextColor={colors.textTertiary}
										keyboardType="numeric"
									/>
									<Text style={styles.helperText}>
										Quanto essa conta custa por mês.
									</Text>
								</View>
							)}
						</View>
					)}

					{/* BLOCK 3 — VALOR TOTAL + JUROS + VENCIMENTO */}
					{showBlock2 && showBlock3 && (
						<View style={styles.fieldsContainer}>
							<View style={styles.fieldWrapper}>
								<Text style={styles.fieldLabel}>Valor total da dívida</Text>
								<TextInput
									style={styles.fieldInput}
									value={valorTotal}
									onChangeText={(t) => {
										setValorTotal(maskCurrency(t));
										clearFieldError("totalAmount");
									}}
									placeholder="R$ 0,00"
									placeholderTextColor={colors.textTertiary}
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

							<View style={styles.fieldWrapper}>
								<Text style={styles.fieldLabel}>Tem juros ou multa?</Text>
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

							<View style={styles.fieldWrapper}>
								<Text style={styles.fieldLabel}>Vencimento (se souber)</Text>
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
										color={dueDate ? colors.textPrimary : colors.textTertiary}
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
											display={Platform.OS === "ios" ? "spinner" : "default"}
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

					{showBlock2 && showBlock3 && (
						<>
							<Pressable
								style={({ pressed }) => [
									styles.addAnotherButton,
									pressed && styles.addAnotherButtonPressed,
								]}
								onPress={handleAddAnother}
							>
								<Feather name="plus" size={18} color={colors.brandTealDark} />
								<Text style={styles.addAnotherButtonText}>
									Adicionar outra dívida nesta categoria
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

				<View style={styles.bottomContainer}>
					<Button
						variant="primary"
						label={isLastCategory ? "Salvar dívidas" : "Próxima categoria"}
						onPress={handleAdvance}
						loading={saveDebts.isPending}
						disabled={saveDebts.isPending}
					/>
				</View>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

// --- Styles ---

const styles = StyleSheet.create({
	safeArea: { flex: 1, backgroundColor: colors.background },
	flex: { flex: 1 },
	emptyStateWrapper: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	emptyStateText: {
		fontFamily: fonts.body,
		fontSize: 14,
		color: colors.textSecondary,
	},
	progressBarTrack: {
		height: 4,
		backgroundColor: colors.border,
		width: "100%",
	},
	progressBarFill: { height: 4, backgroundColor: colors.accentGreen },
	scrollContent: {
		paddingHorizontal: spacing.xl,
		paddingTop: spacing.md,
		paddingBottom: spacing.xl,
	},
	stepIndicator: {
		fontSize: 13,
		fontFamily: fonts.body,
		color: colors.textSecondary,
		marginBottom: spacing.lg,
	},
	backButton: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.sm,
		marginBottom: spacing.md,
		alignSelf: "flex-start",
	},
	backText: {
		fontSize: 13,
		fontFamily: fonts.bodySemiBold,
		color: colors.textPrimary,
	},
	categoryLabel: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.xs + 2,
		marginBottom: spacing.sm,
	},
	stepLabel: {
		fontSize: 13,
		fontFamily: fonts.bodySemiBold,
		color: colors.brandTealDark,
	},
	title: {
		fontSize: 26,
		fontFamily: fonts.heading,
		color: colors.textPrimary,
		marginBottom: spacing.lg,
	},

	// Added debts summary
	addedDebtsSection: { marginBottom: spacing.lg, gap: spacing.sm },
	addedDebtsTitle: {
		fontSize: 13,
		fontFamily: fonts.bodySemiBold,
		color: colors.textSecondary,
	},
	addedDebtCard: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: colors.surface,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: radius.card,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
	},
	addedDebtInfo: { flex: 1 },
	addedDebtCreditor: {
		fontSize: 14,
		fontFamily: fonts.bodySemiBold,
		color: colors.textPrimary,
	},
	addedDebtAmount: {
		fontSize: 13,
		fontFamily: fonts.body,
		color: colors.textSecondary,
		marginTop: 2,
	},
	removeButton: { padding: spacing.xs },

	// Fields
	fieldsContainer: { gap: spacing.lg, marginBottom: spacing.lg },
	fieldWrapper: { gap: spacing.xs },
	fieldLabel: {
		fontSize: 13,
		fontFamily: fonts.bodySemiBold,
		color: colors.textSecondary,
	},
	fieldInput: {
		height: 52,
		fontSize: 18,
		fontFamily: fonts.bodyMedium,
		color: colors.textPrimary,
		borderBottomWidth: 1,
		borderBottomColor: colors.border,
		borderRadius: radius.input,
		paddingHorizontal: 0,
		paddingVertical: spacing.sm,
	},
	errorText: {
		fontSize: 12,
		fontFamily: fonts.body,
		color: colors.dangerRed,
		marginTop: spacing.xs,
	},
	helperText: {
		fontSize: 12,
		fontFamily: fonts.body,
		color: colors.textSecondary,
		lineHeight: 18,
		marginTop: spacing.xs,
	},

	// Nature pills (vertical)
	natureColumn: { gap: spacing.sm, marginTop: spacing.xs },
	naturePill: {
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: radius.sm,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.md,
		backgroundColor: colors.surface,
	},
	naturePillSelected: {
		backgroundColor: colors.brandTealDark,
		borderColor: colors.brandTealDark,
	},
	naturePillLabel: {
		fontSize: 14,
		fontFamily: fonts.bodySemiBold,
		color: colors.textPrimary,
	},
	naturePillLabelSelected: { color: colors.white },
	naturePillSubtitle: {
		fontSize: 12,
		fontFamily: fonts.body,
		color: colors.textSecondary,
		marginTop: 2,
	},
	naturePillSubtitleSelected: { color: colors.overlayLight },

	// Status pills (badge style)
	pillRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs },
	statusPill: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: spacing.xs + 2,
		height: 44,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: radius.pill,
		backgroundColor: colors.surface,
		paddingHorizontal: spacing.sm,
	},
	statusDot: {
		width: 6,
		height: 6,
		borderRadius: radius.full,
		backgroundColor: colors.gray400,
	},
	statusPillText: {
		fontSize: 13,
		fontFamily: fonts.bodySemiBold,
		color: colors.textPrimary,
	},
	pillButton: {
		flex: 1,
		height: 44,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: radius.pill,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: colors.surface,
	},
	pillButtonSelected: {
		backgroundColor: colors.brandTealDark,
		borderColor: colors.brandTealDark,
	},
	pillButtonText: {
		fontSize: 13,
		fontFamily: fonts.bodySemiBold,
		color: colors.textPrimary,
	},
	pillButtonTextSelected: { color: colors.white },

	// Overdue pills
	overduePillRow: {
		flexDirection: "row",
		gap: spacing.xs,
		marginTop: spacing.xs,
	},
	overduePill: {
		width: 44,
		height: 44,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: radius.sm,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: colors.surface,
	},
	overduePillSelected: {
		backgroundColor: colors.brandTealDark,
		borderColor: colors.brandTealDark,
	},
	overduePillText: {
		fontSize: 14,
		fontFamily: fonts.bodySemiBold,
		color: colors.textPrimary,
	},
	overduePillTextSelected: { color: colors.white },

	// Installment row
	installmentRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.sm,
	},
	installmentInput: { flex: 1, textAlign: "center" },
	installmentSeparator: {
		fontSize: 16,
		fontFamily: fonts.bodySemiBold,
		color: colors.textSecondary,
	},

	// Auto suggestion
	autoSuggestion: {
		fontSize: 13,
		fontFamily: fonts.bodyMedium,
		color: colors.brandTealDark,
		marginTop: spacing.xs,
	},

	// Date picker
	datePickerTrigger: {
		height: 52,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		borderBottomWidth: 1,
		borderBottomColor: colors.border,
		paddingVertical: spacing.sm,
	},
	datePickerText: {
		fontSize: 18,
		fontFamily: fonts.bodyMedium,
		color: colors.textPrimary,
	},
	datePickerPlaceholder: {
		color: colors.textTertiary,
	},
	clearDateText: {
		fontSize: 12,
		fontFamily: fonts.bodyMedium,
		color: colors.brandTealDark,
		marginTop: spacing.xs,
	},
	datePickerContainer: {
		marginTop: spacing.sm,
		backgroundColor: colors.surface,
		borderRadius: radius.card,
		overflow: "hidden",
	},
	datePickerDone: {
		alignItems: "center",
		paddingVertical: spacing.md,
		borderTopWidth: 0.5,
		borderTopColor: colors.border,
	},
	datePickerDoneText: {
		fontSize: 16,
		fontFamily: fonts.bodySemiBold,
		color: colors.brandTealDark,
	},

	// Add another
	addAnotherButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: spacing.sm,
		height: 48,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: radius.sm,
		borderStyle: "dashed",
		marginBottom: spacing.md,
		backgroundColor: colors.surface,
	},
	addAnotherButtonPressed: { opacity: 0.6 },
	addAnotherButtonText: {
		fontSize: 13,
		fontFamily: fonts.bodySemiBold,
		color: colors.brandTealDark,
	},

	// Info card
	infoCard: {
		backgroundColor: colors.infoBackground,
		padding: spacing.md,
		borderRadius: radius.card,
	},
	infoCardText: {
		fontSize: 13,
		fontFamily: fonts.body,
		color: colors.brandTealDark,
		lineHeight: 19,
	},

	// Bottom CTA
	bottomContainer: {
		paddingHorizontal: spacing.lg,
		paddingBottom: spacing.md,
		paddingTop: spacing.sm,
	},
});
