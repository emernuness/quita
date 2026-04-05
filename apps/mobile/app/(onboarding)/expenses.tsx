import { colors, spacing } from "@/theme/tokens";
import { onboardingExpensesSchema } from "@quita/shared";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	KeyboardAvoidingView,
	Platform,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useSaveExpenses, useCompleteOnboarding } from "../../src/hooks/useOnboarding";
import { maskCurrency, unmaskCurrency } from "../../src/utils/masks";
import { validateWithZod } from "../../src/utils/validation";

const FIELDS = [
	{ key: "aluguel", label: "ALUGUEL / PRESTAÇÃO", apiKey: "housing" },
	{ key: "utilidades", label: "LUZ, ÁGUA, GÁS", apiKey: "bills" },
	{ key: "mercado", label: "MERCADO", apiKey: "food" },
	{ key: "transporte", label: "TRANSPORTE", apiKey: "transport" },
	{ key: "internet", label: "INTERNET E CELULAR", apiKey: "telecom" },
] as const;

type FieldKey = (typeof FIELDS)[number]["key"];

export default function ExpensesScreen() {
	const router = useRouter();
	const saveExpenses = useSaveExpenses();
	const completeOnboarding = useCompleteOnboarding();
	const [values, setValues] = useState<Record<FieldKey, string>>({
		aluguel: "",
		utilidades: "",
		mercado: "",
		transporte: "",
		internet: "",
	});
	const [expensesSaved, setExpensesSaved] = useState(false);
	const [errors, setErrors] = useState<Record<string, string>>({});

	const isLoading = saveExpenses.isPending || completeOnboarding.isPending;

	const handleChange = useCallback((key: FieldKey, text: string) => {
		const masked = maskCurrency(text);
		setValues((prev) => ({ ...prev, [key]: masked }));
		setErrors((prev) => {
			// Clear error for the corresponding API key
			const field = FIELDS.find((f) => f.key === key);
			const apiKey = field?.apiKey ?? key;
			if (!prev[apiKey]) return prev;
			const next = { ...prev };
			delete next[apiKey];
			return next;
		});
	}, []);

	const handleGeneratePlan = useCallback(() => {
		if (expensesSaved) {
			// Retry only completeOnboarding
			completeOnboarding.mutate(undefined, {
				onSuccess: () => router.replace("/"),
				onError: (error) => Alert.alert("Erro", error.message || "Não foi possível finalizar. Tente novamente."),
			});
			return;
		}

		const housing = unmaskCurrency(values.aluguel);
		const bills = unmaskCurrency(values.utilidades);
		const food = unmaskCurrency(values.mercado);
		const transport = unmaskCurrency(values.transporte);
		const telecom = unmaskCurrency(values.internet);

		const data = {
			housing: housing > 0 ? housing : undefined,
			bills: bills > 0 ? bills : undefined,
			food: food > 0 ? food : undefined,
			transport: transport > 0 ? transport : undefined,
			telecom: telecom > 0 ? telecom : undefined,
		};

		const result = validateWithZod(onboardingExpensesSchema, data);

		if (!result.success) {
			setErrors(result.errors);
			return;
		}

		saveExpenses.mutate(
			result.data,
			{
				onSuccess: () => {
					setExpensesSaved(true);
					completeOnboarding.mutate(
						undefined,
						{
							onSuccess: () => {
								router.replace("/");
							},
							onError: (error) => {
								Alert.alert(
									"Erro",
									error.message || "Não foi possível finalizar. Tente novamente.",
								);
							},
						},
					);
				},
				onError: (error) => {
					Alert.alert(
						"Erro",
						error.message || "Não foi possível salvar. Tente novamente.",
					);
				},
			},
		);
	}, [values, saveExpenses, completeOnboarding, router, expensesSaved]);

	// Map API keys back to field keys for error display
	const getErrorForField = (key: FieldKey): string | undefined => {
		const field = FIELDS.find((f) => f.key === key);
		const apiKey = field?.apiKey ?? key;
		return errors[apiKey];
	};

	return (
		<SafeAreaView style={styles.safeArea}>
			{/* Progress Bar */}
			<View style={styles.progressBarTrack}>
				<View style={[styles.progressBarFill, { width: "100%" }]} />
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
					{/* Step Indicator */}
					<Text style={styles.stepIndicator}>
						Passo 4 de 4 · se não souber algum valor, deixe zerado
					</Text>

					{/* Back Button */}
					<Pressable
						style={styles.backButton}
						onPress={() => router.back()}
						hitSlop={12}
					>
						<Feather name="arrow-left" size={16} color={colors.textPrimary} />
						<Text style={styles.backText}>VOLTAR</Text>
					</Pressable>

					{/* Category Label */}
					<Text style={styles.stepLabel}>DESPESAS FIXAS</Text>

					{/* Title */}
					<Text style={styles.title}>Suas contas fixas do mês</Text>

					{/* Subtitle */}
					<Text style={styles.subtitle}>
						Esses gastos ajudam a entender quanto sobra para
						negociar dívidas com segurança.
					</Text>

					{/* Fields */}
					<View style={styles.fieldsContainer}>
						{FIELDS.map(({ key, label }) => {
							const fieldError = getErrorForField(key);
							return (
								<View key={key} style={styles.fieldWrapper}>
									<Text style={styles.fieldLabel}>{label}</Text>
									<TextInput
										style={styles.fieldInput}
										value={values[key]}
										onChangeText={(text) =>
											handleChange(key, text)
										}
										keyboardType="numeric"
										placeholder="R$ 0,00"
										placeholderTextColor={colors.textSecondary}
									/>
									{fieldError ? (
										<Text style={{ fontSize: 12, color: colors.dangerRed, marginTop: 4 }}>
											{fieldError}
										</Text>
									) : null}
								</View>
							);
						})}
					</View>
				</ScrollView>

				{/* Bottom Button */}
				<View style={styles.bottomContainer}>
					<Pressable
						style={({ pressed }) => [
							styles.primaryButton,
							pressed && !isLoading && styles.primaryButtonPressed,
							isLoading && styles.primaryButtonDisabled,
						]}
						onPress={handleGeneratePlan}
						disabled={isLoading}
					>
						{isLoading ? (
							<ActivityIndicator color={colors.surface} />
						) : (
							<Text style={styles.primaryButtonText}>
								GERAR MEU PLANO
							</Text>
						)}
					</Pressable>
				</View>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: colors.background,
	},
	flex: {
		flex: 1,
	},
	progressBarTrack: {
		height: 4,
		backgroundColor: colors.border,
		width: "100%",
	},
	progressBarFill: {
		height: 4,
		backgroundColor: colors.successGreen,
	},
	scrollContent: {
		paddingHorizontal: spacing.lg,
		paddingTop: spacing.lg,
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
		gap: spacing.xs,
		marginBottom: spacing.md,
		alignSelf: "flex-start",
	},
	backText: {
		fontSize: 11,
		fontWeight: "600",
		letterSpacing: 2,
		color: colors.textPrimary,
	},
	stepLabel: {
		fontSize: 11,
		fontWeight: "600",
		color: colors.successGreen,
		letterSpacing: 3,
		textTransform: "uppercase",
		marginBottom: spacing.sm,
	},
	title: {
		fontSize: 28,
		fontWeight: "800",
		color: colors.textPrimary,
		marginBottom: spacing.md,
	},
	subtitle: {
		fontSize: 15,
		color: colors.textTertiary,
		lineHeight: 22,
		marginBottom: spacing.xl,
	},
	fieldsContainer: {
		gap: spacing.lg,
		marginBottom: spacing.lg,
	},
	fieldWrapper: {
		gap: spacing.xs,
	},
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
	primaryButtonPressed: {
		opacity: 0.85,
	},
	primaryButtonDisabled: {
		opacity: 0.6,
	},
	primaryButtonText: {
		color: colors.surface,
		fontSize: 14,
		fontWeight: "700",
		letterSpacing: 2,
	},
});
