import React, { useState } from "react";
import {
	Alert,
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
import { colors, fonts, radius, spacing } from "@/theme/tokens";
import { Button } from "../../src/components/Button";
import { Input } from "../../src/components/Input";
import { useAuthStore } from "../../src/stores/auth";
import { validateWithZod } from "../../src/utils/validation";
import { registerSchema } from "@quita/shared";
import { maskPhone, unmaskPhone } from "../../src/utils/masks";

export default function RegisterScreen() {
	const router = useRouter();
	const { register } = useAuthStore();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [errors, setErrors] = useState<Record<string, string>>({});

	const handlePhoneChange = (text: string) => {
		setPhone(maskPhone(text));
		clearError("phone");
	};

	const clearError = (field: string) => {
		setErrors((prev) => {
			if (!prev[field]) return prev;
			const next = { ...prev };
			delete next[field];
			return next;
		});
	};

	const validate = (): boolean => {
		const newErrors: Record<string, string> = {};

		if (password !== confirmPassword) {
			newErrors.confirmPassword = "As senhas não coincidem";
		}

		const result = validateWithZod(registerSchema, {
			name: name.trim(),
			email: email.trim().toLowerCase(),
			phone: unmaskPhone(phone),
			password,
		});

		if (!result.success) {
			for (const [key, val] of Object.entries(result.errors)) {
				if (!newErrors[key]) newErrors[key] = val;
			}
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleRegister = async () => {
		if (!validate()) return;

		setLoading(true);
		try {
			await register(name.trim(), email.trim().toLowerCase(), unmaskPhone(phone), password);
			router.replace("/");
		} catch (error: unknown) {
			const isConflict =
				error != null &&
				typeof error === "object" &&
				"response" in error &&
				(error as { response?: { status?: number } }).response?.status === 409;

			if (isConflict) {
				Alert.alert(
					"Conta já existe",
					"Você já tem uma conta com esse e-mail. Deseja fazer login?",
					[
						{ text: "Cancelar", style: "cancel" },
						{
							text: "Fazer login",
							onPress: () => router.replace("/(auth)/login"),
						},
					],
				);
			} else {
				const message =
					error instanceof Error
						? error.message
						: "Verifique seus dados e tente novamente.";
				Alert.alert("Erro ao criar conta", message);
			}
		} finally {
			setLoading(false);
		}
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
						<Text style={styles.backText}>Voltar</Text>
					</Pressable>

					{/* Step Label */}
					<Text style={styles.stepLabel}>Crie sua conta</Text>

					{/* Title */}
					<Text style={styles.title}>
						Vamos começar com seus dados
					</Text>

					{/* Form */}
					<View style={styles.form}>
						<Input
							label="NOME COMPLETO"
							placeholder="Ex: Maria Silva"
							value={name}
							onChangeText={(t) => {
								setName(t);
								clearError("name");
							}}
							autoCapitalize="words"
							error={errors.name}
						/>

						<Input
							label="E-MAIL"
							placeholder="seu@email.com"
							value={email}
							onChangeText={(t) => {
								setEmail(t);
								clearError("email");
							}}
							keyboardType="email-address"
							error={errors.email}
						/>

						<Input
							label="CELULAR"
							placeholder="(41) 99999-9999"
							value={phone}
							onChangeText={handlePhoneChange}
							keyboardType="phone-pad"
							error={errors.phone}
						/>

						<Input
							label="CRIE UMA SENHA"
							placeholder="Mínimo 8 caracteres"
							value={password}
							onChangeText={(t) => {
								setPassword(t);
								clearError("password");
							}}
							secureTextEntry
							error={errors.password}
						/>

						<Input
							label="CONFIRME A SENHA"
							placeholder="Repita a senha"
							value={confirmPassword}
							onChangeText={(t) => {
								setConfirmPassword(t);
								clearError("confirmPassword");
							}}
							secureTextEntry
							error={errors.confirmPassword}
						/>
					</View>

					{/* Divider */}
					<View style={styles.dividerContainer}>
						<View style={styles.dividerLine} />
						<Text style={styles.dividerText}>Ou cadastre com</Text>
						<View style={styles.dividerLine} />
					</View>

					{/* Google Button */}
					<Pressable
						style={({ pressed }) => [
							styles.googleButton,
							pressed && { opacity: 0.8 },
						]}
						onPress={() => Alert.alert("Em breve", "Login com Google estará disponível em breve.")}
					>
						<Text style={styles.googleButtonText}>
							G{"  "}Continuar com Google
						</Text>
					</Pressable>

					{/* Spacer */}
					<View style={styles.spacer} />

					{/* Primary Button */}
					<Button
						label="Criar conta"
						loading={loading}
						onPress={handleRegister}
					/>

					{/* Bottom Text */}
					<View style={styles.bottomTextContainer}>
						<Text style={styles.bottomText}>Já tem conta? </Text>
						<Pressable onPress={() => router.push("/(auth)/login")}>
							<Text style={styles.bottomLink}>Entrar</Text>
						</Pressable>
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
		paddingHorizontal: spacing.xl,
		paddingTop: spacing.lg,
		paddingBottom: spacing.xxl,
	},
	backButton: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.xs,
		marginTop: spacing.sm,
		marginBottom: spacing.md,
		alignSelf: "flex-start",
	},
	backText: {
		fontSize: 14,
		fontFamily: fonts.bodySemiBold,
		color: colors.textPrimary,
	},
	stepLabel: {
		fontSize: 12,
		fontFamily: fonts.bodySemiBold,
		color: colors.successGreen,
		marginTop: spacing.lg,
		marginBottom: spacing.sm,
	},
	title: {
		fontSize: 28,
		fontFamily: fonts.heading,
		color: colors.textPrimary,
		marginBottom: spacing.lg,
	},
	form: {
		gap: spacing.md,
		marginBottom: spacing.lg,
	},
	dividerContainer: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: spacing.md,
	},
	dividerLine: {
		flex: 1,
		height: 0.5,
		backgroundColor: colors.border,
	},
	dividerText: {
		fontSize: 12,
		fontFamily: fonts.bodySemiBold,
		color: colors.textSecondary,
		marginHorizontal: spacing.md,
	},
	googleButton: {
		height: 48,
		paddingHorizontal: 20,
		backgroundColor: colors.surface,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: radius.sm,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: spacing.md,
	},
	googleButtonText: {
		fontSize: 14,
		fontFamily: fonts.bodySemiBold,
		color: colors.textPrimary,
	},
	spacer: {
		height: spacing.lg,
	},
	bottomTextContainer: {
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
		marginTop: spacing.md,
	},
	bottomText: {
		fontSize: 14,
		fontFamily: fonts.bodyMedium,
		color: colors.textTertiary,
	},
	bottomLink: {
		fontSize: 14,
		fontFamily: fonts.bodySemiBold,
		color: colors.brandTealDark,
	},
});
