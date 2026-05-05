import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../../src/components";
import { badges, colors, fonts, radius, spacing } from "../../src/theme/tokens";

const DEBT_DETAILS = [
	{ label: "Valor total pago", value: "R$ 3.250,00" },
	{ label: "Duração", value: "6 meses" },
];

export default function CelebrationModal() {
	const router = useRouter();

	return (
		<SafeAreaView style={styles.safe}>
			<ScrollView
				style={styles.scroll}
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
			>
				<View style={styles.iconCircle}>
					<Feather name="award" size={36} color={colors.successGreen} />
				</View>

				<Text style={styles.title}>Parabéns!</Text>

				<Text style={styles.subtitle}>Você quitou uma dívida!</Text>

				<Text style={styles.description}>
					Cada dívida quitada é um passo importante na sua jornada financeira.
					Continue assim!
				</Text>

				<View style={styles.debtCard}>
					<View style={styles.debtHeader}>
						<Text style={styles.debtName}>Cartão Nubank</Text>
						<View style={styles.badge}>
							<View style={styles.badgeDot} />
							<Text style={styles.badgeText}>Quitada</Text>
						</View>
					</View>

					{DEBT_DETAILS.map((detail) => (
						<View key={detail.label} style={styles.detailRow}>
							<Text style={styles.detailLabel}>{detail.label}</Text>
							<Text style={styles.detailValue}>{detail.value}</Text>
						</View>
					))}

					<View style={styles.detailRow}>
						<Text style={styles.detailLabel}>Economia em juros</Text>
						<Text style={styles.detailValueGreen}>R$ 480,00</Text>
					</View>
				</View>

				<View style={styles.progressSection}>
					<View style={styles.progressHeader}>
						<Text style={styles.progressTitle}>Progresso geral</Text>
						<Text style={styles.progressCount}>3 de 5 dívidas</Text>
					</View>
					<View style={styles.progressBarBg}>
						<View style={styles.progressBarFill} />
					</View>
				</View>

				<View style={styles.buttonGroup}>
					<Button
						variant="primary"
						label="Ver minhas dívidas"
						onPress={() => router.back()}
					/>
					<Button
						variant="secondary"
						label="Compartilhar conquista"
						onPress={() => router.back()}
					/>
				</View>
			</ScrollView>
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
	scroll: {
		flex: 1,
	},
	content: {
		paddingHorizontal: spacing.xl,
		paddingTop: spacing.xxl,
		paddingBottom: spacing.xxl,
		alignItems: "center",
	},
	iconCircle: {
		width: 72,
		height: 72,
		borderRadius: radius.full,
		backgroundColor: colors.successBackground,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: spacing.lg,
	},
	title: {
		fontSize: 28,
		fontFamily: fonts.heading,
		color: colors.textPrimary,
		textAlign: "center",
		marginBottom: spacing.xs,
	},
	subtitle: {
		fontSize: 18,
		fontFamily: fonts.bodySemiBold,
		color: colors.brandTealDark,
		textAlign: "center",
		marginBottom: spacing.md,
	},
	description: {
		fontSize: 14,
		fontFamily: fonts.body,
		color: colors.textSecondary,
		textAlign: "center",
		lineHeight: 22,
		marginBottom: spacing.xl,
	},
	debtCard: {
		backgroundColor: colors.surface,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: radius.card,
		borderLeftWidth: 1.5,
		borderLeftColor: colors.successGreen,
		padding: spacing.lg,
		width: "100%",
		marginBottom: spacing.lg,
	},
	debtHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: spacing.md,
	},
	debtName: {
		fontSize: 16,
		fontFamily: fonts.bodySemiBold,
		color: colors.textPrimary,
	},
	badge: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.xs,
		backgroundColor: badges.success.background,
		paddingHorizontal: spacing.sm + 2,
		paddingVertical: spacing.xs,
		borderRadius: radius.pill,
	},
	badgeDot: {
		width: 6,
		height: 6,
		borderRadius: radius.full,
		backgroundColor: badges.success.dot,
	},
	badgeText: {
		fontSize: 11,
		fontFamily: fonts.bodySemiBold,
		color: badges.success.color,
	},
	detailRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingVertical: spacing.sm,
		borderTopWidth: 0.5,
		borderTopColor: colors.border,
	},
	detailLabel: {
		fontSize: 13,
		fontFamily: fonts.body,
		color: colors.textSecondary,
	},
	detailValue: {
		fontSize: 14,
		fontFamily: fonts.bodySemiBold,
		color: colors.textPrimary,
	},
	detailValueGreen: {
		fontSize: 14,
		fontFamily: fonts.bodySemiBold,
		color: colors.successGreen,
	},
	progressSection: {
		width: "100%",
		marginBottom: spacing.xl,
	},
	progressHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: spacing.sm,
	},
	progressTitle: {
		fontSize: 14,
		fontFamily: fonts.bodySemiBold,
		color: colors.textPrimary,
	},
	progressCount: {
		fontSize: 13,
		fontFamily: fonts.body,
		color: colors.textSecondary,
	},
	progressBarBg: {
		height: 8,
		backgroundColor: colors.gray200,
		borderRadius: radius.full,
	},
	progressBarFill: {
		height: 8,
		width: "60%",
		backgroundColor: colors.successGreen,
		borderRadius: radius.full,
	},
	buttonGroup: {
		width: "100%",
		gap: spacing.sm,
	},
});
