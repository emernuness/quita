import { colors, spacing } from "@/theme/tokens";
import { onboardingIncomeSchema } from "@quita/shared";
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
import { useSaveIncome } from "../../src/hooks/useOnboarding";
import { maskCurrency, unmaskCurrency } from "../../src/utils/masks";
import { validateWithZod } from "../../src/utils/validation";

const FIELDS = [
	{ key: "salary", label: "SALÁRIO / RENDA FIXA" },
	{ key: "extra", label: "BICOS / RENDA EXTRA" },
	{ key: "help", label: "AJUDA DE ALGUÉM?" },
] as const;

type FieldKey = (typeof FIELDS)[number]["key"];

export default function IncomeScreen() {
	const router = useRouter();
	const saveIncome = useSaveIncome();
	const [values, setValues] = useState<Record<FieldKey, string>>({
		salary: "",
		extra: "",
		help: "",
	});
	const [errors, setErrors] = useState<Record<string, string>>({});

	const handleChange = useCallback((key: FieldKey, text: string) => {
		const masked = maskCurrency(text);
		setValues((prev) => ({ ...prev, [key]: masked }));
		setErrors((prev) => {
			if (!prev[key]) return prev;
			const next = { ...prev };
			delete next[key];
			return next;
		});
	}, []);

	const handleContinue = useCallback(() => {
		const salary = unmaskCurrency(values.salary);
		const extra = unmaskCurrency(values.extra);
		const help = unmaskCurrency(values.help);

		const result = validateWithZod(onboardingIncomeSchema, {
			salary,
			extra: extra > 0 ? extra : undefined,
			help: help > 0 ? help : undefined,
		});

		if (!result.success) {
			setErrors(result.errors);
			return;
		}

		saveIncome.mutate(
			result.data,
			{
				onSuccess: () => {
					router.push("/(onboarding)/categories");
				},
				onError: (error) => {
					Alert.alert(
						"Erro",
						error.message || "Não foi possível salvar sua renda. Tente novamente.",
					);
				},
			},
		);
	}, [values, saveIncome, router]);

	return (
		<SafeAreaView style={styles.safeArea}>
			<View style={styles.progressBarTrack}>
				<View style={[styles.progressBarFill, { width: "50%" }]} />
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
						Passo 2 de 4 · você pode estimar e ajustar depois
					</Text>

					<Text style={styles.stepLabel}>RENDA MENSAL</Text>

					<Text style={styles.title}>Quanto entra por mês?</Text>

					<Text style={styles.subtitle}>
						Some salário, renda extra e ajuda. Uma estimativa já basta para
						montar um plano realista.
					</Text>

					<View style={styles.fieldsContainer}>
						{FIELDS.map(({ key, label }) => (
							<View key={key} style={styles.fieldWrapper}>
								<Text style={styles.fieldLabel}>{label}</Text>
								<TextInput
									style={styles.fieldInput}
									value={values[key]}
									onChangeText={(text) => handleChange(key, text)}
									keyboardType="numeric"
									placeholder="R$ 0,00"
									placeholderTextColor={colors.textSecondary}
								/>
								{errors[key] ? (
									<Text style={{ fontSize: 12, color: colors.dangerRed, marginTop: 4 }}>
										{errors[key]}
									</Text>
								) : null}
							</View>
						))}
					</View>

					<Text style={styles.helperText}>
						Se algum valor variar, use a média dos últimos 3 meses.
					</Text>
				</ScrollView>

				<View style={styles.bottomContainer}>
					<Pressable
						style={({ pressed }) => [
							styles.primaryButton,
							pressed && !saveIncome.isPending && styles.primaryButtonPressed,
							saveIncome.isPending && styles.primaryButtonDisabled,
						]}
						onPress={handleContinue}
						disabled={saveIncome.isPending}
					>
						{saveIncome.isPending ? (
							<ActivityIndicator color={colors.surface} />
						) : (
							<Text style={styles.primaryButtonText}>CONTINUAR</Text>
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
	helperText: {
		fontSize: 13,
		color: colors.textSecondary,
		lineHeight: 18,
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
