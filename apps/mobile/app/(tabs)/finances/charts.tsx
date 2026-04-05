import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { colors, spacing } from "@/theme/tokens";

const CATEGORIES = [
	{ name: "Moradia", color: "#FF6600", percent: 37, amount: "R$ 950" },
	{ name: "Alimentação", color: "#88CC00", percent: 22, amount: "R$ 600" },
	{ name: "Contas", color: "#0A0A0A", percent: 13, amount: "R$ 280" },
];

const MONTHS = [
	{ label: "Jun", bars: [{ height: 60, color: "#0066FF" }, { height: 40, color: "#FF6600" }] },
	{ label: "Jul", bars: [{ height: 50, color: "#0066FF" }, { height: 55, color: "#FF6600" }] },
	{ label: "Ago", bars: [{ height: 70, color: "#0066FF" }, { height: 35, color: "#FF6600" }] },
	{ label: "Set", bars: [{ height: 45, color: "#0066FF" }, { height: 30, color: "#FF6600" }] },
];

export default function ChartsScreen() {
	const router = useRouter();

	return (
		<SafeAreaView style={styles.safe} edges={["top"]}>
			<ScrollView
				style={styles.scroll}
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
			>
				{/* Back Button */}
				<Pressable
					style={styles.backButton}
					onPress={() => router.back()}
				>
					<Feather name="arrow-left" size={16} color={colors.textPrimary} />
					<Text style={styles.backText}>VOLTAR</Text>
				</Pressable>

				{/* Title */}
				<Text style={styles.title}>Gráficos e relatórios</Text>
				<Text style={styles.subtitle}>
					Entenda seus padrões de gasto e progresso
				</Text>

				{/* Despesas por categoria */}
				<View style={styles.card}>
					<Text style={styles.cardTitle}>Despesas por categoria</Text>
					<Text style={styles.cardSubtitle}>Novembro 2024</Text>

					<View style={styles.barsContainer}>
						{CATEGORIES.map((cat) => (
							<View key={cat.name} style={styles.barRow}>
								<View style={styles.barLabelRow}>
									<Text style={styles.barLabel}>{cat.name}</Text>
									<Text style={styles.barAmount}>{cat.amount}</Text>
								</View>
								<View style={styles.barTrack}>
									<View
										style={[
											styles.barFill,
											{
												backgroundColor: cat.color,
												width: `${cat.percent}%`,
											},
										]}
									/>
								</View>
								<Text style={styles.barPercent}>{cat.percent}%</Text>
							</View>
						))}
					</View>
				</View>

				{/* Evolução das dívidas */}
				<View style={styles.card}>
					<Text style={styles.cardTitle}>Evolução das dívidas</Text>

					<View style={styles.chartContainer}>
						{MONTHS.map((month) => (
							<View key={month.label} style={styles.chartColumn}>
								<View style={styles.chartBars}>
									{month.bars.map((bar, i) => (
										<View
											key={`${month.label}-${i}`}
											style={[
												styles.chartBar,
												{
													height: bar.height,
													backgroundColor: bar.color,
												},
											]}
										/>
									))}
								</View>
								<Text style={styles.chartLabel}>{month.label}</Text>
							</View>
						))}
					</View>
				</View>

				{/* Comparativo mensal */}
				<View style={styles.card}>
					<Text style={styles.cardTitle}>Comparativo mensal</Text>
					<Text style={styles.cardSubtitle}>Out → Nov</Text>

					<View style={styles.comparativeRow}>
						<View style={styles.comparativeItem}>
							<Text style={styles.comparativeLabel}>Despesas</Text>
							<Text style={styles.comparativeValueGreen}>↘ -12%</Text>
						</View>
						<View style={styles.comparativeDivider} />
						<View style={styles.comparativeItem}>
							<Text style={styles.comparativeLabel}>Dívida total</Text>
							<Text style={styles.comparativeValueGreen}>↗ R$ 1.230</Text>
						</View>
					</View>
				</View>

				<View style={{ height: 120 }} />
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
		paddingTop: spacing.md,
	},
	backButton: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.xs,
		marginBottom: spacing.lg,
	},
	backText: {
		fontSize: 11,
		fontWeight: "600",
		letterSpacing: 3,
		color: colors.textPrimary,
		textTransform: "uppercase",
	},
	title: {
		fontSize: 32,
		fontWeight: "800",
		fontStyle: "italic",
		color: colors.textPrimary,
		marginBottom: spacing.sm,
	},
	subtitle: {
		fontSize: 14,
		fontWeight: "500",
		color: colors.textSecondary,
		marginBottom: spacing.xl,
	},
	card: {
		backgroundColor: colors.surface,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: 12,
		padding: spacing.md,
		marginBottom: spacing.md,
	},
	cardTitle: {
		fontSize: 16,
		fontWeight: "700",
		color: colors.textPrimary,
		marginBottom: spacing.xs,
	},
	cardSubtitle: {
		fontSize: 13,
		fontWeight: "500",
		color: colors.textSecondary,
		marginBottom: spacing.md,
	},
	barsContainer: {
		gap: spacing.md,
	},
	barRow: {
		gap: spacing.xs,
	},
	barLabelRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	barLabel: {
		fontSize: 14,
		fontWeight: "600",
		color: colors.textPrimary,
	},
	barAmount: {
		fontSize: 14,
		fontWeight: "700",
		color: colors.textPrimary,
	},
	barTrack: {
		height: 8,
		backgroundColor: "#F0F0F0",
		borderRadius: 4,
	},
	barFill: {
		height: 8,
		borderRadius: 4,
	},
	barPercent: {
		fontSize: 12,
		fontWeight: "500",
		color: colors.textSecondary,
	},
	chartContainer: {
		flexDirection: "row",
		justifyContent: "space-around",
		alignItems: "flex-end",
		height: 100,
		marginTop: spacing.md,
	},
	chartColumn: {
		alignItems: "center",
		gap: spacing.sm,
	},
	chartBars: {
		flexDirection: "row",
		alignItems: "flex-end",
		gap: 4,
	},
	chartBar: {
		width: 20,
		borderRadius: 4,
	},
	chartLabel: {
		fontSize: 12,
		fontWeight: "500",
		color: colors.textSecondary,
	},
	comparativeRow: {
		flexDirection: "row",
		alignItems: "center",
	},
	comparativeItem: {
		flex: 1,
		alignItems: "center",
		gap: spacing.xs,
	},
	comparativeDivider: {
		width: 1,
		height: 40,
		backgroundColor: colors.border,
	},
	comparativeLabel: {
		fontSize: 13,
		fontWeight: "500",
		color: colors.textSecondary,
	},
	comparativeValueGreen: {
		fontSize: 16,
		fontWeight: "800",
		color: colors.successGreen,
	},
});
