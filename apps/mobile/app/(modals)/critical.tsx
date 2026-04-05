import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { colors, spacing } from "@/theme/tokens";

const SUMMARY_ROWS = [
	{ label: "Renda mensal", value: "R$ 2.800", color: colors.textPrimary },
	{ label: "Despesas fixas", value: "R$ 2.950", color: colors.textPrimary },
	{ label: "Sobra p/ dívidas", value: "- R$ 150", color: colors.dangerRed },
];

const AI_SUGGESTIONS = [
	"Renegociar dívidas com juros mais altos para reduzir parcelas.",
	"Identificar despesas que podem ser cortadas ou reduzidas temporariamente.",
];

export default function CriticalModal() {
	const router = useRouter();

	return (
		<SafeAreaView style={styles.safe}>
			<ScrollView
				style={styles.scroll}
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
			>
				{/* Warning Icon */}
				<View style={styles.iconContainer}>
					<Feather
						name="alert-triangle"
						size={48}
						color={colors.dangerRed}
					/>
				</View>

				{/* Title */}
				<Text style={styles.title}>Situação crítica</Text>

				{/* Subtitle */}
				<Text style={styles.subtitle}>
					Suas despesas são iguais ou maiores que sua renda. Não sobra dinheiro
					para pagar dívidas.
				</Text>

				{/* Summary Table */}
				<View style={styles.table}>
					{SUMMARY_ROWS.map((row, index) => (
						<View
							key={row.label}
							style={[
								styles.tableRow,
								index < SUMMARY_ROWS.length - 1 && styles.tableRowBorder,
							]}
						>
							<Text style={styles.tableLabel}>{row.label}</Text>
							<Text style={[styles.tableValue, { color: row.color }]}>
								{row.value}
							</Text>
						</View>
					))}
				</View>

				{/* AI Suggestion Card */}
				<View style={styles.aiCard}>
					<View style={styles.aiHeader}>
						<Feather name="cpu" size={16} color={colors.accentBlue} />
						<Text style={styles.aiTitle}>SUGESTÃO DA IA</Text>
					</View>
					<Text style={styles.aiText}>
						Com base nos seus dados, criamos um plano para equilibrar suas
						finanças:
					</Text>
					{AI_SUGGESTIONS.map((suggestion, index) => (
						<View key={index} style={styles.aiBulletRow}>
							<View style={styles.aiBullet} />
							<Text style={styles.aiBulletText}>{suggestion}</Text>
						</View>
					))}
				</View>

				{/* Buttons */}
				<Pressable
					style={({ pressed }) => [
						styles.primaryButton,
						pressed && styles.buttonPressed,
					]}
					onPress={() => router.back()}
				>
					<Text style={styles.primaryButtonText}>
						REVISAR MINHAS DESPESAS
					</Text>
				</Pressable>

				<Pressable
					style={({ pressed }) => [
						styles.secondaryButton,
						pressed && styles.buttonPressed,
					]}
					onPress={() => router.back()}
				>
					<Text style={styles.secondaryButtonText}>FALAR COM SUPORTE</Text>
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
		color: colors.dangerRed,
		textAlign: "center",
		marginBottom: spacing.sm,
	},
	subtitle: {
		fontSize: 14,
		fontWeight: "500",
		color: colors.textSecondary,
		textAlign: "center",
		lineHeight: 22,
		marginBottom: spacing.xl,
	},
	table: {
		backgroundColor: colors.surface,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: 12,
		width: "100%",
		marginBottom: spacing.lg,
		overflow: "hidden",
	},
	tableRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: spacing.md,
		paddingVertical: 14,
	},
	tableRowBorder: {
		borderBottomWidth: 1,
		borderBottomColor: colors.border,
	},
	tableLabel: {
		fontSize: 14,
		fontWeight: "500",
		color: colors.textSecondary,
	},
	tableValue: {
		fontSize: 16,
		fontWeight: "800",
	},
	aiCard: {
		backgroundColor: "#EBF2FF",
		borderWidth: 1,
		borderColor: colors.accentBlue,
		borderRadius: 12,
		padding: spacing.md,
		width: "100%",
		marginBottom: spacing.xl,
	},
	aiHeader: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.sm,
		marginBottom: spacing.sm,
	},
	aiTitle: {
		fontSize: 11,
		fontWeight: "700",
		letterSpacing: 2,
		color: colors.accentBlue,
		textTransform: "uppercase",
	},
	aiText: {
		fontSize: 13,
		fontWeight: "500",
		color: colors.textTertiary,
		lineHeight: 20,
		marginBottom: spacing.md,
	},
	aiBulletRow: {
		flexDirection: "row",
		gap: spacing.sm,
		marginBottom: spacing.sm,
	},
	aiBullet: {
		width: 6,
		height: 6,
		borderRadius: 3,
		backgroundColor: colors.warningOrange,
		marginTop: 6,
	},
	aiBulletText: {
		flex: 1,
		fontSize: 13,
		fontWeight: "500",
		color: colors.textTertiary,
		lineHeight: 20,
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
