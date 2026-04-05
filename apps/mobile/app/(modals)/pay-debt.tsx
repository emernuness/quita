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
import { useRouter, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { colors, spacing } from "@/theme/tokens";
import { useCreatePayment, useDebt } from "../../src/hooks/useDebts";
import { maskCurrency } from "../../src/utils/masks";
import { validateWithZod } from "../../src/utils/validation";
import { createPaymentSchema } from "@quita/shared";

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
				<View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
					<Text style={{ color: colors.textSecondary }}>Dívida não encontrada.</Text>
				</View>
			</SafeAreaView>
		);
	}

	if (isLoadingDebt) {
		return (
			<SafeAreaView style={styles.safe}>
				<View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
					<ActivityIndicator size="large" color={colors.textPrimary} />
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
				onError: () =>
					Alert.alert("Erro", "Não foi possível confirmar o pagamento."),
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
				onError: () =>
					Alert.alert("Erro", "Não foi possível confirmar o pagamento."),
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
					{/* Back Button */}
					<Pressable
						style={styles.backButton}
						onPress={() => router.back()}
					>
						<Feather name="arrow-left" size={16} color={colors.textPrimary} />
						<Text style={styles.backText}>VOLTAR</Text>
					</Pressable>

					{/* Title */}
					<Text style={styles.title}>Marcar como pago</Text>

					{/* Subtitle */}
					<Text style={styles.subtitle}>
						{debt?.creditor || "..."} — {debt ? formatAmount(debt.totalAmount) : "..."}
					</Text>

					{/* Payment Options */}
					<View style={styles.optionsContainer}>
						{options.map((option) => {
							const isSelected = selectedOption === option.key;
							const isGreen = option.key === "full" && isSelected;
							const isBlue = option.key === "renegotiated" && isSelected;

							return (
								<Pressable
									key={option.key}
									style={[
										styles.optionItem,
										isGreen && styles.optionItemGreen,
										isBlue && styles.optionItemBlue,
										isSelected &&
											!isGreen &&
											!isBlue &&
											styles.optionItemSelected,
									]}
									onPress={() => setSelectedOption(option.key)}
								>
									<View style={styles.optionContent}>
										<View
											style={[
												styles.radio,
												isSelected && styles.radioSelected,
												isGreen && styles.radioWhite,
												isBlue && styles.radioWhite,
											]}
										>
											{isSelected && (
												<View
													style={[
														styles.radioDot,
														(isGreen || isBlue) && styles.radioDotColored,
													]}
												/>
											)}
										</View>
										<View style={styles.optionTextContainer}>
											<Text
												style={[
													styles.optionTitle,
													(isGreen || isBlue) && styles.optionTitleWhite,
												]}
											>
												{option.title}
											</Text>
											<Text
												style={[
													styles.optionSubtitle,
													(isGreen || isBlue) && styles.optionSubtitleWhite,
												]}
											>
												{option.subtitle}
											</Text>
										</View>
									</View>
								</Pressable>
							);
						})}
					</View>

					{/* Amount Input */}
					{(selectedOption === "partial" || selectedOption === "renegotiated") && (
						<View style={styles.inputSection}>
							<Text style={styles.label}>QUANTO VOCÊ PAGOU?</Text>
							<TextInput
								style={styles.input}
								value={rawAmountPaid ? maskCurrency(rawAmountPaid) : ""}
								onChangeText={(t) => { setRawAmountPaid(t.replace(/\D/g, "")); clearError("amount"); }}
								keyboardType="numeric"
								placeholder="R$ 0,00"
								placeholderTextColor={colors.textSecondary}
							/>
							{errors.amount ? <Text style={{ fontSize: 12, color: colors.dangerRed, marginTop: 4 }}>{errors.amount}</Text> : null}
							<Text style={styles.helperText}>
								O saldo restante será atualizado e a IA recalcula seu plano.
							</Text>
						</View>
					)}

					{/* Primary Button */}
					<Pressable
						style={({ pressed }) => [
							styles.primaryButton,
							createPayment.isPending && styles.primaryButtonDisabled,
							pressed && !createPayment.isPending && styles.primaryButtonPressed,
						]}
						onPress={handleConfirmPayment}
						disabled={createPayment.isPending}
					>
						{createPayment.isPending ? (
							<ActivityIndicator color={colors.surface} />
						) : (
							<Text style={styles.primaryButtonText}>CONFIRMAR PAGAMENTO</Text>
						)}
					</Pressable>

					{/* Info Box */}
					<View style={styles.infoBox}>
						<View style={styles.infoHeader}>
							<Feather
								name="alert-circle"
								size={16}
								color={colors.textTertiary}
							/>
							<Text style={styles.infoTitle}>Antes de confirmar</Text>
						</View>
						<Text style={styles.infoText}>
							O pagamento ficará em revisão por 24h. Você pode
							cancelar a marcação nesse período se precisar.
						</Text>
						<View style={styles.infoLinks}>
							<Pressable onPress={() => Alert.alert("Em breve", "Essa funcionalidade estará disponível em breve.")}>
								<Text style={styles.infoLink}>ver impacto no plano</Text>
							</Pressable>
							<Pressable onPress={() => Alert.alert("Em breve", "Essa funcionalidade estará disponível em breve.")}>
								<Text style={styles.infoLink}>adicionar comprovante</Text>
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
		backgroundColor: colors.background,
	},
	flex: {
		flex: 1,
	},
	scrollContent: {
		padding: 20,
		paddingBottom: 40,
	},
	backButton: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.xs,
		marginBottom: spacing.lg,
	},
	backText: {
		fontSize: 11,
		fontWeight: "600",
		letterSpacing: 3,
		color: colors.textPrimary,
		textTransform: "uppercase",
	},
	title: {
		fontSize: 32,
		fontWeight: "800",
		fontStyle: "italic",
		color: colors.textPrimary,
		marginBottom: spacing.sm,
	},
	subtitle: {
		fontSize: 14,
		fontWeight: "500",
		color: colors.textSecondary,
		marginBottom: spacing.xl,
	},
	optionsContainer: {
		gap: spacing.sm,
		marginBottom: spacing.xl,
	},
	optionItem: {
		borderWidth: 2,
		borderColor: colors.border,
		borderLeftWidth: 5,
		height: 68,
		justifyContent: "center",
		paddingHorizontal: spacing.md,
	},
	optionItemGreen: {
		backgroundColor: colors.successGreen,
		borderColor: colors.successGreen,
		borderLeftColor: colors.successGreen,
	},
	optionItemBlue: {
		backgroundColor: colors.accentBlue,
		borderColor: colors.accentBlue,
		borderLeftColor: colors.accentBlue,
	},
	optionItemSelected: {
		borderColor: colors.borderStrong,
		borderLeftColor: colors.borderStrong,
	},
	optionContent: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.md,
	},
	radio: {
		width: 20,
		height: 20,
		borderRadius: 10,
		borderWidth: 2,
		borderColor: colors.border,
		alignItems: "center",
		justifyContent: "center",
	},
	radioSelected: {
		borderColor: colors.borderStrong,
	},
	radioWhite: {
		borderColor: "#FFFFFF",
	},
	radioDot: {
		width: 10,
		height: 10,
		borderRadius: 5,
		backgroundColor: colors.textPrimary,
	},
	radioDotColored: {
		backgroundColor: "#FFFFFF",
	},
	optionTextContainer: {
		flex: 1,
	},
	optionTitle: {
		fontSize: 14,
		fontWeight: "600",
		color: colors.textPrimary,
	},
	optionTitleWhite: {
		color: "#FFFFFF",
	},
	optionSubtitle: {
		fontSize: 12,
		fontWeight: "500",
		color: colors.textSecondary,
	},
	optionSubtitleWhite: {
		color: "rgba(255,255,255,0.8)",
	},
	inputSection: {
		marginBottom: spacing.xl,
		gap: spacing.sm,
	},
	label: {
		fontSize: 11,
		fontWeight: "600",
		letterSpacing: 3,
		color: colors.textSecondary,
		textTransform: "uppercase",
	},
	input: {
		height: 52,
		backgroundColor: colors.surface,
		borderWidth: 2,
		borderColor: colors.textPrimary,
		paddingHorizontal: spacing.md,
		fontSize: 18,
		fontWeight: "500",
		color: colors.textPrimary,
	},
	helperText: {
		fontSize: 12,
		fontWeight: "500",
		color: colors.textSecondary,
		lineHeight: 18,
	},
	primaryButton: {
		backgroundColor: colors.textPrimary,
		height: 52,
		justifyContent: "center",
		alignItems: "center",
		marginBottom: spacing.lg,
	},
	primaryButtonPressed: {
		opacity: 0.85,
	},
	primaryButtonDisabled: {
		opacity: 0.6,
	},
	primaryButtonText: {
		color: colors.surface,
		fontSize: 11,
		fontWeight: "600",
		letterSpacing: 1,
		textTransform: "uppercase",
	},
	infoBox: {
		backgroundColor: "#F5F5F5",
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
		fontWeight: "700",
		color: colors.textPrimary,
	},
	infoText: {
		fontSize: 13,
		fontWeight: "500",
		color: colors.textTertiary,
		lineHeight: 20,
	},
	infoLinks: {
		flexDirection: "row",
		gap: spacing.lg,
		marginTop: spacing.xs,
	},
	infoLink: {
		fontSize: 13,
		fontWeight: "600",
		color: colors.accentBlue,
		textDecorationLine: "underline",
	},
});
