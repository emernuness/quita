import { Feather } from "@expo/vector-icons";
import { createPaymentSchema } from "@quita/shared";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
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
import { Button } from "../../src/components";
import { useCreatePayment, useDebt } from "../../src/hooks/useDebts";
import { colors, fonts, radius, spacing } from "../../src/theme/tokens";
import { maskCurrency } from "../../src/utils/masks";
import { validateWithZod } from "../../src/utils/validation";

type PaymentOption = "full" | "partial" | "renegotiated";

export default function PayDebtModal() {
	const router = useRouter();
	const { debtId } = useLocalSearchParams<{ debtId: string }>();
	const [selectedOption, setSelectedOption] = useState<PaymentOption>("full");
	const [rawAmountPaid, setRawAmountPaid] = useState("");
	const [errors, setErrors] = useState<Record<string, string>>({});
	const createPayment = useCreatePayment(debtId || "");
	const { data: debt, isLoading: isLoadingDebt } = useDebt(debtId || "");

	const clearError = (field: string) => {
		setErrors((prev) => {
			if (!prev[field]) return prev;
			const next = { ...prev };
			delete next[field];
			return next;
		});
	};

	const formatAmount = (amount: number) => {
		const cents = Math.round(amount * 100).toString();
		return maskCurrency(cents);
	};

	if (!debtId) {
		return (
			<SafeAreaView style={styles.safe}>
				<View style={styles.centered}>
					<Text style={styles.notFoundText}>Dívida não encontrada.</Text>
				</View>
			</SafeAreaView>
		);
	}

	if (isLoadingDebt) {
		return (
			<SafeAreaView style={styles.safe}>
				<View style={styles.centered}>
					<ActivityIndicator size="large" color={colors.brandTealDark} />
				</View>
			</SafeAreaView>
		);
	}

	const handleConfirmPayment = () => {
		if (selectedOption === "full") {
			const data = { amount: debt?.totalAmount || 0, paymentType: "full" as const };
			const result = validateWithZod(createPaymentSchema, data);
			if (!result.success) {
				setErrors(result.errors);
				return;
			}
			createPayment.mutate(result.data, {
				onSuccess: () => router.back(),
				onError: () => Alert.alert("Erro", "Não foi possível confirmar o pagamento."),
			});
		} else {
			const parsedAmount = Number.parseInt(rawAmountPaid || "0", 10) / 100;
			const data = { amount: parsedAmount, paymentType: selectedOption };
			const result = validateWithZod(createPaymentSchema, data);
			if (!result.success) {
				setErrors(result.errors);
				return;
			}
			createPayment.mutate(result.data, {
				onSuccess: () => router.back(),
				onError: () => Alert.alert("Erro", "Não foi possível confirmar o pagamento."),
			});
		}
	};

	const options: {
		key: PaymentOption;
		title: string;
		subtitle: string;
	}[] = [
		{
			key: "full",
			title: "Paguei o valor total",
			subtitle: `${debt ? formatAmount(debt.totalAmount) : "..."} — dívida quitada!`,
		},
		{
			key: "partial",
			title: "Paguei um valor menor",
			subtitle: "Vou informar quanto paguei",
		},
		{
			key: "renegotiated",
			title: "Fiz um acordo / renegociei",
			subtitle: "Vou atualizar o valor e parcelas",
		},
	];

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
					<Pressable style={styles.backButton} onPress={() => router.back()} hitSlop={12}>
						<Feather name="arrow-left" size={18} color={colors.textPrimary} />
						<Text style={styles.backText}>Voltar</Text>
					</Pressable>

					<Text style={styles.title}>Marcar como pago</Text>

					<Text style={styles.subtitle}>
						{debt?.creditor || "..."} — {debt ? formatAmount(debt.totalAmount) : "..."}
					</Text>

					<View style={styles.optionsContainer}>
						{options.map((option) => {
							const isSelected = selectedOption === option.key;
							return (
								<Pressable
									key={option.key}
									style={[styles.optionItem, isSelected && styles.optionItemSelected]}
									onPress={() => setSelectedOption(option.key)}
								>
									<View style={styles.optionContent}>
										<View style={[styles.radio, isSelected && styles.radioSelected]}>
											{isSelected && <View style={styles.radioDot} />}
										</View>
										<View style={styles.optionTextContainer}>
											<Text style={styles.optionTitle}>{option.title}</Text>
											<Text style={styles.optionSubtitle}>{option.subtitle}</Text>
										</View>
									</View>
								</Pressable>
							);
						})}
					</View>

					{(selectedOption === "partial" || selectedOption === "renegotiated") && (
						<View style={styles.inputSection}>
							<Text style={styles.label}>Quanto você pagou?</Text>
							<TextInput
								style={styles.input}
								value={rawAmountPaid ? maskCurrency(rawAmountPaid) : ""}
								onChangeText={(t) => {
									setRawAmountPaid(t.replace(/\D/g, ""));
									clearError("amount");
								}}
								keyboardType="numeric"
								placeholder="R$ 0,00"
								placeholderTextColor={colors.textTertiary}
							/>
							{errors.amount ? <Text style={styles.errorText}>{errors.amount}</Text> : null}
							<Text style={styles.helperText}>
								O saldo restante será atualizado e a IA recalcula seu plano.
							</Text>
						</View>
					)}

					<Button
						variant="primary"
						label="Confirmar pagamento"
						loading={createPayment.isPending}
						onPress={handleConfirmPayment}
						style={{ marginBottom: spacing.lg }}
					/>

					<View style={styles.infoBox}>
						<View style={styles.infoHeader}>
							<Feather name="alert-circle" size={16} color={colors.textSecondary} />
							<Text style={styles.infoTitle}>Antes de confirmar</Text>
						</View>
						<Text style={styles.infoText}>
							O pagamento ficará em revisão por 24h. Você pode cancelar a marcação nesse período se
							precisar.
						</Text>
						<View style={styles.infoLinks}>
							<Pressable
								onPress={() =>
									Alert.alert("Em breve", "Essa funcionalidade estará disponível em breve.")
								}
							>
								<Text style={styles.infoLink}>Ver impacto no plano</Text>
							</Pressable>
							<Pressable
								onPress={() =>
									Alert.alert("Em breve", "Essa funcionalidade estará disponível em breve.")
								}
							>
								<Text style={styles.infoLink}>Adicionar comprovante</Text>
							</Pressable>
						</View>
					</View>
				</ScrollView>
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
	flex: {
		flex: 1,
	},
	centered: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	notFoundText: {
		fontFamily: fonts.body,
		color: colors.textSecondary,
		fontSize: 14,
	},
	scrollContent: {
		paddingHorizontal: spacing.xl,
		paddingTop: spacing.lg,
		paddingBottom: spacing.xxl,
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
		marginBottom: spacing.sm,
	},
	subtitle: {
		fontSize: 14,
		fontFamily: fonts.body,
		color: colors.textSecondary,
		marginBottom: spacing.xl,
	},
	optionsContainer: {
		gap: spacing.sm,
		marginBottom: spacing.xl,
	},
	optionItem: {
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: radius.card,
		minHeight: 68,
		justifyContent: "center",
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.md,
		backgroundColor: colors.surface,
	},
	optionItemSelected: {
		borderColor: colors.brandTealDark,
		borderWidth: 1.5,
		backgroundColor: colors.infoBackground,
	},
	optionContent: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.md,
	},
	radio: {
		width: 20,
		height: 20,
		borderRadius: radius.full,
		borderWidth: 1.5,
		borderColor: colors.border,
		alignItems: "center",
		justifyContent: "center",
	},
	radioSelected: {
		borderColor: colors.brandTealDark,
	},
	radioDot: {
		width: 10,
		height: 10,
		borderRadius: radius.full,
		backgroundColor: colors.brandTealDark,
	},
	optionTextContainer: {
		flex: 1,
	},
	optionTitle: {
		fontSize: 14,
		fontFamily: fonts.bodySemiBold,
		color: colors.textPrimary,
	},
	optionSubtitle: {
		fontSize: 12,
		fontFamily: fonts.body,
		color: colors.textSecondary,
		marginTop: 2,
	},
	inputSection: {
		marginBottom: spacing.xl,
		gap: spacing.sm,
	},
	label: {
		fontSize: 12,
		fontFamily: fonts.bodyMedium,
		color: colors.textSecondary,
	},
	input: {
		height: 48,
		backgroundColor: colors.surface,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: radius.input,
		paddingHorizontal: spacing.md,
		fontSize: 16,
		fontFamily: fonts.bodyMedium,
		color: colors.textPrimary,
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
		lineHeight: 18,
	},
	infoBox: {
		backgroundColor: colors.neutralBackground,
		borderRadius: radius.card,
		padding: spacing.md,
		gap: spacing.sm,
	},
	infoHeader: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.sm,
	},
	infoTitle: {
		fontSize: 14,
		fontFamily: fonts.bodySemiBold,
		color: colors.textPrimary,
	},
	infoText: {
		fontSize: 13,
		fontFamily: fonts.body,
		color: colors.textSecondary,
		lineHeight: 20,
	},
	infoLinks: {
		flexDirection: "row",
		gap: spacing.lg,
		marginTop: spacing.xs,
		flexWrap: "wrap",
	},
	infoLink: {
		fontSize: 13,
		fontFamily: fonts.bodySemiBold,
		color: colors.brandTealDark,
		textDecorationLine: "underline",
	},
});
