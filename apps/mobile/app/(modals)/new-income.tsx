import { colors, spacing } from "@/theme/tokens";
import { createIncomeSchema } from "@quita/shared";
import type { CreateIncomeInput } from "@quita/shared";
import DateTimePicker from "@react-native-community/datetimepicker";
import type { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
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
import { useCreateIncome } from "../../src/hooks/useFinancial";
import { maskCurrency, unmaskCurrency } from "../../src/utils/masks";
import { validateWithZod } from "../../src/utils/validation";

// --- Android LayoutAnimation ---
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
	UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- Constants ---
type IncomeType = "fixed" | "one_time" | "recurring";
type SourceKey = "salary" | "extra" | "help" | "other";

const SOURCE_OPTIONS = [
	{ key: "salary" as const, label: "SALARIO", subtitle: "CLT, concurso, funcionalismo" },
	{ key: "extra" as const, label: "EXTRA", subtitle: "Freelance, bico, venda" },
	{ key: "help" as const, label: "AJUDA", subtitle: "Familiar, pensao, beneficio" },
	{ key: "other" as const, label: "OUTRO", subtitle: "Aluguel, investimento, etc" },
] as const;

const TYPE_OPTIONS: { key: IncomeType; label: string }[] = [
	{ key: "fixed", label: "FIXA" },
	{ key: "one_time", label: "PONTUAL" },
	{ key: "recurring", label: "RECORRENTE" },
];

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
export default function NewIncomeModal() {
	const router = useRouter();
	const createIncome = useCreateIncome();

	// Form state
	const [name, setName] = useState("");
	const [sourceCategory, setSourceCategory] = useState<SourceKey | null>(null);
	const [incomeType, setIncomeType] = useState<IncomeType>("fixed");
	const [rawAmount, setRawAmount] = useState("");
	const [dueDate, setDueDate] = useState<Date | null>(null);
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [installments, setInstallments] = useState("");
	const [rawInstallmentValue, setRawInstallmentValue] = useState("");
	const [errors, setErrors] = useState<Record<string, string>>({});

	// Progressive disclosure
	const showBlock2 = sourceCategory !== null;
	const showBlock3 = showBlock2 && rawAmount.length > 0;

	const clearError = useCallback((field: string) => {
		setErrors((prev) => {
			if (!prev[field]) return prev;
			const next = { ...prev };
			delete next[field];
			return next;
		});
	}, []);

	const handleAmountChange = useCallback(
		(text: string) => {
			const masked = maskCurrency(text);
			if ((!rawAmount && masked) || (rawAmount && !masked)) animateLayout();
			setRawAmount(masked);
		},
		[rawAmount],
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

	const handleSave = useCallback(() => {
		const amount = unmaskCurrency(rawAmount);
		const installmentAmount = unmaskCurrency(rawInstallmentValue);
		const parsedInstallments = Number.parseInt(installments, 10);

		const data: CreateIncomeInput = {
			name: name.trim(),
			amount,
			type: incomeType,
			...(sourceCategory ? { sourceCategory } : {}),
			...(dueDate ? { dueDate: formatDateISO(dueDate) } : {}),
			...(parsedInstallments > 0 ? { installments: parsedInstallments } : {}),
			...(installmentAmount > 0 ? { installmentAmount } : {}),
		};

		const zodResult = validateWithZod(createIncomeSchema, data);
		if (!zodResult.success) {
			setErrors(zodResult.errors);
			return;
		}

		// Cross-field validation
		if (data.installments && !data.installmentAmount) {
			setErrors({ installmentAmount: "Informe o valor da parcela" });
			return;
		}
		if (data.installmentAmount && !data.installments) {
			setErrors({ installments: "Informe o numero de parcelas" });
			return;
		}

		createIncome.mutate(data, {
			onSuccess: () => router.back(),
			onError: (error) => Alert.alert("Erro", error.message || "Nao foi possivel salvar a receita."),
		});
	}, [name, sourceCategory, incomeType, rawAmount, dueDate, installments, rawInstallmentValue, createIncome, router]);

	return (
		<SafeAreaView style={styles.safe}>
			<KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : "height"}>
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

					<Text style={styles.title}>Nova receita</Text>
					<Text style={styles.subtitle}>Quanto mais preciso, melhor o seu plano.</Text>

					{/* ═══ BLOCK 1: NOME + ORIGEM ═══ */}
					<View style={styles.fieldsContainer}>
						<View style={styles.fieldWrapper}>
							<Text style={styles.fieldLabel}>NOME DA RECEITA</Text>
							<TextInput
								style={styles.fieldInput}
								value={name}
								onChangeText={(t) => {
									setName(t);
									clearError("name");
								}}
								placeholder="Ex: Salario, Bico, Freelance"
								placeholderTextColor={colors.textSecondary}
								maxLength={100}
							/>
							{errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
						</View>

						<View style={styles.fieldWrapper}>
							<Text style={styles.fieldLabel}>ORIGEM</Text>
							<View style={styles.natureColumn}>
								{SOURCE_OPTIONS.map((opt) => (
									<Pressable
										key={opt.key}
										style={[styles.naturePill, sourceCategory === opt.key && styles.naturePillSelected]}
										onPress={() => {
											if (opt.key !== sourceCategory) animateLayout();
											setSourceCategory(opt.key);
											clearError("sourceCategory");
										}}
									>
										<Text
											style={[styles.naturePillLabel, sourceCategory === opt.key && styles.naturePillLabelSelected]}
										>
											{opt.label}
										</Text>
										<Text
											style={[
												styles.naturePillSubtitle,
												sourceCategory === opt.key && styles.naturePillSubtitleSelected,
											]}
										>
											{opt.subtitle}
										</Text>
									</Pressable>
								))}
							</View>
						</View>
					</View>

					{/* ═══ BLOCK 2: TIPO + VALOR ═══ */}
					{showBlock2 && (
						<View style={styles.fieldsContainer}>
							<View style={styles.fieldWrapper}>
								<Text style={styles.fieldLabel}>TIPO</Text>
								<View style={styles.pillRow}>
									{TYPE_OPTIONS.map((opt) => (
										<Pressable
											key={opt.key}
											style={[styles.pill, incomeType === opt.key && styles.pillSelected]}
											onPress={() => setIncomeType(opt.key)}
										>
											<Text style={[styles.pillText, incomeType === opt.key && styles.pillTextSelected]}>
												{opt.label}
											</Text>
										</Pressable>
									))}
								</View>
							</View>

							<View style={styles.fieldWrapper}>
								<Text style={styles.fieldLabel}>VALOR</Text>
								<TextInput
									style={styles.fieldInput}
									value={rawAmount}
									onChangeText={handleAmountChange}
									placeholder="R$ 0,00"
									placeholderTextColor={colors.textSecondary}
									keyboardType="numeric"
								/>
								{errors.amount ? <Text style={styles.errorText}>{errors.amount}</Text> : null}
							</View>
						</View>
					)}

					{/* ═══ BLOCK 3: DATA + PARCELAMENTO ═══ */}
					{showBlock3 && (
						<View style={styles.fieldsContainer}>
							<View style={styles.fieldWrapper}>
								<Text style={styles.fieldLabel}>DATA DE RECEBIMENTO (SE SOUBER)</Text>
								<Pressable
									style={styles.datePickerTrigger}
									onPress={() => {
										setShowDatePicker(true);
										clearError("dueDate");
									}}
								>
									<Text style={[styles.datePickerText, !dueDate && styles.datePickerPlaceholder]}>
										{dueDate ? formatDateDisplay(dueDate) : "Toque para selecionar"}
									</Text>
									<Feather
										name="calendar"
										size={20}
										color={dueDate ? colors.textPrimary : colors.textSecondary}
									/>
								</Pressable>
								{dueDate && (
									<Pressable
										onPress={() => {
											setDueDate(null);
											setShowDatePicker(false);
										}}
										hitSlop={8}
									>
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

							{/* Parcelamento - only for non-fixed */}
							{incomeType !== "fixed" && (
								<View style={styles.fieldWrapper}>
									<Text style={styles.fieldLabel}>PARCELAMENTO (OPCIONAL)</Text>
									<View style={styles.installmentRow}>
										<TextInput
											style={[styles.fieldInput, styles.installmentInput]}
											value={installments}
											onChangeText={(t) => {
												setInstallments(t.replace(/\D/g, ""));
												clearError("installments");
											}}
											placeholder="10"
											placeholderTextColor={colors.textSecondary}
											keyboardType="numeric"
											maxLength={3}
										/>
										<Text style={styles.installmentSeparator}>parcelas de</Text>
										<TextInput
											style={[styles.fieldInput, styles.installmentInput]}
											value={rawInstallmentValue}
											onChangeText={(t) => {
												setRawInstallmentValue(maskCurrency(t));
												clearError("installmentAmount");
											}}
											placeholder="R$ 0,00"
											placeholderTextColor={colors.textSecondary}
											keyboardType="numeric"
										/>
									</View>
									{errors.installments ? <Text style={styles.errorText}>{errors.installments}</Text> : null}
									{errors.installmentAmount ? (
										<Text style={styles.errorText}>{errors.installmentAmount}</Text>
									) : null}
									<Text style={styles.helperText}>Para receitas parceladas, como vendas a prazo.</Text>
								</View>
							)}
						</View>
					)}
				</ScrollView>

				{/* CTA */}
				<View style={styles.bottomContainer}>
					<Pressable
						style={({ pressed }) => [
							styles.primaryButton,
							pressed && !createIncome.isPending && styles.primaryButtonPressed,
							createIncome.isPending && styles.primaryButtonDisabled,
						]}
						onPress={handleSave}
						disabled={createIncome.isPending}
					>
						{createIncome.isPending ? (
							<ActivityIndicator color={colors.surface} />
						) : (
							<Text style={styles.primaryButtonText}>SALVAR RECEITA</Text>
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
	title: { fontSize: 28, fontWeight: "800", fontStyle: "italic", color: colors.textPrimary, marginBottom: spacing.xs },
	subtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: spacing.lg },

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
		fontSize: 16,
		fontWeight: "500",
		color: colors.textPrimary,
		backgroundColor: colors.surface,
		borderWidth: 2,
		borderColor: colors.borderStrong,
		paddingHorizontal: spacing.md,
	},
	errorText: { fontSize: 12, color: colors.dangerRed, marginTop: 4 },
	helperText: { fontSize: 12, color: colors.textSecondary, marginTop: spacing.xs },

	// Nature pills
	natureColumn: { gap: spacing.sm, marginTop: spacing.xs },
	naturePill: {
		borderWidth: 2,
		borderColor: colors.borderStrong,
		borderRadius: 8,
		paddingHorizontal: spacing.md,
		paddingVertical: 12,
		backgroundColor: colors.surface,
	},
	naturePillSelected: { backgroundColor: colors.textPrimary, borderColor: colors.textPrimary },
	naturePillLabel: { fontSize: 13, fontWeight: "700", color: colors.textPrimary, letterSpacing: 1 },
	naturePillLabelSelected: { color: colors.surface },
	naturePillSubtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
	naturePillSubtitleSelected: { color: colors.overlayLight },

	// Pills
	pillRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs },
	pill: {
		flex: 1,
		height: 44,
		borderWidth: 2,
		borderColor: colors.borderStrong,
		borderRadius: 8,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: colors.surface,
	},
	pillSelected: { backgroundColor: colors.successGreen, borderColor: colors.successGreen },
	pillText: { fontSize: 11, fontWeight: "700", color: colors.textPrimary, letterSpacing: 1 },
	pillTextSelected: { color: "#FFFFFF" },

	// Installment
	installmentRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
	installmentInput: { flex: 1, textAlign: "center" },
	installmentSeparator: { fontSize: 14, fontWeight: "600", color: colors.textSecondary },

	// Date picker
	datePickerTrigger: {
		height: 52,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		backgroundColor: colors.surface,
		borderWidth: 2,
		borderColor: colors.borderStrong,
		paddingHorizontal: spacing.md,
	},
	datePickerText: { fontSize: 18, fontWeight: "500", color: colors.textPrimary },
	datePickerPlaceholder: { color: colors.textSecondary },
	clearDateText: { fontSize: 12, color: colors.accentBlue, fontWeight: "500", marginTop: spacing.xs },
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
	datePickerDoneText: { fontSize: 16, fontWeight: "600", color: colors.accentBlue },

	// CTA
	bottomContainer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, paddingTop: spacing.sm },
	primaryButton: {
		backgroundColor: colors.textPrimary,
		height: 52,
		borderRadius: 8,
		justifyContent: "center",
		alignItems: "center",
	},
	primaryButtonPressed: { opacity: 0.85 },
	primaryButtonDisabled: { opacity: 0.6 },
	primaryButtonText: { color: colors.surface, fontSize: 14, fontWeight: "700", letterSpacing: 2 },
});
