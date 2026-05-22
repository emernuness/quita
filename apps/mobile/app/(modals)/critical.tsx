import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../../src/components";
import { colors, fonts, radius, spacing } from "../../src/theme/tokens";

const SUMMARY_ROWS = [
	{ label: "Renda mensal", value: "R$ 2.800", color: colors.textPrimary },
	{ label: "Despesas fixas", value: "R$ 2.950", color: colors.textPrimary },
	{ label: "Sobra para dívidas", value: "- R$ 150", color: colors.dangerRed },
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
				<View style={styles.iconCircle}>
					<Feather name="alert-triangle" size={36} color={colors.dangerRed} />
				</View>

				<Text style={styles.title}>Situação crítica</Text>

				<Text style={styles.subtitle}>
					Suas despesas são iguais ou maiores que sua renda. Não sobra dinheiro para pagar dívidas.
				</Text>

				<View style={styles.table}>
					{SUMMARY_ROWS.map((row, index) => (
						<View
							key={row.label}
							style={[styles.tableRow, index < SUMMARY_ROWS.length - 1 && styles.tableRowBorder]}
						>
							<Text style={styles.tableLabel}>{row.label}</Text>
							<Text style={[styles.tableValue, { color: row.color }]}>{row.value}</Text>
						</View>
					))}
				</View>

				<View style={styles.aiCard}>
					<View style={styles.aiHeader}>
						<Feather name="cpu" size={16} color={colors.brandTealDark} />
						<Text style={styles.aiTitle}>Sugestão da IA</Text>
					</View>
					<Text style={styles.aiText}>
						Com base nos seus dados, criamos um plano para equilibrar suas finanças:
					</Text>
					{AI_SUGGESTIONS.map((suggestion, index) => (
						<View key={index} style={styles.aiBulletRow}>
							<View style={styles.aiBullet} />
							<Text style={styles.aiBulletText}>{suggestion}</Text>
						</View>
					))}
				</View>

				<View style={styles.buttonGroup}>
					<Button variant="primary" label="Revisar minhas despesas" onPress={() => router.back()} />
					<Button variant="secondary" label="Falar com suporte" onPress={() => router.back()} />
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
		backgroundColor: colors.dangerBackground,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: spacing.lg,
	},
	title: {
		fontSize: 26,
		fontFamily: fonts.heading,
		color: colors.dangerRed,
		textAlign: "center",
		marginBottom: spacing.sm,
	},
	subtitle: {
		fontSize: 14,
		fontFamily: fonts.body,
		color: colors.textSecondary,
		textAlign: "center",
		lineHeight: 22,
		marginBottom: spacing.xl,
	},
	table: {
		backgroundColor: colors.surface,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: radius.card,
		width: "100%",
		marginBottom: spacing.lg,
		overflow: "hidden",
	},
	tableRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.md + 2,
	},
	tableRowBorder: {
		borderBottomWidth: 0.5,
		borderBottomColor: colors.border,
	},
	tableLabel: {
		fontSize: 14,
		fontFamily: fonts.body,
		color: colors.textSecondary,
	},
	tableValue: {
		fontSize: 16,
		fontFamily: fonts.heading,
	},
	aiCard: {
		backgroundColor: colors.infoBackground,
		borderWidth: 1,
		borderColor: colors.brandTealDark,
		borderRadius: radius.card,
		padding: spacing.lg,
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
		fontSize: 13,
		fontFamily: fonts.bodySemiBold,
		color: colors.brandTealDark,
	},
	aiText: {
		fontSize: 13,
		fontFamily: fonts.body,
		color: colors.textSecondary,
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
		borderRadius: radius.full,
		backgroundColor: colors.warningOrange,
		marginTop: 8,
	},
	aiBulletText: {
		flex: 1,
		fontSize: 13,
		fontFamily: fonts.body,
		color: colors.textSecondary,
		lineHeight: 20,
	},
	buttonGroup: {
		width: "100%",
		gap: spacing.sm,
	},
});
