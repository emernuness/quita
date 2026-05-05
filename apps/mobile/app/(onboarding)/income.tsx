import { onboardingIncomeSchema } from "@quita/shared";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
	Alert,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../../src/components";
import { useSaveIncome } from "../../src/hooks/useOnboarding";
import { colors, fonts, radius, spacing } from "../../src/theme/tokens";
import { maskCurrency, unmaskCurrency } from "../../src/utils/masks";
import { validateWithZod } from "../../src/utils/validation";

const FIELDS = [
	{ key: "salary", label: "Salário / renda fixa" },
	{ key: "extra", label: "Bicos / renda extra" },
	{ key: "help", label: "Ajuda de alguém?" },
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

		saveIncome.mutate(result.data, {
			onSuccess: () => {
				router.push("/(onboarding)/categories");
			},
			onError: (error) => {
				Alert.alert(
					"Erro",
					error.message || "Não foi possível salvar sua renda. Tente novamente.",
				);
			},
		});
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

					<Text style={styles.stepLabel}>Renda mensal</Text>

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
									placeholderTextColor={colors.textTertiary}
								/>
								{errors[key] ? (
									<Text style={styles.errorText}>{errors[key]}</Text>
								) : null}
							</View>
						))}
					</View>

					<Text style={styles.helperText}>
						Se algum valor variar, use a média dos últimos 3 meses.
					</Text>
				</ScrollView>

				<View style={styles.bottomContainer}>
					<Button
						variant="primary"
						label="Continuar"
						onPress={handleContinue}
						loading={saveIncome.isPending}
						disabled={saveIncome.isPending}
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
	helperText: {
		fontSize: 13,
		fontFamily: fonts.body,
		color: colors.textSecondary,
		lineHeight: 18,
	},
	bottomContainer: {
		paddingHorizontal: spacing.lg,
		paddingBottom: spacing.md,
		paddingTop: spacing.sm,
	},
});
