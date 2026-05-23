import { Feather } from "@expo/vector-icons";
import { onboardingExpensesSchema } from "@quita/shared";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
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
import { Button } from "../../src/components";
import { useCompleteOnboarding, useSaveExpenses } from "../../src/hooks/useOnboarding";
import { colors, fonts, radius, spacing } from "../../src/theme/tokens";
import { maskCurrency, unmaskCurrency } from "../../src/utils/masks";
import { validateWithZod } from "../../src/utils/validation";

const FIELDS = [
	{ key: "aluguel", label: "Aluguel / prestação", apiKey: "housing" },
	{ key: "utilidades", label: "Luz, água, gás", apiKey: "bills" },
	{ key: "mercado", label: "Mercado", apiKey: "food" },
	{ key: "transporte", label: "Transporte", apiKey: "transport" },
	{ key: "internet", label: "Internet e celular", apiKey: "telecom" },
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
			completeOnboarding.mutate(undefined, {
				onSuccess: () => router.replace("/"),
				onError: (error) =>
					Alert.alert("Erro", error.message || "Não foi possível finalizar. Tente novamente."),
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

		saveExpenses.mutate(result.data, {
			onSuccess: () => {
				setExpensesSaved(true);
				completeOnboarding.mutate(undefined, {
					onSuccess: () => {
						router.replace("/");
					},
					onError: (error) => {
						Alert.alert("Erro", error.message || "Não foi possível finalizar. Tente novamente.");
					},
				});
			},
			onError: (error) => {
				Alert.alert("Erro", error.message || "Não foi possível salvar. Tente novamente.");
			},
		});
	}, [values, saveExpenses, completeOnboarding, router, expensesSaved]);

	const getErrorForField = (key: FieldKey): string | undefined => {
		const field = FIELDS.find((f) => f.key === key);
		const apiKey = field?.apiKey ?? key;
		return errors[apiKey];
	};

	return (
		<SafeAreaView style={styles.safeArea}>
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
					<Text style={styles.stepIndicator}>
						Passo 4 de 4 · se não souber algum valor, deixe zerado
					</Text>

					<Pressable style={styles.backButton} onPress={() => router.back()} hitSlop={12}>
						<Feather name="arrow-left" size={16} color={colors.textPrimary} />
						<Text style={styles.backText}>Voltar</Text>
					</Pressable>

					<Text style={styles.stepLabel}>Despesas fixas</Text>

					<Text style={styles.title}>Suas contas fixas do mês</Text>

					<Text style={styles.subtitle}>
						Esses gastos ajudam a entender quanto sobra para negociar dívidas com segurança.
					</Text>

					<View style={styles.fieldsContainer}>
						{FIELDS.map(({ key, label }) => {
							const fieldError = getErrorForField(key);
							return (
								<View key={key} style={styles.fieldWrapper}>
									<Text style={styles.fieldLabel}>{label}</Text>
									<TextInput
										style={styles.fieldInput}
										value={values[key]}
										onChangeText={(text) => handleChange(key, text)}
										keyboardType="numeric"
										placeholder="R$ 0,00"
										placeholderTextColor={colors.textTertiary}
									/>
									{fieldError ? <Text style={styles.errorText}>{fieldError}</Text> : null}
								</View>
							);
						})}
					</View>
				</ScrollView>

				<View style={styles.bottomContainer}>
					<Button
						variant="primary"
						label="Gerar meu plano"
						onPress={handleGeneratePlan}
						loading={isLoading}
						disabled={isLoading}
					/>
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
		backgroundColor: colors.accentGreen,
	},
	scrollContent: {
		paddingHorizontal: spacing.xl,
		paddingTop: spacing.lg,
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
		gap: spacing.xs,
		marginBottom: spacing.md,
		alignSelf: "flex-start",
	},
	backText: {
		fontSize: 13,
		fontFamily: fonts.bodySemiBold,
		color: colors.textPrimary,
	},
	stepLabel: {
		fontSize: 13,
		fontFamily: fonts.bodySemiBold,
		color: colors.brandTealDark,
		marginBottom: spacing.sm,
	},
	title: {
		fontSize: 26,
		fontFamily: fonts.heading,
		color: colors.textPrimary,
		marginBottom: spacing.md,
	},
	subtitle: {
		fontSize: 14,
		fontFamily: fonts.body,
		color: colors.textSecondary,
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
	bottomContainer: {
		paddingHorizontal: spacing.lg,
		paddingBottom: spacing.md,
		paddingTop: spacing.sm,
	},
});
