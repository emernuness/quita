import { Feather } from "@expo/vector-icons";
import { createDebtSchema } from "@quita/shared";
import type { CreateDebtInput, DebtCategory } from "@quita/shared";
import DateTimePicker from "@react-native-community/datetimepicker";
import type { DateTimePickerEvent } from "@react-native-community/datetimepicker";
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
import { Button } from "../../src/components";
import { useCreateDebt, useDebtCategories } from "../../src/hooks/useDebts";
import { colors, fonts, radius, spacing } from "../../src/theme/tokens";
import { maskCurrency, unmaskCurrency } from "../../src/utils/masks";
import { validateWithZod } from "../../src/utils/validation";

if (
	Platform.OS === "android" &&
	UIManager.setLayoutAnimationEnabledExperimental
) {
	UIManager.setLayoutAnimationEnabledExperimental(true);
}

const STATUS_OPTIONS = [
	{ key: "ATRASADA", label: "Atrasada" },
	{ key: "NEGOCIANDO", label: "Negociando" },
	{ key: "EM DIA", label: "Em dia" },
] as const;
type DebtStatusLabel = (typeof STATUS_OPTIONS)[number]["key"];

const JUROS_OPTIONS = [
	{ key: "Sim", label: "Sim" },
	{ key: "Não", label: "Não" },
	{ key: "Não sei", label: "Não sei" },
] as const;
type JurosOption = (typeof JUROS_OPTIONS)[number]["key"];

const NATURE_OPTIONS = [
	{
		key: "installment" as const,
		label: "Parcela todo mês",
		subtitle: "Financiamento, carnê, cartão",
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

export default function NewDebtModal() {
	const router = useRouter();
	const createDebt = useCreateDebt();
	const { data: categories, isLoading: categoriesLoading } = useDebtCategories();

	const [selectedCategory, setSelectedCategory] = useState<DebtCategory | null>(
		null,
	);
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
				formErrors.currentInstallment =
					"Parcela atual não pode ser maior que o total";
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
			monthlyAmount:
				nature !== "one_time" && monthlyAmount > 0 ? monthlyAmount : undefined,
			overdueMonths:
				isOverdue && effectiveOverdueMonths ? effectiveOverdueMonths : undefined,
			totalInstallments:
				nature === "installment" && parsedTP > 0 ? parsedTP : undefined,
			currentInstallment:
				nature === "installment" && parsedPA > 0 ? parsedPA : undefined,
			hasInterest: juros != null ? JUROS_MAP[juros] : undefined,
			dueDate: dueDate ? formatDateISO(dueDate) : undefined,
			status: STATUS_MAP[status] as CreateDebtInput["status"],
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
		selectedCategory,
		credor,
		nature,
		status,
		isOverdue,
		overdueMonths,
		overdueCustom,
		effectiveOverdueMonths,
		valorTotal,
		valorMensal,
		totalParcelas,
		parcelaAtual,
		juros,
		dueDate,
		createDebt,
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

					<Text style={styles.title}>Nova dívida</Text>
					<Text style={styles.subtitle}>
						Adicione uma dívida à sua lista.
					</Text>

					{/* Categoria */}
					<View style={styles.fieldWrapper}>
						<Text style={styles.fieldLabel}>Categoria</Text>
						{categoriesLoading ? (
							<ActivityIndicator size="small" color={colors.brandTealDark} />
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
											selectedCategory?.id === cat.id &&
												styles.categoryChipSelected,
										]}
										onPress={() => {
											setSelectedCategory(cat);
											clearError("categoryId");
										}}
									>
										<Text
											style={[
												styles.categoryChipText,
												selectedCategory?.id === cat.id &&
													styles.categoryChipTextSelected,
											]}
										>
											{cat.name}
										</Text>
									</Pressable>
								))}
							</ScrollView>
						)}
						{errors.categoryId ? (
							<Text style={styles.errorText}>{errors.categoryId}</Text>
						) : null}
					</View>

					{/* Block 1: Credor + Natureza */}
					<View style={styles.fieldsContainer}>
						<View style={styles.fieldWrapper}>
							<Text style={styles.fieldLabel}>Credor</Text>
							<TextInput
								style={styles.fieldInput}
								value={credor}
								onChangeText={(t) => {
									setCredor(t);
									clearError("creditor");
								}}
								placeholder="Ex: Nubank, Casas Bahia"
								placeholderTextColor={colors.textTertiary}
								maxLength={100}
							/>
							{errors.creditor ? (
								<Text style={styles.errorText}>{errors.creditor}</Text>
							) : null}
						</View>

						<View style={styles.fieldWrapper}>
							<Text style={styles.fieldLabel}>Tipo da dívida</Text>
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
											clearError("nature");
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

					{/* Block 2: Situação + nature fields */}
					{showBlock2 && (
						<View style={styles.fieldsContainer}>
							<View style={styles.fieldWrapper}>
								<Text style={styles.fieldLabel}>Situação</Text>
								<View style={styles.pillRow}>
									{STATUS_OPTIONS.map((opt) => (
										<Pressable
											key={opt.key}
											style={[
												styles.pill,
												status === opt.key && styles.pillSelected,
											]}
											onPress={() => {
												setStatus(opt.key);
												if (opt.key !== "ATRASADA") {
													setOverdueMonths(null);
													setOverdueCustom("");
												}
											}}
										>
											<Text
												style={[
													styles.pillText,
													status === opt.key && styles.pillTextSelected,
												]}
											>
												{opt.label}
											</Text>
										</Pressable>
									))}
								</View>
							</View>

							{isOverdue && (
								<View style={styles.fieldWrapper}>
									<Text style={styles.fieldLabel}>Meses de atraso</Text>
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
												clearError("overdueMonths");
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
													clearError("currentInstallment");
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
													clearError("currentInstallment");
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
								</View>
							)}
						</View>
					)}

					{/* Block 3: Valor total + juros + vencimento */}
					{showBlock2 && showBlock3 && (
						<View style={styles.fieldsContainer}>
							<View style={styles.fieldWrapper}>
								<Text style={styles.fieldLabel}>Valor total da dívida</Text>
								<TextInput
									style={styles.fieldInput}
									value={valorTotal}
									onChangeText={(t) => {
										setValorTotal(maskCurrency(t));
										clearError("totalAmount");
									}}
									placeholder="R$ 0,00"
									placeholderTextColor={colors.textTertiary}
									keyboardType="numeric"
								/>
								{autoSuggestion && !valorTotal && (
									<Pressable
										onPress={() =>
											setValorTotal(
												maskCurrency(String(Math.round(autoSuggestion * 100))),
											)
										}
									>
										<Text style={styles.autoSuggestion}>
											Usar {formatBRL(autoSuggestion)}?
										</Text>
									</Pressable>
								)}
								{errors.totalAmount ? (
									<Text style={styles.errorText}>{errors.totalAmount}</Text>
								) : null}
							</View>

							<View style={styles.fieldWrapper}>
								<Text style={styles.fieldLabel}>Tem juros ou multa?</Text>
								<View style={styles.pillRow}>
									{JUROS_OPTIONS.map((opt) => (
										<Pressable
											key={opt.key}
											style={[
												styles.pill,
												juros === opt.key && styles.pillSelected,
											]}
											onPress={() => setJuros(opt.key)}
										>
											<Text
												style={[
													styles.pillText,
													juros === opt.key && styles.pillTextSelected,
												]}
											>
												{opt.label}
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
						label="Salvar dívida"
						loading={createDebt.isPending}
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
	categoryScroll: { marginTop: spacing.xs },
	categoryRow: { gap: spacing.sm, paddingVertical: spacing.xs },
	categoryChip: {
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
		borderRadius: radius.pill,
		borderWidth: 1,
		borderColor: colors.border,
		backgroundColor: colors.surface,
	},
	categoryChipSelected: {
		backgroundColor: colors.brandTealDark,
		borderColor: colors.brandTealDark,
	},
	categoryChipText: {
		fontSize: 13,
		fontFamily: fonts.bodyMedium,
		color: colors.textPrimary,
	},
	categoryChipTextSelected: {
		color: colors.white,
	},

	// Nature
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

	// Overdue
	overduePillRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs },
	overduePill: {
		width: 44,
		height: 44,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: radius.full,
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
	overduePillTextSelected: {
		color: colors.white,
	},

	// Installment
	installmentRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
	installmentInput: { flex: 1, textAlign: "center" },
	installmentSeparator: {
		fontSize: 14,
		fontFamily: fonts.bodyMedium,
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
