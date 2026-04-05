import { colors, spacing } from "@/theme/tokens";
import { createExpenseSchema } from "@quita/shared";
import type { CreateExpenseInput } from "@quita/shared";
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
import { useCreateExpense } from "../../src/hooks/useFinancial";
import { maskCurrency, unmaskCurrency } from "../../src/utils/masks";
import { validateWithZod } from "../../src/utils/validation";

// --- Android LayoutAnimation ---
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
	UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- Constants ---
type ExpenseType = "fixed" | "one_time" | "recurring";
type CategoryKey = "housing" | "bills" | "food" | "transport" | "telecom" | "other";

const CATEGORY_OPTIONS: { key: CategoryKey; label: string }[] = [
	{ key: "housing", label: "MORADIA" },
	{ key: "bills", label: "CONTAS" },
	{ key: "food", label: "ALIMENTACAO" },
	{ key: "transport", label: "TRANSPORTE" },
	{ key: "telecom", label: "INTERNET" },
	{ key: "other", label: "OUTROS" },
];

const TYPE_OPTIONS: { key: ExpenseType; label: string }[] = [
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
export default function NewExpenseModal() {
	const router = useRouter();
	const createExpense = useCreateExpense();

	// Form state
	const [name, setName] = useState("");
	const [category, setCategory] = useState<CategoryKey | null>(null);
	const [expenseType, setExpenseType] = useState<ExpenseType>("fixed");
	const [rawAmount, setRawAmount] = useState("");
	const [dueDate, setDueDate] = useState<Date | null>(null);
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [errors, setErrors] = useState<Record<string, string>>({});

	// Progressive disclosure
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
			onError: (error) => Alert.alert("Erro", error.message || "Nao foi possivel salvar a despesa."),
		});
	}, [name, category, expenseType, rawAmount, dueDate, createExpense, router]);

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

					<Text style={styles.title}>Nova despesa</Text>
					<Text style={styles.subtitle}>Registre seus gastos fixos e recorrentes.</Text>

					{/* ═══ BLOCK 1: NOME + CATEGORIA ═══ */}
					<View style={styles.fieldsContainer}>
						<View style={styles.fieldWrapper}>
							<Text style={styles.fieldLabel}>NOME DA DESPESA</Text>
							<TextInput
								style={styles.fieldInput}
								value={name}
								onChangeText={(t) => {
									setName(t);
									clearError("name");
								}}
								placeholder="Ex: Aluguel, Mercado, Luz"
								placeholderTextColor={colors.textSecondary}
								maxLength={100}
							/>
							{errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
						</View>

						<View style={styles.fieldWrapper}>
							<Text style={styles.fieldLabel}>CATEGORIA</Text>
							<View style={styles.toggleWrap}>
								{CATEGORY_OPTIONS.map((opt) => (
									<Pressable
										key={opt.key}
										style={[styles.toggleChip, category === opt.key && styles.toggleChipSelected]}
										onPress={() => {
											if (opt.key !== category) animateLayout();
											setCategory(opt.key);
											clearError("category");
										}}
									>
										<Text style={[styles.toggleChipText, category === opt.key && styles.toggleChipTextSelected]}>
											{opt.label}
										</Text>
									</Pressable>
								))}
							</View>
							{errors.category ? <Text style={styles.errorText}>{errors.category}</Text> : null}
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
											style={[styles.pill, expenseType === opt.key && styles.pillSelected]}
											onPress={() => setExpenseType(opt.key)}
										>
											<Text style={[styles.pillText, expenseType === opt.key && styles.pillTextSelected]}>
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

					{/* ═══ BLOCK 3: DATA ═══ */}
					{showBlock3 && (
						<View style={styles.fieldsContainer}>
							<View style={styles.fieldWrapper}>
								<Text style={styles.fieldLabel}>DATA DE VENCIMENTO (SE SOUBER)</Text>
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
						</View>
					)}
				</ScrollView>

				{/* CTA */}
				<View style={styles.bottomContainer}>
					<Pressable
						style={({ pressed }) => [
							styles.primaryButton,
							pressed && !createExpense.isPending && styles.primaryButtonPressed,
							createExpense.isPending && styles.primaryButtonDisabled,
						]}
						onPress={handleSave}
						disabled={createExpense.isPending}
					>
						{createExpense.isPending ? (
							<ActivityIndicator color={colors.surface} />
						) : (
							<Text style={styles.primaryButtonText}>SALVAR DESPESA</Text>
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

	// Category toggle chips (wrap layout)
	toggleWrap: { flexDirection: "row", flexWrap: "wrap", gap: 0, marginTop: spacing.xs },
	toggleChip: {
		height: 44,
		paddingHorizontal: 14,
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 2,
		borderColor: colors.borderStrong,
		backgroundColor: colors.surface,
		marginLeft: -2,
		marginTop: -2,
	},
	toggleChipSelected: { backgroundColor: colors.successGreen, borderColor: colors.successGreen, zIndex: 1 },
	toggleChipText: { fontSize: 11, fontWeight: "600", letterSpacing: 2, color: colors.textPrimary },
	toggleChipTextSelected: { color: "#FFFFFF" },

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
