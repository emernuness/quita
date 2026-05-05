import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, fonts, radius, spacing } from "../../src/theme/tokens";

const STATS = [
	{ value: "5", label: "dívidas quitadas" },
	{ value: "8", label: "meses de jornada" },
	{ value: "R$ 1.2k", label: "economia em juros" },
];

export default function BlueModeModal() {
	const router = useRouter();

	return (
		<View style={styles.gradientBg}>
			{/* Layered gradient bands using brand teal/green tokens */}
			<View style={styles.gradientTop} pointerEvents="none" />
			<View style={styles.gradientBottom} pointerEvents="none" />
			<SafeAreaView style={styles.safe}>
				<ScrollView
					style={styles.scroll}
					contentContainerStyle={styles.content}
					showsVerticalScrollIndicator={false}
				>
					<View style={styles.iconContainer}>
						<Feather name="award" size={48} color={colors.white} />
					</View>

					<Text style={styles.title}>Você está no azul!</Text>

					<Text style={styles.subtitle}>
						Todas as suas dívidas foram quitadas. Sua jornada financeira começa
						agora.
					</Text>

					<View style={styles.card}>
						<Text style={styles.cardTitle}>Sua jornada</Text>
						<View style={styles.statsRow}>
							{STATS.map((stat, index) => (
								<React.Fragment key={stat.label}>
									<View style={styles.statItem}>
										<Text style={styles.statValue}>{stat.value}</Text>
										<Text style={styles.statLabel}>{stat.label}</Text>
									</View>
									{index < STATS.length - 1 && (
										<View style={styles.statDivider} />
									)}
								</React.Fragment>
							))}
						</View>
					</View>

					<View style={styles.nextStepCard}>
						<Text style={styles.nextStepLabel}>Próximo passo</Text>
						<Text style={styles.nextStepText}>
							Agora que você saiu das dívidas, o próximo objetivo é construir
							uma reserva de emergência. Recomendamos guardar o equivalente a 3
							meses de despesas.
						</Text>
					</View>

					<View style={styles.buttonGroup}>
						<Pressable
							style={({ pressed }) => [
								styles.primaryButton,
								pressed && styles.buttonPressed,
							]}
							onPress={() => router.back()}
						>
							<Text style={styles.primaryButtonText}>
								Criar reserva de emergência
							</Text>
						</Pressable>

						<Pressable
							style={({ pressed }) => [
								styles.secondaryButton,
								pressed && styles.buttonPressed,
							]}
							onPress={() => router.back()}
						>
							<Text style={styles.secondaryButtonText}>Ir para o início</Text>
						</Pressable>
					</View>
				</ScrollView>
			</SafeAreaView>
		</View>
	);
}

const styles = StyleSheet.create({
	gradientBg: {
		flex: 1,
		backgroundColor: colors.blueModeGradientMid,
		borderTopLeftRadius: radius.lg,
		borderTopRightRadius: radius.lg,
		overflow: "hidden",
	},
	gradientTop: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		height: "45%",
		backgroundColor: colors.blueModeGradientStart,
		opacity: 0.85,
	},
	gradientBottom: {
		position: "absolute",
		bottom: 0,
		left: 0,
		right: 0,
		height: "45%",
		backgroundColor: colors.blueModeGradientEnd,
		opacity: 0.35,
	},
	safe: {
		flex: 1,
	},
	scroll: {
		flex: 1,
	},
	content: {
		paddingHorizontal: spacing.xl,
		paddingTop: spacing.xxl,
		paddingBottom: spacing.xxl,
		alignItems: "center",
	},
	iconContainer: {
		marginBottom: spacing.lg,
	},
	title: {
		fontSize: 28,
		fontFamily: fonts.heading,
		color: colors.white,
		textAlign: "center",
		marginBottom: spacing.sm,
	},
	subtitle: {
		fontSize: 14,
		fontFamily: fonts.body,
		color: "rgba(255,255,255,0.85)",
		textAlign: "center",
		lineHeight: 22,
		marginBottom: spacing.xl,
	},
	card: {
		backgroundColor: colors.surface,
		borderRadius: radius.card,
		padding: spacing.lg,
		width: "100%",
		marginBottom: spacing.md,
	},
	cardTitle: {
		fontSize: 16,
		fontFamily: fonts.bodySemiBold,
		color: colors.textPrimary,
		marginBottom: spacing.md,
	},
	statsRow: {
		flexDirection: "row",
		alignItems: "center",
	},
	statItem: {
		flex: 1,
		alignItems: "center",
		gap: spacing.xs,
	},
	statValue: {
		fontSize: 22,
		fontFamily: fonts.heading,
		color: colors.brandTealDark,
	},
	statLabel: {
		fontSize: 11,
		fontFamily: fonts.body,
		color: colors.textSecondary,
		textAlign: "center",
	},
	statDivider: {
		width: 1,
		height: 40,
		backgroundColor: colors.border,
	},
	nextStepCard: {
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.35)",
		borderRadius: radius.card,
		padding: spacing.lg,
		width: "100%",
		marginBottom: spacing.xl,
	},
	nextStepLabel: {
		fontSize: 12,
		fontFamily: fonts.bodySemiBold,
		color: colors.white,
		marginBottom: spacing.sm,
	},
	nextStepText: {
		fontSize: 13,
		fontFamily: fonts.body,
		color: "rgba(255,255,255,0.85)",
		lineHeight: 20,
	},
	buttonGroup: {
		width: "100%",
		gap: spacing.sm,
	},
	primaryButton: {
		backgroundColor: colors.white,
		height: 48,
		borderRadius: radius.sm,
		justifyContent: "center",
		alignItems: "center",
		width: "100%",
	},
	primaryButtonText: {
		color: colors.brandTealDark,
		fontSize: 14,
		fontFamily: fonts.bodySemiBold,
	},
	secondaryButton: {
		backgroundColor: "transparent",
		height: 48,
		borderRadius: radius.sm,
		justifyContent: "center",
		alignItems: "center",
		width: "100%",
		borderWidth: 1.5,
		borderColor: colors.white,
	},
	secondaryButtonText: {
		color: colors.white,
		fontSize: 14,
		fontFamily: fonts.bodySemiBold,
	},
	buttonPressed: {
		opacity: 0.85,
	},
});
