import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { colors, spacing } from "@/theme/tokens";

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
				{/* Party Icon */}
				<View style={styles.iconContainer}>
					<Feather name="award" size={48} color={colors.successGreen} />
				</View>

				{/* Title */}
				<Text style={styles.title}>Parabéns!</Text>

				{/* Subtitle */}
				<Text style={styles.subtitle}>Você quitou uma dívida!</Text>

				{/* Description */}
				<Text style={styles.description}>
					Cada dívida quitada é um passo importante na sua jornada financeira.
					Continue assim!
				</Text>

				{/* Debt Card */}
				<View style={styles.debtCard}>
					<View style={styles.debtHeader}>
						<Text style={styles.debtName}>Cartão Nubank</Text>
						<View style={styles.badge}>
							<Text style={styles.badgeText}>QUITADA</Text>
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

				{/* Progress Section */}
				<View style={styles.progressSection}>
					<View style={styles.progressHeader}>
						<Text style={styles.progressTitle}>Progresso geral</Text>
						<Text style={styles.progressCount}>3 de 5 dívidas</Text>
					</View>
					<View style={styles.progressBarBg}>
						<View style={styles.progressBarFill} />
					</View>
				</View>

				{/* Buttons */}
				<Pressable
					style={({ pressed }) => [
						styles.primaryButton,
						pressed && styles.buttonPressed,
					]}
					onPress={() => router.back()}
				>
					<Text style={styles.primaryButtonText}>VER MINHAS DÍVIDAS</Text>
				</Pressable>

				<Pressable
					style={({ pressed }) => [
						styles.secondaryButton,
						pressed && styles.buttonPressed,
					]}
					onPress={() => router.back()}
				>
					<Text style={styles.secondaryButtonText}>
						COMPARTILHAR CONQUISTA
					</Text>
				</Pressable>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: {
		flex: 1,
		backgroundColor: colors.background,
	},
	scroll: {
		flex: 1,
	},
	content: {
		paddingHorizontal: spacing.lg,
		paddingTop: spacing.xxl,
		paddingBottom: 40,
		alignItems: "center",
	},
	iconContainer: {
		marginBottom: spacing.lg,
	},
	title: {
		fontSize: 32,
		fontWeight: "800",
		fontStyle: "italic",
		color: colors.successGreen,
		textAlign: "center",
		marginBottom: spacing.xs,
	},
	subtitle: {
		fontSize: 18,
		fontWeight: "600",
		color: colors.textPrimary,
		textAlign: "center",
		marginBottom: spacing.md,
	},
	description: {
		fontSize: 14,
		fontWeight: "500",
		color: colors.textSecondary,
		textAlign: "center",
		lineHeight: 22,
		marginBottom: spacing.xl,
	},
	debtCard: {
		backgroundColor: colors.surface,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: 12,
		borderLeftWidth: 4,
		borderLeftColor: colors.successGreen,
		padding: spacing.md,
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
		fontWeight: "700",
		color: colors.textPrimary,
	},
	badge: {
		backgroundColor: colors.successGreen,
		paddingHorizontal: 10,
		paddingVertical: 4,
		borderRadius: 4,
	},
	badgeText: {
		fontSize: 10,
		fontWeight: "700",
		letterSpacing: 2,
		color: "#FFFFFF",
		textTransform: "uppercase",
	},
	detailRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingVertical: 8,
		borderTopWidth: 1,
		borderTopColor: colors.border,
	},
	detailLabel: {
		fontSize: 13,
		fontWeight: "500",
		color: colors.textSecondary,
	},
	detailValue: {
		fontSize: 14,
		fontWeight: "700",
		color: colors.textPrimary,
	},
	detailValueGreen: {
		fontSize: 14,
		fontWeight: "700",
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
		fontWeight: "600",
		color: colors.textPrimary,
	},
	progressCount: {
		fontSize: 13,
		fontWeight: "500",
		color: colors.textSecondary,
	},
	progressBarBg: {
		height: 8,
		backgroundColor: "#E5E5E5",
		borderRadius: 4,
	},
	progressBarFill: {
		height: 8,
		width: "60%",
		backgroundColor: colors.successGreen,
		borderRadius: 4,
	},
	primaryButton: {
		backgroundColor: colors.textPrimary,
		height: 52,
		justifyContent: "center",
		alignItems: "center",
		width: "100%",
		marginBottom: spacing.sm,
	},
	primaryButtonText: {
		color: colors.surface,
		fontSize: 11,
		fontWeight: "600",
		letterSpacing: 2,
		textTransform: "uppercase",
	},
	secondaryButton: {
		backgroundColor: colors.surface,
		height: 52,
		justifyContent: "center",
		alignItems: "center",
		width: "100%",
		borderWidth: 2,
		borderColor: colors.borderStrong,
	},
	secondaryButtonText: {
		color: colors.textPrimary,
		fontSize: 11,
		fontWeight: "600",
		letterSpacing: 2,
		textTransform: "uppercase",
	},
	buttonPressed: {
		opacity: 0.85,
	},
});
