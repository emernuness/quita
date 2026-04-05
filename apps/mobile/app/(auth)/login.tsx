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
import { colors, spacing } from "@/theme/tokens";
import { Button } from "../../src/components/Button";
import { Input } from "../../src/components/Input";
import { useAuthStore } from "../../src/stores/auth";
import { validateWithZod } from "../../src/utils/validation";
import { loginSchema } from "@quita/shared";

export default function LoginScreen() {
	const router = useRouter();
	const { login } = useAuthStore();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
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
						<Text style={styles.backText}>VOLTAR</Text>
					</Pressable>

					{/* Logo */}
					<View style={styles.logoContainer}>
						<Text style={styles.logo}>QUITA</Text>
						<Text style={styles.subtitle}>
							Organize suas dívidas com segurança.
						</Text>
					</View>

					{/* Info Box */}
					<View style={styles.infoBox}>
						<Text style={styles.infoTitle}>Continue seu diagnóstico</Text>
						<Text style={styles.infoText}>
							Entre com seu e-mail e senha para retomar o plano salvo. Se
							precisar, você recupera o acesso em poucos passos.
						</Text>
					</View>

					{/* Section Title */}
					<Text style={styles.sectionTitle}>Entrar na sua conta</Text>

					{/* Form */}
					<View style={styles.form}>
						<Input
							label="E-MAIL"
							placeholder="voce@exemplo.com"
							value={email}
							onChangeText={(t) => {
								setEmail(t);
								clearError("email");
							}}
							keyboardType="email-address"
							error={errors.email}
						/>

						<Input
							label="SENHA"
							placeholder="Sua senha"
							value={password}
							onChangeText={(t) => {
								setPassword(t);
								clearError("password");
							}}
							secureTextEntry
							error={errors.password}
						/>
					</View>

					{/* Helper Text */}
					<Text style={styles.helperText}>
						Use um aparelho confiável e saia ao terminar.
					</Text>

					{/* Forgot Password */}
					<Pressable onPress={() => router.push("/(auth)/forgot-password")}>
						<Text style={styles.forgotLink}>Esqueci minha senha</Text>
					</Pressable>

					{/* Divider */}
					<View style={styles.dividerContainer}>
						<View style={styles.dividerLine} />
						<Text style={styles.dividerText}>OU ENTRE COM</Text>
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
						<Text style={styles.googleButtonText}>G{"  "}ENTRAR COM GOOGLE</Text>
					</Pressable>

					{/* Spacer */}
					<View style={styles.spacer} />

					{/* Primary Button */}
					<Button
						label="ENTRAR"
						loading={loading}
						onPress={async () => {
							const result = validateWithZod(loginSchema, {
								email: email.trim().toLowerCase(),
								password,
							});
							if (!result.success) {
								setErrors(result.errors);
								return;
							}
							setLoading(true);
							try {
								await login(email.trim().toLowerCase(), password);
								router.replace("/");
							} catch (error: unknown) {
								const message =
									error instanceof Error
										? error.message
										: "Verifique suas credenciais e tente novamente.";
								Alert.alert("Erro ao entrar", message);
							} finally {
								setLoading(false);
							}
						}}
					/>

					{/* Bottom Text */}
					<View style={styles.bottomTextContainer}>
						<Text style={styles.bottomText}>Não tem conta? </Text>
						<Pressable onPress={() => router.push("/(auth)/register")}>
							<Text style={styles.bottomLink}>Cadastre-se</Text>
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
		padding: 20,
		paddingBottom: 40,
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
		fontSize: 11,
		fontWeight: "600",
		letterSpacing: 3,
		color: colors.textPrimary,
		textTransform: "uppercase",
	},
	logoContainer: {
		alignItems: "center",
		marginTop: spacing.lg,
		marginBottom: spacing.lg,
	},
	logo: {
		fontSize: 36,
		fontWeight: "800",
		color: colors.textPrimary,
		textAlign: "center",
	},
	subtitle: {
		fontSize: 14,
		fontWeight: "500",
		color: colors.textSecondary,
		textAlign: "center",
		marginTop: spacing.sm,
	},
	infoBox: {
		backgroundColor: "#F5F5F5",
		padding: 16,
		borderRadius: 8,
		marginBottom: spacing.lg,
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
	sectionTitle: {
		fontSize: 24,
		fontWeight: "800",
		color: colors.textPrimary,
		marginBottom: spacing.lg,
	},
	form: {
		gap: spacing.md,
		marginBottom: spacing.md,
	},
	helperText: {
		fontSize: 12,
		fontWeight: "500",
		color: colors.textSecondary,
		marginBottom: spacing.sm,
	},
	forgotLink: {
		fontSize: 14,
		fontWeight: "600",
		color: colors.accentBlue,
		textDecorationLine: "underline",
		marginBottom: spacing.lg,
	},
	dividerContainer: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: spacing.md,
	},
	dividerLine: {
		flex: 1,
		height: 1,
		backgroundColor: colors.border,
	},
	dividerText: {
		fontSize: 11,
		fontWeight: "600",
		letterSpacing: 2,
		color: colors.textSecondary,
		marginHorizontal: spacing.md,
	},
	googleButton: {
		height: 52,
		backgroundColor: colors.surface,
		borderWidth: 2,
		borderColor: colors.textPrimary,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: spacing.md,
	},
	googleButtonText: {
		fontSize: 11,
		fontWeight: "600",
		letterSpacing: 1,
		color: colors.textPrimary,
		textTransform: "uppercase",
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
		fontWeight: "500",
		color: colors.textTertiary,
	},
	bottomLink: {
		fontSize: 14,
		fontWeight: "600",
		color: colors.accentBlue,
	},
});
