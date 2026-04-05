import React, { useState } from "react";
import {
	Pressable,
	ScrollView,
	StyleSheet,
	Switch,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { colors, spacing } from "@/theme/tokens";

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
				<Pressable
					onPress={() => router.back()}
					style={styles.backButton}
				>
					<Feather
						name="arrow-left"
						size={20}
						color={colors.textPrimary}
					/>
					<Text style={styles.backText}>VOLTAR</Text>
				</Pressable>

				{/* Title */}
				<Text style={styles.title}>Segurança e Biometria</Text>

				{/* Subtitle */}
				<Text style={styles.subtitle}>
					Proteja seus dados. Ninguém além de você deve ver suas
					dívidas.
				</Text>

				{/* Fingerprint Toggle */}
				<View style={styles.toggleRow}>
					<View style={{ flex: 1 }}>
						<Text style={styles.toggleTitle}>
							Desbloqueio com digital
						</Text>
						<Text style={styles.toggleSubtitle}>
							Usar impressão digital pra abrir o app
						</Text>
					</View>
					<Switch
						value={fingerprint}
						onValueChange={setFingerprint}
						trackColor={{ false: "#E5E5E5", true: "#00AA55" }}
						thumbColor="#FFFFFF"
					/>
				</View>

				{/* Face Unlock Toggle */}
				<View style={styles.toggleRow}>
					<View style={{ flex: 1 }}>
						<Text style={styles.toggleTitle}>
							Desbloqueio com rosto
						</Text>
						<Text style={styles.toggleSubtitle}>
							Usar reconhecimento facial
						</Text>
					</View>
					<Switch
						value={faceUnlock}
						onValueChange={setFaceUnlock}
						trackColor={{ false: "#E5E5E5", true: "#00AA55" }}
						thumbColor="#FFFFFF"
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
					<Feather
						name="chevron-right"
						size={20}
						color={colors.textSecondary}
					/>
				</Pressable>

				{/* Info Card */}
				<View style={styles.infoCard}>
					<Text style={styles.infoCardTitle}>
						Visibilidade da segurança
					</Text>
					<Text style={styles.infoCardText}>
						Em breve, você poderá ver o último acesso, dispositivos
						conectados e receber alertas de login suspeito.
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
		padding: spacing.lg,
		paddingBottom: spacing.xxl,
	},
	backButton: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		marginBottom: spacing.md,
	},
	backText: {
		fontSize: 11,
		fontWeight: "600",
		letterSpacing: 2,
		color: colors.textPrimary,
	},
	title: {
		fontSize: 32,
		fontWeight: "800",
		color: colors.textPrimary,
		marginBottom: spacing.sm,
	},
	subtitle: {
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
		borderBottomWidth: 1,
		borderBottomColor: colors.border,
	},
	toggleTitle: {
		fontSize: 16,
		fontWeight: "700",
		color: colors.textPrimary,
		marginBottom: 2,
	},
	toggleSubtitle: {
		fontSize: 13,
		color: colors.textSecondary,
	},
	infoCard: {
		backgroundColor: "#EEF4FF",
		padding: spacing.md,
		borderRadius: 12,
		marginTop: spacing.xl,
	},
	infoCardTitle: {
		fontSize: 14,
		fontWeight: "700",
		color: colors.accentBlue,
		marginBottom: spacing.xs,
	},
	infoCardText: {
		fontSize: 13,
		color: colors.accentBlue,
		lineHeight: 19,
	},
});
