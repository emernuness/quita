import { Feather } from "@expo/vector-icons";
import { createIncomeSchema } from "@quita/shared";
import type { CreateIncomeInput } from "@quita/shared";
import DateTimePicker from "@react-native-community/datetimepicker";
import type { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
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
import { useCreateIncome } from "../../src/hooks/useFinancial";
import { colors, fonts, radius, spacing } from "../../src/theme/tokens";
import { maskCurrency, unmaskCurrency } from "../../src/utils/masks";
import { validateWithZod } from "../../src/utils/validation";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
	UIManager.setLayoutAnimationEnabledExperimental(true);
}

type IncomeType = "fixed" | "one_time" | "recurring";
type SourceKey = "salary" | "extra" | "help" | "other";

const SOURCE_OPTIONS = [
	{ key: "salary" as const, label: "Salário", subtitle: "CLT, concurso, funcionalismo" },
	{ key: "extra" as const, label: "Extra", subtitle: "Freelance, bico, venda" },
	{ key: "help" as const, label: "Ajuda", subtitle: "Familiar, pensão, benefício" },
	{ key: "other" as const, label: "Outro", subtitle: "Aluguel, investimento, etc" },
] as const;

const TYPE_OPTIONS: { key: IncomeType; label: string }[] = [
	{ key: "fixed", label: "Fixa" },
	{ key: "one_time", label: "Pontual" },
	{ key: "recurring", label: "Recorrente" },
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

export default function NewIncomeModal() {
	const router = useRouter();
	const createIncome = useCreateIncome();

	const [name, setName] = useState("");
	const [sourceCategory, setSourceCategory] = useState<SourceKey | null>(null);
	const [incomeType, setIncomeType] = useState<IncomeType>("fixed");
	const [rawAmount, setRawAmount] = useState("");
	const [dueDate, setDueDate] = useState<Date | null>(null);
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [installments, setInstallments] = useState("");
	const [rawInstallmentValue, setRawInstallmentValue] = useState("");
	const [errors, setErrors] = useState<Record<string, string>>({});

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

		if (data.installments && !data.installmentAmount) {
			setErrors({ installmentAmount: "Informe o valor da parcela" });
			return;
		}
		if (data.installmentAmount && !data.installments) {
			setErrors({ installments: "Informe o número de parcelas" });
			return;
		}

		createIncome.mutate(data, {
			onSuccess: () => router.back(),
			onError: (error) =>
				Alert.alert("Erro", error.message || "Não foi possível salvar a receita."),
		});
	}, [
		name,
		sourceCategory,
		incomeType,
		rawAmount,
		dueDate,
		installments,
		rawInstallmentValue,
		createIncome,
		router,
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
					<Pressable
						style={styles.backButton}
						onPress={() => router.back()}
						hitSlop={12}
					>
						<Feather name="arrow-left" size={18} color={colors.textPrimary} />
						<Text style={styles.backText}>Voltar</Text>
					</Pressable>

					<Text style={styles.title}>Nova receita</Text>
					<Text style={styles.subtitle}>
						Quanto mais preciso, melhor o seu plano.
					</Text>

					{/* Block 1 */}
					<View style={styles.fieldsContainer}>
						<View style={styles.fieldWrapper}>
							<Text style={styles.fieldLabel}>Nome da receita</Text>
							<TextInput
								style={styles.fieldInput}
								value={name}
								onChangeText={(t) => {
									setName(t);
									clearError("name");
								}}
								placeholder="Ex: Salário, Bico, Freelance"
								placeholderTextColor={colors.textTertiary}
								maxLength={100}
							/>
							{errors.name ? (
								<Text style={styles.errorText}>{errors.name}</Text>
							) : null}
						</View>

						<View style={styles.fieldWrapper}>
							<Text style={styles.fieldLabel}>Origem</Text>
							<View style={styles.natureColumn}>
								{SOURCE_OPTIONS.map((opt) => (
									<Pressable
										key={opt.key}
										style={[
											styles.naturePill,
											sourceCategory === opt.key && styles.naturePillSelected,
										]}
										onPress={() => {
											if (opt.key !== sourceCategory) animateLayout();
											setSourceCategory(opt.key);
											clearError("sourceCategory");
										}}
									>
										<Text
											style={[
												styles.naturePillLabel,
												sourceCategory === opt.key &&
													styles.naturePillLabelSelected,
											]}
										>
											{opt.label}
										</Text>
										<Text
											style={[
												styles.naturePillSubtitle,
												sourceCategory === opt.key &&
													styles.naturePillSubtitleSelected,
											]}
										>
											{opt.subtitle}
										</Text>
									</Pressable>
								))}
							</View>
						</View>
					</View>

					{/* Block 2 */}
					{showBlock2 && (
						<View style={styles.fieldsContainer}>
							<View style={styles.fieldWrapper}>
								<Text style={styles.fieldLabel}>Tipo</Text>
								<View style={styles.pillRow}>
									{TYPE_OPTIONS.map((opt) => (
										<Pressable
											key={opt.key}
											style={[
												styles.pill,
												incomeType === opt.key && styles.pillSelected,
											]}
											onPress={() => setIncomeType(opt.key)}
										>
											<Text
												style={[
													styles.pillText,
													incomeType === opt.key && styles.pillTextSelected,
												]}
											>
												{opt.label}
											</Text>
										</Pressable>
									))}
								</View>
							</View>

							<View style={styles.fieldWrapper}>
								<Text style={styles.fieldLabel}>Valor</Text>
								<TextInput
									style={styles.fieldInput}
									value={rawAmount}
									onChangeText={handleAmountChange}
									placeholder="R$ 0,00"
									placeholderTextColor={colors.textTertiary}
									keyboardType="numeric"
								/>
								{errors.amount ? (
									<Text style={styles.errorText}>{errors.amount}</Text>
								) : null}
							</View>
						</View>
					)}

					{/* Block 3 */}
					{showBlock3 && (
						<View style={styles.fieldsContainer}>
							<View style={styles.fieldWrapper}>
								<Text style={styles.fieldLabel}>
									Data de recebimento (se souber)
								</Text>
								<Pressable
									style={styles.datePickerTrigger}
									onPress={() => {
										setShowDatePicker(true);
										clearError("dueDate");
									}}
								>
									<Text
										style={[
											styles.datePickerText,
											!dueDate && styles.datePickerPlaceholder,
										]}
									>
										{dueDate
											? formatDateDisplay(dueDate)
											: "Toque para selecionar"}
									</Text>
									<Feather
										name="calendar"
										size={20}
										color={
											dueDate ? colors.textPrimary : colors.textSecondary
										}
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
											<Pressable
												onPress={() => setShowDatePicker(false)}
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

							{incomeType !== "fixed" && (
								<View style={styles.fieldWrapper}>
									<Text style={styles.fieldLabel}>Parcelamento (opcional)</Text>
									<View style={styles.installmentRow}>
										<TextInput
											style={[styles.fieldInput, styles.installmentInput]}
											value={installments}
											onChangeText={(t) => {
												setInstallments(t.replace(/\D/g, ""));
												clearError("installments");
											}}
											placeholder="10"
											placeholderTextColor={colors.textTertiary}
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
											placeholderTextColor={colors.textTertiary}
											keyboardType="numeric"
										/>
									</View>
									{errors.installments ? (
										<Text style={styles.errorText}>{errors.installments}</Text>
									) : null}
									{errors.installmentAmount ? (
										<Text style={styles.errorText}>
											{errors.installmentAmount}
										</Text>
									) : null}
									<Text style={styles.helperText}>
										Para receitas parceladas, como vendas a prazo.
									</Text>
								</View>
							)}
						</View>
					)}
				</ScrollView>

				<View style={styles.bottomContainer}>
					<Button
						variant="primary"
						label="Salvar receita"
						loading={createIncome.isPending}
						onPress={handleSave}
					/>
				</View>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: {
		flex: 1,
		backgroundColor: colors.surface,
		borderTopLeftRadius: radius.lg,
		borderTopRightRadius: radius.lg,
	},
	flex: { flex: 1 },
	scrollContent: {
		paddingHorizontal: spacing.xl,
		paddingTop: spacing.lg,
		paddingBottom: spacing.xl,
	},
	backButton: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.xs,
		marginBottom: spacing.lg,
	},
	backText: {
		fontSize: 13,
		fontFamily: fonts.bodySemiBold,
		color: colors.textPrimary,
	},
	title: {
		fontSize: 26,
		fontFamily: fonts.heading,
		color: colors.textPrimary,
		marginBottom: spacing.xs,
	},
	subtitle: {
		fontSize: 14,
		fontFamily: fonts.body,
		color: colors.textSecondary,
		marginBottom: spacing.lg,
	},

	fieldsContainer: { gap: spacing.lg, marginBottom: spacing.lg },
	fieldWrapper: { gap: spacing.sm },
	fieldLabel: {
		fontSize: 12,
		fontFamily: fonts.bodyMedium,
		color: colors.textSecondary,
	},
	fieldInput: {
		height: 48,
		fontSize: 16,
		fontFamily: fonts.bodyMedium,
		color: colors.textPrimary,
		backgroundColor: colors.surface,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: radius.input,
		paddingHorizontal: spacing.md,
	},
	errorText: {
		fontSize: 12,
		fontFamily: fonts.bodyMedium,
		color: colors.dangerRed,
		marginTop: 4,
	},
	helperText: {
		fontSize: 12,
		fontFamily: fonts.body,
		color: colors.textSecondary,
		marginTop: spacing.xs,
	},

	// Source nature pills
	natureColumn: { gap: spacing.sm, marginTop: spacing.xs },
	naturePill: {
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: radius.card,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.md,
		backgroundColor: colors.surface,
	},
	naturePillSelected: {
		backgroundColor: colors.infoBackground,
		borderColor: colors.brandTealDark,
		borderWidth: 1.5,
	},
	naturePillLabel: {
		fontSize: 14,
		fontFamily: fonts.bodySemiBold,
		color: colors.textPrimary,
	},
	naturePillLabelSelected: {
		color: colors.brandTealDark,
	},
	naturePillSubtitle: {
		fontSize: 12,
		fontFamily: fonts.body,
		color: colors.textSecondary,
		marginTop: 2,
	},
	naturePillSubtitleSelected: {
		color: colors.textSecondary,
	},

	// Pills
	pillRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs },
	pill: {
		flex: 1,
		height: 44,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: radius.pill,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: colors.surface,
	},
	pillSelected: {
		backgroundColor: colors.brandTealDark,
		borderColor: colors.brandTealDark,
	},
	pillText: {
		fontSize: 13,
		fontFamily: fonts.bodyMedium,
		color: colors.textPrimary,
	},
	pillTextSelected: {
		color: colors.white,
	},

	// Installment
	installmentRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
	installmentInput: { flex: 1, textAlign: "center" },
	installmentSeparator: {
		fontSize: 13,
		fontFamily: fonts.bodyMedium,
		color: colors.textSecondary,
	},

	// Date picker
	datePickerTrigger: {
		height: 48,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		backgroundColor: colors.surface,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: radius.input,
		paddingHorizontal: spacing.md,
	},
	datePickerText: {
		fontSize: 16,
		fontFamily: fonts.bodyMedium,
		color: colors.textPrimary,
	},
	datePickerPlaceholder: {
		color: colors.textTertiary,
		fontFamily: fonts.body,
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
		fontSize: 14,
		fontFamily: fonts.bodySemiBold,
		color: colors.brandTealDark,
	},

	// CTA
	bottomContainer: {
		paddingHorizontal: spacing.lg,
		paddingBottom: spacing.md,
		paddingTop: spacing.sm,
	},
});
