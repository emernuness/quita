import React, { useState } from "react";
import {
	KeyboardAvoidingView,
	Platform,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { colors, spacing } from "@/theme/tokens";
import { Button } from "../../src/components/Button";
import { Input } from "../../src/components/Input";
import { validateWithZod } from "../../src/utils/validation";
import { forgotPasswordSchema } from "@quita/shared";

export default function ForgotPasswordScreen() {
	const router = useRouter();
	const [contact, setContact] = useState("");
	const [loading, setLoading] = useState(false);
	const [errors, setErrors] = useState<Record<string, string>>({});

	const clearError = (field: string) => {
		setErrors((prev) => {
			if (!prev[field]) return prev;
			const next = { ...prev };
			delete next[field];
			return next;
		});
	};

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
						hitSlop={12}
					>
						<Feather name="arrow-left" size={16} color={colors.textPrimary} />
						<Text style={styles.backButtonText}>VOLTAR</Text>
					</Pressable>

					{/* Step Label */}
					<Text style={styles.stepLabel}>RECUPERAÇÃO SEGURA</Text>

					{/* Steps Indicator */}
					<Text style={styles.stepsText}>
						1. Informar contato{"  "}2. Receber código{"  "}3. Criar nova senha
					</Text>

					{/* Title */}
					<Text style={styles.title}>Esqueceu a senha?</Text>

					{/* Description */}
					<Text style={styles.description}>
						Sem problema. Informe o e-mail ou telefone que você usou no cadastro
						e enviaremos um código para você criar uma nova senha com segurança.
					</Text>

					{/* Input */}
					<View style={styles.inputContainer}>
						<Input
							label="TELEFONE OU E-MAIL"
							placeholder="(11) 99999-9999 ou voce@exemplo.com"
							value={contact}
							onChangeText={(t) => {
								setContact(t);
								clearError("contact");
							}}
							error={errors.contact}
						/>
					</View>

					{/* Info Box */}
					<View style={styles.infoBox}>
						<Text style={styles.infoTitle}>
							Por que confirmamos esse dado?
						</Text>
						<Text style={styles.infoText}>
							Isso evita acesso indevido e permite recuperar sua conta com mais
							rapidez.
						</Text>
					</View>

					{/* Spacer */}
					<View style={styles.spacer} />

					{/* Primary Button */}
					<Button
						label="ENVIAR CÓDIGO"
						loading={loading}
						onPress={() => {
							const result = validateWithZod(forgotPasswordSchema, {
								contact: contact.trim(),
							});
							if (!result.success) {
								setErrors(result.errors);
								return;
							}
							// TODO: call forgot password API
						}}
					/>

					{/* Secondary Button */}
					<View style={styles.secondaryButtonContainer}>
						<Button
							variant="secondary"
							label="VOLTAR AO LOGIN"
							onPress={() => router.push("/(auth)/login")}
						/>
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
		alignSelf: "flex-start",
		marginTop: spacing.sm,
		marginBottom: spacing.lg,
	},
	backButtonText: {
		fontSize: 11,
		fontWeight: "600",
		letterSpacing: 3,
		color: colors.textPrimary,
		textTransform: "uppercase",
	},
	stepLabel: {
		fontSize: 11,
		fontWeight: "600",
		letterSpacing: 2,
		color: colors.successGreen,
		textTransform: "uppercase",
		marginBottom: spacing.sm,
	},
	stepsText: {
		fontSize: 12,
		fontWeight: "500",
		color: colors.textSecondary,
		marginBottom: spacing.lg,
		lineHeight: 18,
	},
	title: {
		fontSize: 32,
		fontWeight: "800",
		color: colors.textPrimary,
		marginBottom: spacing.md,
	},
	description: {
		fontSize: 14,
		fontWeight: "500",
		color: colors.textTertiary,
		lineHeight: 22,
		marginBottom: spacing.lg,
	},
	inputContainer: {
		marginBottom: spacing.lg,
	},
	infoBox: {
		backgroundColor: "#EEF4FF",
		padding: 16,
		borderRadius: 8,
		marginBottom: spacing.md,
	},
	infoTitle: {
		fontSize: 14,
		fontWeight: "700",
		color: colors.textPrimary,
		marginBottom: spacing.xs,
	},
	infoText: {
		fontSize: 14,
		fontWeight: "500",
		color: colors.textTertiary,
		lineHeight: 20,
	},
	spacer: {
		height: spacing.lg,
	},
	secondaryButtonContainer: {
		marginTop: spacing.sm,
	},
});
