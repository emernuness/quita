import { Feather } from "@expo/vector-icons";
import { createExpenseSchema } from "@quita/shared";
import type { CreateExpenseInput } from "@quita/shared";
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
import { useCreateExpense } from "../../src/hooks/useFinancial";
import { colors, fonts, radius, spacing } from "../../src/theme/tokens";
import { maskCurrency, unmaskCurrency } from "../../src/utils/masks";
import { validateWithZod } from "../../src/utils/validation";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
	UIManager.setLayoutAnimationEnabledExperimental(true);
}

type ExpenseType = "fixed" | "one_time" | "recurring";
type CategoryKey = "housing" | "bills" | "food" | "transport" | "telecom" | "other";

const CATEGORY_OPTIONS: { key: CategoryKey; label: string }[] = [
	{ key: "housing", label: "Moradia" },
	{ key: "bills", label: "Contas" },
	{ key: "food", label: "Alimentação" },
	{ key: "transport", label: "Transporte" },
	{ key: "telecom", label: "Internet" },
	{ key: "other", label: "Outros" },
];

const TYPE_OPTIONS: { key: ExpenseType; label: string }[] = [
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

export default function NewExpenseModal() {
	const router = useRouter();
	const createExpense = useCreateExpense();

	const [name, setName] = useState("");
	const [category, setCategory] = useState<CategoryKey | null>(null);
	const [expenseType, setExpenseType] = useState<ExpenseType>("fixed");
	const [rawAmount, setRawAmount] = useState("");
	const [dueDate, setDueDate] = useState<Date | null>(null);
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [errors, setErrors] = useState<Record<string, string>>({});

	const showBlock2 = category !== null;
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
		if (!category) {
			setErrors({ category: "Selecione uma categoria" });
			return;
		}

		const amount = unmaskCurrency(rawAmount);

		const data: CreateExpenseInput = {
			name: name.trim(),
			amount,
			type: expenseType,
			category,
			...(dueDate ? { dueDate: formatDateISO(dueDate) } : {}),
		};

		const zodResult = validateWithZod(createExpenseSchema, data);
		if (!zodResult.success) {
			setErrors(zodResult.errors);
			return;
		}

		createExpense.mutate(data, {
			onSuccess: () => router.back(),
			onError: (error) =>
				Alert.alert("Erro", error.message || "Não foi possível salvar a despesa."),
		});
	}, [name, category, expenseType, rawAmount, dueDate, createExpense, router]);

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

					<Text style={styles.title}>Nova despesa</Text>
					<Text style={styles.subtitle}>
						Registre seus gastos fixos e recorrentes.
					</Text>

					{/* Block 1 */}
					<View style={styles.fieldsContainer}>
						<View style={styles.fieldWrapper}>
							<Text style={styles.fieldLabel}>Nome da despesa</Text>
							<TextInput
								style={styles.fieldInput}
								value={name}
								onChangeText={(t) => {
									setName(t);
									clearError("name");
								}}
								placeholder="Ex: Aluguel, Mercado, Luz"
								placeholderTextColor={colors.textTertiary}
								maxLength={100}
							/>
							{errors.name ? (
								<Text style={styles.errorText}>{errors.name}</Text>
							) : null}
						</View>

						<View style={styles.fieldWrapper}>
							<Text style={styles.fieldLabel}>Categoria</Text>
							<View style={styles.toggleWrap}>
								{CATEGORY_OPTIONS.map((opt) => (
									<Pressable
										key={opt.key}
										style={[
											styles.toggleChip,
											category === opt.key && styles.toggleChipSelected,
										]}
										onPress={() => {
											if (opt.key !== category) animateLayout();
											setCategory(opt.key);
											clearError("category");
										}}
									>
										<Text
											style={[
												styles.toggleChipText,
												category === opt.key && styles.toggleChipTextSelected,
											]}
										>
											{opt.label}
										</Text>
									</Pressable>
								))}
							</View>
							{errors.category ? (
								<Text style={styles.errorText}>{errors.category}</Text>
							) : null}
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
												expenseType === opt.key && styles.pillSelected,
											]}
											onPress={() => setExpenseType(opt.key)}
										>
											<Text
												style={[
													styles.pillText,
													expenseType === opt.key && styles.pillTextSelected,
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
									Data de vencimento (se souber)
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
						</View>
					)}
				</ScrollView>

				<View style={styles.bottomContainer}>
					<Button
						variant="primary"
						label="Salvar despesa"
						loading={createExpense.isPending}
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

	// Category chips
	toggleWrap: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: spacing.sm,
		marginTop: spacing.xs,
	},
	toggleChip: {
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 1,
		borderColor: colors.border,
		backgroundColor: colors.surface,
		borderRadius: radius.pill,
	},
	toggleChipSelected: {
		backgroundColor: colors.brandTealDark,
		borderColor: colors.brandTealDark,
	},
	toggleChipText: {
		fontSize: 13,
		fontFamily: fonts.bodyMedium,
		color: colors.textPrimary,
	},
	toggleChipTextSelected: {
		color: colors.white,
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
