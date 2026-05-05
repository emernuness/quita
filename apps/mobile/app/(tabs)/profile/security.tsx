import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { colors, fonts, radius, spacing } from "@/theme/tokens";

export default function SecurityScreen() {
	const router = useRouter();
	const [fingerprint, setFingerprint] = useState(true);
	const [faceUnlock, setFaceUnlock] = useState(false);

	return (
		<SafeAreaView style={styles.safe}>
			<ScrollView
				style={styles.flex}
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			>
				{/* Back Button */}
				<Pressable onPress={() => router.back()} style={styles.backButton}>
					<Feather name="arrow-left" size={20} color={colors.textPrimary} />
					<Text style={styles.backText}>Voltar</Text>
				</Pressable>

				{/* Title */}
				<Text style={styles.title}>Segurança e biometria</Text>

				{/* Subtitle */}
				<Text style={styles.subtitle}>
					Proteja seus dados. Ninguém além de você deve ver suas dívidas.
				</Text>

				{/* Fingerprint Toggle */}
				<View style={styles.toggleRow}>
					<View style={{ flex: 1 }}>
						<Text style={styles.toggleTitle}>Desbloqueio com digital</Text>
						<Text style={styles.toggleSubtitle}>
							Usar impressão digital pra abrir o app
						</Text>
					</View>
					<Switch
						value={fingerprint}
						onValueChange={setFingerprint}
						trackColor={{ false: colors.border, true: colors.accentGreen }}
						thumbColor={colors.white}
					/>
				</View>

				{/* Face Unlock Toggle */}
				<View style={styles.toggleRow}>
					<View style={{ flex: 1 }}>
						<Text style={styles.toggleTitle}>Desbloqueio com rosto</Text>
						<Text style={styles.toggleSubtitle}>
							Usar reconhecimento facial
						</Text>
					</View>
					<Switch
						value={faceUnlock}
						onValueChange={setFaceUnlock}
						trackColor={{ false: colors.border, true: colors.accentGreen }}
						thumbColor={colors.white}
					/>
				</View>

				{/* Change Password Link */}
				<Pressable
					style={styles.toggleRow}
					onPress={() => {
						/* TODO: navigate to change password */
					}}
				>
					<View style={{ flex: 1 }}>
						<Text style={styles.toggleTitle}>Trocar senha</Text>
						<Text style={styles.toggleSubtitle}>
							Atualizar sua senha de acesso
						</Text>
					</View>
					<Feather name="chevron-right" size={20} color={colors.textTertiary} />
				</Pressable>

				{/* Info Card */}
				<View style={styles.infoCard}>
					<Text style={styles.infoCardTitle}>Visibilidade da segurança</Text>
					<Text style={styles.infoCardText}>
						Em breve, você poderá ver o último acesso, dispositivos conectados e
						receber alertas de login suspeito.
					</Text>
				</View>
			</ScrollView>
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
		paddingVertical: spacing.lg,
		paddingBottom: spacing.xxl,
	},
	backButton: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.sm,
		marginBottom: spacing.md,
	},
	backText: {
		fontFamily: fonts.bodySemiBold,
		fontSize: 14,
		color: colors.textPrimary,
	},
	title: {
		fontFamily: fonts.heading,
		fontSize: 28,
		color: colors.textPrimary,
		marginBottom: spacing.sm,
	},
	subtitle: {
		fontFamily: fonts.body,
		fontSize: 15,
		color: colors.textSecondary,
		lineHeight: 22,
		marginBottom: spacing.xl,
	},
	toggleRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingVertical: spacing.md,
		borderBottomWidth: 0.5,
		borderBottomColor: colors.border,
	},
	toggleTitle: {
		fontFamily: fonts.bodySemiBold,
		fontSize: 16,
		color: colors.textPrimary,
		marginBottom: 2,
	},
	toggleSubtitle: {
		fontFamily: fonts.body,
		fontSize: 13,
		color: colors.textSecondary,
	},
	infoCard: {
		backgroundColor: colors.infoBackground,
		padding: spacing.md,
		borderRadius: radius.card,
		marginTop: spacing.xl,
	},
	infoCardTitle: {
		fontFamily: fonts.bodySemiBold,
		fontSize: 14,
		color: colors.brandTealDark,
		marginBottom: spacing.xs,
	},
	infoCardText: {
		fontFamily: fonts.body,
		fontSize: 13,
		color: colors.brandTealDark,
		lineHeight: 19,
	},
});
