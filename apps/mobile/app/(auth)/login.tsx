import { colors, fonts, radius, spacing } from "@/theme/tokens";
import { Feather } from "@expo/vector-icons";
import { loginSchema } from "@quita/shared";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
	Alert,
	Image,
	KeyboardAvoidingView,
	Platform,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../../src/components/Button";
import { Input } from "../../src/components/Input";
import { useAuthStore } from "../../src/stores/auth";
import { validateWithZod } from "../../src/utils/validation";

const REMEMBER_EMAIL_KEY = "rememberedEmail";
const REMEMBER_FLAG_KEY = "rememberMe";

export default function LoginScreen() {
	const router = useRouter();
	const { login } = useAuthStore();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [rememberMe, setRememberMe] = useState(true);
	const [loading, setLoading] = useState(false);
	const [errors, setErrors] = useState<Record<string, string>>({});

	useEffect(() => {
		(async () => {
			const [savedEmail, savedFlag] = await Promise.all([
				SecureStore.getItemAsync(REMEMBER_EMAIL_KEY),
				SecureStore.getItemAsync(REMEMBER_FLAG_KEY),
			]);
			if (savedEmail) setEmail(savedEmail);
			if (savedFlag !== null) setRememberMe(savedFlag === "1");
		})();
	}, []);

	const clearError = (field: string) => {
		setErrors((prev) => {
			if (!prev[field]) return prev;
			const next = { ...prev };
			delete next[field];
			return next;
		});
	};

	const handleSubmit = async () => {
		const normalizedEmail = email.trim().toLowerCase();
		const result = validateWithZod(loginSchema, {
			email: normalizedEmail,
			password,
		});
		if (!result.success) {
			setErrors(result.errors);
			return;
		}
		setLoading(true);
		try {
			await login(normalizedEmail, password);
			await SecureStore.setItemAsync(REMEMBER_FLAG_KEY, rememberMe ? "1" : "0");
			if (rememberMe) {
				await SecureStore.setItemAsync(REMEMBER_EMAIL_KEY, normalizedEmail);
			} else {
				await SecureStore.deleteItemAsync(REMEMBER_EMAIL_KEY);
				await SecureStore.deleteItemAsync("accessToken");
			}
			router.replace("/");
		} catch (error: unknown) {
			const message =
				error instanceof Error ? error.message : "Verifique suas credenciais e tente novamente.";
			Alert.alert("Erro ao entrar", message);
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
					<Pressable style={styles.backButton} onPress={() => router.back()} hitSlop={12}>
						<Feather name="arrow-left" size={16} color={colors.textPrimary} />
						<Text style={styles.backText}>Voltar</Text>
					</Pressable>

					<View style={styles.logoContainer}>
						<Image
							source={require("../../assets/brand/logo-01.png")}
							style={styles.logo}
							resizeMode="contain"
						/>
						<Text style={styles.subtitle}>Organize suas dívidas com segurança.</Text>
					</View>

					<Text style={styles.sectionTitle}>Entrar na sua conta</Text>

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

					<View style={styles.rowBetween}>
						<Pressable
							style={styles.rememberRow}
							onPress={() => setRememberMe((v) => !v)}
							hitSlop={8}
						>
							<View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
								{rememberMe && <Feather name="check" size={14} color={colors.white} />}
							</View>
							<Text style={styles.rememberLabel}>Lembrar de mim</Text>
						</Pressable>

						<Pressable onPress={() => router.push("/(auth)/forgot-password")}>
							<Text style={styles.forgotLink}>Esqueci minha senha</Text>
						</Pressable>
					</View>

					<View style={styles.dividerContainer}>
						<View style={styles.dividerLine} />
						<Text style={styles.dividerText}>Ou entre com</Text>
						<View style={styles.dividerLine} />
					</View>

					<Pressable
						style={({ pressed }) => [styles.googleButton, pressed && { opacity: 0.8 }]}
						onPress={() => Alert.alert("Em breve", "Login com Google estará disponível em breve.")}
					>
						<Text style={styles.googleButtonText}>G{"  "}Entrar com Google</Text>
					</Pressable>

					<View style={styles.spacer} />

					<Button label="Entrar" loading={loading} onPress={handleSubmit} />

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
	logoContainer: {
		alignItems: "center",
		marginTop: spacing.xl,
		marginBottom: spacing.xl,
	},
	logo: {
		width: 160,
		height: 56,
	},
	subtitle: {
		fontSize: 14,
		fontFamily: fonts.bodyMedium,
		color: colors.textSecondary,
		textAlign: "center",
		marginTop: spacing.md,
	},
	sectionTitle: {
		fontSize: 24,
		fontFamily: fonts.heading,
		color: colors.textPrimary,
		marginBottom: spacing.lg,
	},
	form: {
		gap: spacing.md,
		marginBottom: spacing.md,
	},
	rowBetween: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: spacing.lg,
	},
	rememberRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.sm,
	},
	checkbox: {
		width: 20,
		height: 20,
		borderRadius: radius.input,
		borderWidth: 1.5,
		borderColor: colors.border,
		backgroundColor: colors.surface,
		alignItems: "center",
		justifyContent: "center",
	},
	checkboxChecked: {
		backgroundColor: colors.brandTealDark,
		borderColor: colors.brandTealDark,
	},
	rememberLabel: {
		fontSize: 14,
		fontFamily: fonts.bodyMedium,
		color: colors.textPrimary,
	},
	forgotLink: {
		fontSize: 14,
		fontFamily: fonts.bodySemiBold,
		color: colors.brandTealDark,
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
