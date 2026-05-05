import { colors, fonts, radius, spacing } from "@/theme/tokens";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CATEGORIES = [
	{ name: "Moradia", color: colors.brandTealDark, percent: 37, amount: "R$ 950" },
	{ name: "Alimentação", color: colors.accentGreen, percent: 22, amount: "R$ 600" },
	{ name: "Contas", color: colors.brandTealMid, percent: 13, amount: "R$ 280" },
];

const MONTHS = [
	{
		label: "Jun",
		bars: [
			{ height: 60, color: colors.brandTealDark },
			{ height: 40, color: colors.accentGreenLight },
		],
	},
	{
		label: "Jul",
		bars: [
			{ height: 50, color: colors.brandTealDark },
			{ height: 55, color: colors.accentGreenLight },
		],
	},
	{
		label: "Ago",
		bars: [
			{ height: 70, color: colors.brandTealDark },
			{ height: 35, color: colors.accentGreenLight },
		],
	},
	{
		label: "Set",
		bars: [
			{ height: 45, color: colors.brandTealDark },
			{ height: 30, color: colors.accentGreenLight },
		],
	},
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
					<Text style={styles.backText}>Voltar</Text>
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
		paddingHorizontal: spacing.xl,
		paddingTop: spacing.md,
	},
	backButton: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.xs + 2,
		marginBottom: spacing.lg,
	},
	backText: {
		fontFamily: fonts.bodySemiBold,
		fontSize: 13,
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
		fontSize: 14,
		color: colors.textSecondary,
		marginBottom: spacing.xl,
	},
	card: {
		backgroundColor: colors.surface,
		borderWidth: 0.5,
		borderColor: colors.border,
		borderRadius: radius.card,
		padding: spacing.lg,
		marginBottom: spacing.md,
	},
	cardTitle: {
		fontFamily: fonts.bodySemiBold,
		fontSize: 16,
		color: colors.textPrimary,
		marginBottom: spacing.xs,
	},
	cardSubtitle: {
		fontFamily: fonts.bodyMedium,
		fontSize: 13,
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
		fontFamily: fonts.bodySemiBold,
		fontSize: 14,
		color: colors.textPrimary,
	},
	barAmount: {
		fontFamily: fonts.bodySemiBold,
		fontSize: 14,
		color: colors.textPrimary,
	},
	barTrack: {
		height: 8,
		backgroundColor: colors.gray200,
		borderRadius: radius.input,
	},
	barFill: {
		height: 8,
		borderRadius: radius.input,
	},
	barPercent: {
		fontFamily: fonts.bodyMedium,
		fontSize: 12,
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
		gap: spacing.xs,
	},
	chartBar: {
		width: 20,
		borderRadius: radius.input,
	},
	chartLabel: {
		fontFamily: fonts.bodyMedium,
		fontSize: 12,
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
		width: 0.5,
		height: 40,
		backgroundColor: colors.border,
	},
	comparativeLabel: {
		fontFamily: fonts.bodyMedium,
		fontSize: 13,
		color: colors.textSecondary,
	},
	comparativeValueGreen: {
		fontFamily: fonts.heading,
		fontSize: 16,
		color: colors.successGreen,
	},
});
