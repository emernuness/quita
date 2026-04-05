import { colors, spacing } from "@/theme/tokens";
import { createDebtSchema } from "@quita/shared";
import type { CreateDebtInput, DebtCategory } from "@quita/shared";
import DateTimePicker from "@react-native-community/datetimepicker";
import type { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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
import { useCreateDebt, useDebtCategories } from "../../src/hooks/useDebts";
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
	{ key: "installment" as const, label: "PARCELA TODO MÊS", subtitle: "Financiamento, carnê, cartão" },
	{ key: "recurring" as const, label: "CONTA FIXA", subtitle: "Condomínio, aluguel, internet" },
	{ key: "one_time" as const, label: "PAGO SÓ UMA VEZ", subtitle: "Empréstimo pessoal, dívida avulsa" },
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

function animateLayout() {
	LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
}

function formatDateDisplay(date: Date): string {
	const d = String(date.getDate()).padStart(2, "0");
	const m = String(date.getMonth() + 1).padStart(2, "0");
	return `${d}/${m}/${date.getFullYear()}`;
}

function formatDateISO(date: Date): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, "0");
	const d = String(date.getDate()).padStart(2, "0");
	return `${y}-${m}-${d}`;
}

// --- Component ---

export default function NewDebtModal() {
	const router = useRouter();
	const createDebt = useCreateDebt();
	const { data: categories, isLoading: categoriesLoading } = useDebtCategories();

	// Form state
	const [selectedCategory, setSelectedCategory] = useState<DebtCategory | null>(null);
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
		overdueMonths === -1 ? Number.parseInt(overdueCustom, 10) || null : overdueMonths;

	// Progressive disclosure
	const showBlock2 = nature !== null;
	const showBlock3 = nature === "one_time" || valorMensal.length > 0;

	// Auto-suggestion
	const autoSuggestion = useMemo(() => {
		const monthly = unmaskCurrency(valorMensal);
		if (nature === "recurring" && monthly > 0 && effectiveOverdueMonths && effectiveOverdueMonths > 0) {
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
	}, [valorMensal, nature, effectiveOverdueMonths, totalParcelas, parcelaAtual]);

	const clearError = useCallback((field: string) => {
		setErrors((prev) => {
			if (!prev[field]) return prev;
			const next = { ...prev };
			delete next[field];
			return next;
		});
	}, []);

	const handleValorMensalChange = useCallback(
		(text: string) => {
			const masked = maskCurrency(text);
			if ((!valorMensal && masked) || (valorMensal && !masked)) animateLayout();
			setValorMensal(masked);
		},
		[valorMensal],
	);

	const handleDateChange = useCallback(
		(event: DateTimePickerEvent, selectedDate?: Date) => {
			if (Platform.OS === "android") setShowDatePicker(false);
			if (selectedDate) {
				setDueDate(selectedDate);
				clearError("dueDate");
			}
		},
		[clearError],
	);

	const formatBRL = (v: number) =>
		`R$ ${v.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;

	const handleSave = useCallback(() => {
		const formErrors: Record<string, string> = {};
		if (!selectedCategory) formErrors.categoryId = "Selecione uma categoria";
		if (!credor.trim()) formErrors.creditor = "Informe o credor";
		if (!nature) formErrors.nature = "Escolha o tipo da dívida";
		if (isOverdue && overdueMonths === -1 && !overdueCustom.trim()) {
			formErrors.overdueMonths = "Informe quantos meses";
		}
		if (nature === "installment") {
			const tp = Number.parseInt(totalParcelas, 10);
			const pa = Number.parseInt(parcelaAtual, 10);
			if (tp > 0 && pa > 0 && pa > tp) {
				formErrors.currentInstallment = "Parcela atual não pode ser maior que o total";
			}
		}
		if (Object.keys(formErrors).length > 0) {
			setErrors(formErrors);
			return;
		}

		const totalAmount = unmaskCurrency(valorTotal);
		const monthlyAmount = unmaskCurrency(valorMensal);
		const parsedTP = Number.parseInt(totalParcelas, 10);
		const parsedPA = Number.parseInt(parcelaAtual, 10);

		const data: CreateDebtInput = {
			categoryId: selectedCategory?.id || "",
			creditor: credor.trim(),
			nature: nature || "one_time",
			totalAmount,
			monthlyAmount: nature !== "one_time" && monthlyAmount > 0 ? monthlyAmount : undefined,
			overdueMonths: isOverdue && effectiveOverdueMonths ? effectiveOverdueMonths : undefined,
			totalInstallments: nature === "installment" && parsedTP > 0 ? parsedTP : undefined,
			currentInstallment: nature === "installment" && parsedPA > 0 ? parsedPA : undefined,
			hasInterest: juros != null ? JUROS_MAP[juros] : undefined,
			dueDate: dueDate ? formatDateISO(dueDate) : undefined,
			status: (STATUS_MAP[status] as CreateDebtInput["status"]),
		};

		const zodResult = validateWithZod(createDebtSchema, data);
		if (!zodResult.success) {
			setErrors(zodResult.errors);
			return;
		}

		createDebt.mutate(data, {
			onSuccess: () => router.back(),
			onError: (error) =>
				Alert.alert("Erro", error.message || "Não foi possível salvar a dívida."),
		});
	}, [
		selectedCategory, credor, nature, status, isOverdue, overdueMonths,
		overdueCustom, effectiveOverdueMonths, valorTotal, valorMensal,
		totalParcelas, parcelaAtual, juros, dueDate, createDebt, router,
	]);

	return (
		<SafeAreaView style={styles.safe}>
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
					{/* Header */}
					<Pressable style={styles.backButton} onPress={() => router.back()} hitSlop={12}>
						<Feather name="arrow-left" size={16} color={colors.textPrimary} />
						<Text style={styles.backText}>VOLTAR</Text>
					</Pressable>

					<Text style={styles.title}>Nova dívida</Text>
					<Text style={styles.subtitle}>Adicione uma dívida à sua lista.</Text>

					{/* ═══ CATEGORIA ═══ */}
					<View style={styles.fieldWrapper}>
						<Text style={styles.fieldLabel}>CATEGORIA</Text>
						{categoriesLoading ? (
							<ActivityIndicator size="small" color={colors.accentBlue} />
						) : (
							<ScrollView
								horizontal
								showsHorizontalScrollIndicator={false}
								style={styles.categoryScroll}
								contentContainerStyle={styles.categoryRow}
							>
								{(categories ?? []).map((cat) => (
									<Pressable
										key={cat.id}
										style={[
											styles.categoryChip,
											selectedCategory?.id === cat.id && styles.categoryChipSelected,
										]}
										onPress={() => { setSelectedCategory(cat); clearError("categoryId"); }}
									>
										<Text
											style={[
												styles.categoryChipText,
												selectedCategory?.id === cat.id && styles.categoryChipTextSelected,
											]}
										>
											{cat.name}
										</Text>
									</Pressable>
								))}
							</ScrollView>
						)}
						{errors.categoryId ? <Text style={styles.errorText}>{errors.categoryId}</Text> : null}
					</View>

					{/* ═══ BLOCK 1: CREDOR + NATUREZA ═══ */}
					<View style={styles.fieldsContainer}>
						<View style={styles.fieldWrapper}>
							<Text style={styles.fieldLabel}>CREDOR</Text>
							<TextInput
								style={styles.fieldInput}
								value={credor}
								onChangeText={(t) => { setCredor(t); clearError("creditor"); }}
								placeholder="Ex: Nubank, Casas Bahia"
								placeholderTextColor={colors.textSecondary}
								maxLength={100}
							/>
							{errors.creditor ? <Text style={styles.errorText}>{errors.creditor}</Text> : null}
						</View>

						<View style={styles.fieldWrapper}>
							<Text style={styles.fieldLabel}>TIPO DA DÍVIDA</Text>
							<View style={styles.natureColumn}>
								{NATURE_OPTIONS.map((opt) => (
									<Pressable
										key={opt.key}
										style={[styles.naturePill, nature === opt.key && styles.naturePillSelected]}
										onPress={() => {
											if (opt.key !== nature) {
												animateLayout();
												setNature(opt.key);
												setValorMensal("");
												setTotalParcelas("");
												setParcelaAtual("");
											}
											clearError("nature");
										}}
									>
										<Text style={[styles.naturePillLabel, nature === opt.key && styles.naturePillLabelSelected]}>
											{opt.label}
										</Text>
										<Text style={[styles.naturePillSubtitle, nature === opt.key && styles.naturePillSubtitleSelected]}>
											{opt.subtitle}
										</Text>
									</Pressable>
								))}
							</View>
							{errors.nature ? <Text style={styles.errorText}>{errors.nature}</Text> : null}
						</View>
					</View>

					{/* ═══ BLOCK 2: SITUAÇÃO + NATURE FIELDS ═══ */}
					{showBlock2 && (
						<View style={styles.fieldsContainer}>
							<View style={styles.fieldWrapper}>
								<Text style={styles.fieldLabel}>SITUAÇÃO</Text>
								<View style={styles.pillRow}>
									{STATUS_OPTIONS.map((opt) => (
										<Pressable
											key={opt}
											style={[styles.pill, status === opt && styles.pillSelected]}
											onPress={() => {
												setStatus(opt);
												if (opt !== "ATRASADA") { setOverdueMonths(null); setOverdueCustom(""); }
											}}
										>
											<Text style={[styles.pillText, status === opt && styles.pillTextSelected]}>{opt}</Text>
										</Pressable>
									))}
								</View>
							</View>

							{isOverdue && (
								<View style={styles.fieldWrapper}>
									<Text style={styles.fieldLabel}>MESES DE ATRASO</Text>
									<View style={styles.overduePillRow}>
										{OVERDUE_PILLS.map((n) => (
											<Pressable
												key={n}
												style={[styles.overduePill, overdueMonths === n && styles.overduePillSelected]}
												onPress={() => { setOverdueMonths(n); setOverdueCustom(""); }}
											>
												<Text style={[styles.overduePillText, overdueMonths === n && styles.overduePillTextSelected]}>{n}</Text>
											</Pressable>
										))}
										<Pressable
											style={[styles.overduePill, overdueMonths === -1 && styles.overduePillSelected]}
											onPress={() => setOverdueMonths(-1)}
										>
											<Text style={[styles.overduePillText, overdueMonths === -1 && styles.overduePillTextSelected]}>6+</Text>
										</Pressable>
									</View>
									{overdueMonths === -1 && (
										<TextInput
											style={[styles.fieldInput, { marginTop: spacing.sm }]}
											value={overdueCustom}
											onChangeText={(t) => { setOverdueCustom(t.replace(/\D/g, "")); clearError("overdueMonths"); }}
											placeholder="Quantos meses?"
											placeholderTextColor={colors.textSecondary}
											keyboardType="numeric"
											maxLength={3}
										/>
									)}
									{errors.overdueMonths ? <Text style={styles.errorText}>{errors.overdueMonths}</Text> : null}
								</View>
							)}

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
												onChangeText={(t) => { setParcelaAtual(t.replace(/\D/g, "")); clearError("currentInstallment"); }}
												placeholder="3"
												placeholderTextColor={colors.textSecondary}
												keyboardType="numeric"
												maxLength={3}
											/>
											<Text style={styles.installmentSeparator}>de</Text>
											<TextInput
												style={[styles.fieldInput, styles.installmentInput]}
												value={totalParcelas}
												onChangeText={(t) => { setTotalParcelas(t.replace(/\D/g, "")); clearError("currentInstallment"); }}
												placeholder="10"
												placeholderTextColor={colors.textSecondary}
												keyboardType="numeric"
												maxLength={3}
											/>
										</View>
										{errors.currentInstallment ? <Text style={styles.errorText}>{errors.currentInstallment}</Text> : null}
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
								</View>
							)}
						</View>
					)}

					{/* ═══ BLOCK 3: VALOR TOTAL + JUROS + VENCIMENTO ═══ */}
					{showBlock2 && showBlock3 && (
						<View style={styles.fieldsContainer}>
							<View style={styles.fieldWrapper}>
								<Text style={styles.fieldLabel}>VALOR TOTAL DA DÍVIDA</Text>
								<TextInput
									style={styles.fieldInput}
									value={valorTotal}
									onChangeText={(t) => { setValorTotal(maskCurrency(t)); clearError("totalAmount"); }}
									placeholder="R$ 0,00"
									placeholderTextColor={colors.textSecondary}
									keyboardType="numeric"
								/>
								{autoSuggestion && !valorTotal && (
									<Pressable onPress={() => setValorTotal(maskCurrency(String(Math.round(autoSuggestion * 100))))}>
										<Text style={styles.autoSuggestion}>Usar {formatBRL(autoSuggestion)}?</Text>
									</Pressable>
								)}
								{errors.totalAmount ? <Text style={styles.errorText}>{errors.totalAmount}</Text> : null}
							</View>

							<View style={styles.fieldWrapper}>
								<Text style={styles.fieldLabel}>TEM JUROS OU MULTA?</Text>
								<View style={styles.pillRow}>
									{JUROS_OPTIONS.map((opt) => (
										<Pressable
											key={opt}
											style={[styles.pill, juros === opt && styles.pillSelected]}
											onPress={() => setJuros(opt)}
										>
											<Text style={[styles.pillText, juros === opt && styles.pillTextSelected]}>{opt}</Text>
										</Pressable>
									))}
								</View>
							</View>

							<View style={styles.fieldWrapper}>
								<Text style={styles.fieldLabel}>VENCIMENTO (SE SOUBER)</Text>
								<Pressable
									style={styles.datePickerTrigger}
									onPress={() => { setShowDatePicker(true); clearError("dueDate"); }}
								>
									<Text style={[styles.datePickerText, !dueDate && styles.datePickerPlaceholder]}>
										{dueDate ? formatDateDisplay(dueDate) : "Toque para selecionar"}
									</Text>
									<Feather name="calendar" size={20} color={dueDate ? colors.textPrimary : colors.textSecondary} />
								</Pressable>
								{dueDate && (
									<Pressable onPress={() => { setDueDate(null); setShowDatePicker(false); }} hitSlop={8}>
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
											<Pressable onPress={() => setShowDatePicker(false)} style={styles.datePickerDone}>
												<Text style={styles.datePickerDoneText}>Confirmar</Text>
											</Pressable>
										)}
									</View>
								)}
								{errors.dueDate ? <Text style={styles.errorText}>{errors.dueDate}</Text> : null}
							</View>
						</View>
					)}
				</ScrollView>

				{/* CTA */}
				<View style={styles.bottomContainer}>
					<Pressable
						style={({ pressed }) => [
							styles.primaryButton,
							pressed && !createDebt.isPending && styles.primaryButtonPressed,
							createDebt.isPending && styles.primaryButtonDisabled,
						]}
						onPress={handleSave}
						disabled={createDebt.isPending}
					>
						{createDebt.isPending ? (
							<ActivityIndicator color={colors.surface} />
						) : (
							<Text style={styles.primaryButtonText}>SALVAR DÍVIDA</Text>
						)}
					</Pressable>
				</View>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

// --- Styles ---

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: colors.background },
	flex: { flex: 1 },
	scrollContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xl },
	backButton: { flexDirection: "row", alignItems: "center", gap: spacing.xs, marginBottom: spacing.lg },
	backText: { fontSize: 11, fontWeight: "600", letterSpacing: 3, color: colors.textPrimary },
	title: { fontSize: 28, fontWeight: "800", color: colors.textPrimary, marginBottom: spacing.xs },
	subtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: spacing.lg },

	fieldsContainer: { gap: spacing.lg, marginBottom: spacing.lg },
	fieldWrapper: { gap: spacing.xs },
	fieldLabel: { fontSize: 11, fontWeight: "600", color: colors.textSecondary, letterSpacing: 3, textTransform: "uppercase" },
	fieldInput: {
		height: 52, fontSize: 18, fontWeight: "500", color: colors.textPrimary,
		borderBottomWidth: 2, borderBottomColor: colors.borderStrong,
		paddingHorizontal: 0, paddingVertical: spacing.sm,
	},
	errorText: { fontSize: 12, color: colors.dangerRed, marginTop: 4 },

	// Category chips
	categoryScroll: { marginTop: spacing.xs },
	categoryRow: { gap: spacing.sm, paddingVertical: spacing.xs },
	categoryChip: {
		paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100,
		borderWidth: 2, borderColor: colors.borderStrong, backgroundColor: colors.surface,
	},
	categoryChipSelected: { backgroundColor: colors.textPrimary, borderColor: colors.textPrimary },
	categoryChipText: { fontSize: 12, fontWeight: "700", color: colors.textPrimary, letterSpacing: 1 },
	categoryChipTextSelected: { color: colors.surface },

	// Nature
	natureColumn: { gap: spacing.sm, marginTop: spacing.xs },
	naturePill: {
		borderWidth: 2, borderColor: colors.borderStrong, borderRadius: 8,
		paddingHorizontal: spacing.md, paddingVertical: 12, backgroundColor: colors.surface,
	},
	naturePillSelected: { backgroundColor: colors.textPrimary, borderColor: colors.textPrimary },
	naturePillLabel: { fontSize: 13, fontWeight: "700", color: colors.textPrimary, letterSpacing: 1 },
	naturePillLabelSelected: { color: colors.surface },
	naturePillSubtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
	naturePillSubtitleSelected: { color: colors.overlayLight },

	// Pills
	pillRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs },
	pill: {
		flex: 1, height: 44, borderWidth: 2, borderColor: colors.borderStrong,
		borderRadius: 8, justifyContent: "center", alignItems: "center", backgroundColor: colors.surface,
	},
	pillSelected: { backgroundColor: colors.textPrimary, borderColor: colors.textPrimary },
	pillText: { fontSize: 11, fontWeight: "700", color: colors.textPrimary, letterSpacing: 1 },
	pillTextSelected: { color: colors.surface },

	// Overdue
	overduePillRow: { flexDirection: "row", gap: spacing.xs, marginTop: spacing.xs },
	overduePill: {
		width: 44, height: 44, borderWidth: 2, borderColor: colors.borderStrong,
		borderRadius: 8, justifyContent: "center", alignItems: "center", backgroundColor: colors.surface,
	},
	overduePillSelected: { backgroundColor: colors.textPrimary, borderColor: colors.textPrimary },
	overduePillText: { fontSize: 14, fontWeight: "700", color: colors.textPrimary },
	overduePillTextSelected: { color: colors.surface },

	// Installment
	installmentRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
	installmentInput: { flex: 1, textAlign: "center" },
	installmentSeparator: { fontSize: 16, fontWeight: "600", color: colors.textSecondary },

	// Auto suggestion
	autoSuggestion: { fontSize: 13, color: colors.accentBlue, marginTop: spacing.xs, fontWeight: "500" },

	// Date picker
	datePickerTrigger: {
		height: 52, flexDirection: "row", alignItems: "center", justifyContent: "space-between",
		borderBottomWidth: 2, borderBottomColor: colors.borderStrong, paddingVertical: spacing.sm,
	},
	datePickerText: { fontSize: 18, fontWeight: "500", color: colors.textPrimary },
	datePickerPlaceholder: { color: colors.textSecondary },
	clearDateText: { fontSize: 12, color: colors.accentBlue, fontWeight: "500", marginTop: spacing.xs },
	datePickerContainer: { marginTop: spacing.sm, backgroundColor: colors.surface, borderRadius: 12, overflow: "hidden" },
	datePickerDone: { alignItems: "center", paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.border },
	datePickerDoneText: { fontSize: 16, fontWeight: "600", color: colors.accentBlue },

	// CTA
	bottomContainer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, paddingTop: spacing.sm },
	primaryButton: { backgroundColor: colors.textPrimary, height: 52, borderRadius: 8, justifyContent: "center", alignItems: "center" },
	primaryButtonPressed: { opacity: 0.85 },
	primaryButtonDisabled: { opacity: 0.6 },
	primaryButtonText: { color: colors.surface, fontSize: 14, fontWeight: "700", letterSpacing: 2 },
});
