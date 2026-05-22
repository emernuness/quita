import { badges, colors, fonts, radius, spacing } from "@/theme/tokens";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface TimelineItem {
	period: string;
	description: string;
	isCompleted: boolean;
	isCurrent: boolean;
}

const TIMELINE: TimelineItem[] = [
	{
		period: "Abril 2025",
		description: "Quitar Magazine Luiza — R$ 450",
		isCompleted: false,
		isCurrent: true,
	},
	{
		period: "Mai–Jun 2025",
		description: "Pagar Minha mãe — R$ 1.000",
		isCompleted: false,
		isCurrent: false,
	},
	{
		period: "Jul–Out 2025",
		description: "Pagar Nubank — R$ 3.200",
		isCompleted: false,
		isCurrent: false,
	},
	{
		period: "Nov 2025–Fev 2026",
		description: "Pagar Banco Inter — R$ 5.800",
		isCompleted: false,
		isCurrent: false,
	},
];

export default function PlanScreen() {
	return (
		<SafeAreaView style={styles.safe} edges={["top"]}>
			<ScrollView
				style={styles.scroll}
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
			>
				{/* Title */}
				<Text style={styles.title}>Meu plano</Text>
				<Text style={styles.subtitle}>Gerado com base nos seus dados.</Text>

				{/* Hero Card */}
				<View style={styles.heroCard}>
					<View style={styles.heroRow}>
						<View style={styles.heroCol}>
							<Text style={styles.heroLabel}>Livre das dívidas em</Text>
							<Text style={styles.heroBigText}>8 meses</Text>
						</View>
						<View style={styles.heroCol}>
							<Text style={styles.heroLabel}>Economia em juros</Text>
							<Text style={styles.heroGreenText}>R$ 1.230</Text>
						</View>
					</View>
					<View style={styles.strategyPill}>
						<View style={styles.strategyDot} />
						<Text style={styles.strategyText}>Estratégia: Começar pelo menor</Text>
					</View>
				</View>

				{/* Timeline Section */}
				<Text style={styles.sectionLabel}>Linha do tempo</Text>

				<View style={styles.timeline}>
					{TIMELINE.map((item, index) => (
						<View key={item.period} style={styles.timelineItem}>
							{/* Dot and Line */}
							<View style={styles.timelineLeft}>
								<View
									style={[
										styles.dot,
										item.isCurrent && styles.dotCurrent,
										item.isCompleted && styles.dotCompleted,
									]}
								/>
								{index < TIMELINE.length - 1 && <View style={styles.line} />}
							</View>
							{/* Content */}
							<View style={styles.timelineContent}>
								<Text style={styles.timelinePeriod}>{item.period}</Text>
								<Text style={styles.timelineDescription}>{item.description}</Text>
							</View>
						</View>
					))}
				</View>

				{/* AI Explanation Card */}
				<View style={styles.aiCard}>
					<Text style={styles.aiCardTitle}>Como o plano foi montado</Text>
					<Text style={styles.aiCardText}>
						Consideramos renda líquida, despesas fixas e urgência de vencimento. Se algum valor
						estiver incompleto, a previsão pode mudar.
					</Text>
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
	title: {
		fontFamily: fonts.heading,
		fontSize: 28,
		color: colors.textPrimary,
		marginBottom: spacing.xs,
	},
	subtitle: {
		fontFamily: fonts.body,
		fontSize: 15,
		color: colors.textSecondary,
		marginBottom: spacing.lg,
	},
	heroCard: {
		backgroundColor: colors.brandTealDark,
		borderRadius: radius.card,
		padding: spacing.xl,
		marginBottom: spacing.xl,
	},
	heroRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: spacing.lg,
	},
	heroCol: {
		flex: 1,
	},
	heroLabel: {
		fontFamily: fonts.bodyMedium,
		fontSize: 12,
		color: colors.white,
		opacity: 0.75,
		marginBottom: spacing.sm,
	},
	heroBigText: {
		fontFamily: fonts.heading,
		fontSize: 28,
		color: colors.white,
	},
	heroGreenText: {
		fontFamily: fonts.heading,
		fontSize: 28,
		color: colors.accentGreenLight,
	},
	strategyPill: {
		backgroundColor: badges.success.background,
		borderRadius: radius.pill,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
		alignSelf: "flex-start",
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.xs,
	},
	strategyDot: {
		width: 6,
		height: 6,
		borderRadius: 3,
		backgroundColor: badges.success.dot,
	},
	strategyText: {
		fontFamily: fonts.bodySemiBold,
		fontSize: 13,
		color: badges.success.color,
	},
	sectionLabel: {
		fontFamily: fonts.bodyMedium,
		fontSize: 13,
		color: colors.textSecondary,
		marginBottom: spacing.md,
	},
	timeline: {
		marginBottom: spacing.xl,
	},
	timelineItem: {
		flexDirection: "row",
		minHeight: 80,
	},
	timelineLeft: {
		width: 32,
		alignItems: "center",
	},
	dot: {
		width: 12,
		height: 12,
		borderRadius: 6,
		backgroundColor: colors.border,
		marginTop: spacing.xs,
	},
	dotCurrent: {
		backgroundColor: colors.brandTealDark,
		width: 14,
		height: 14,
		borderRadius: 7,
	},
	dotCompleted: {
		backgroundColor: colors.successGreen,
	},
	line: {
		width: 1,
		flex: 1,
		backgroundColor: colors.border,
		marginVertical: spacing.xs,
	},
	timelineContent: {
		flex: 1,
		paddingLeft: spacing.md,
		paddingBottom: spacing.xl,
	},
	timelinePeriod: {
		fontFamily: fonts.bodySemiBold,
		fontSize: 13,
		color: colors.textSecondary,
		marginBottom: spacing.xs,
	},
	timelineDescription: {
		fontFamily: fonts.bodySemiBold,
		fontSize: 16,
		color: colors.textPrimary,
		lineHeight: 22,
	},
	aiCard: {
		backgroundColor: colors.surface,
		borderRadius: radius.card,
		borderWidth: 0.5,
		borderColor: colors.border,
		padding: spacing.xl,
		marginBottom: spacing.md,
	},
	aiCardTitle: {
		fontFamily: fonts.bodySemiBold,
		fontSize: 15,
		color: colors.textPrimary,
		marginBottom: spacing.sm,
	},
	aiCardText: {
		fontFamily: fonts.body,
		fontSize: 14,
		color: colors.textSecondary,
		lineHeight: 22,
	},
});
