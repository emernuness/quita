import { colors, spacing } from "@/theme/tokens";
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
				<Text style={styles.title}>Meu Plano</Text>
				<Text style={styles.subtitle}>
					Gerado com base nos seus dados.
				</Text>

				{/* Hero Card */}
				<View style={styles.heroCard}>
					<View style={styles.heroRow}>
						<View style={styles.heroCol}>
							<Text style={styles.heroLabel}>
								LIVRE DAS DÍVIDAS EM
							</Text>
							<Text style={styles.heroBigText}>8 meses</Text>
						</View>
						<View style={styles.heroCol}>
							<Text style={styles.heroLabel}>
								ECONOMIA EM JUROS
							</Text>
							<Text style={styles.heroGreenText}>
								R$ 1.230
							</Text>
						</View>
					</View>
					<View style={styles.strategyPill}>
						<Text style={styles.strategyText}>
							🏔 Estratégia: Começar pelo menor
						</Text>
					</View>
				</View>

				{/* Timeline Section */}
				<Text style={styles.sectionLabel}>LINHA DO TEMPO</Text>

				<View style={styles.timeline}>
					{TIMELINE.map((item, index) => (
						<View key={item.period} style={styles.timelineItem}>
							{/* Dot and Line */}
							<View style={styles.timelineLeft}>
								<View
									style={[
										styles.dot,
										item.isCurrent && styles.dotCurrent,
										item.isCompleted &&
											styles.dotCompleted,
									]}
								/>
								{index < TIMELINE.length - 1 && (
									<View style={styles.line} />
								)}
							</View>
							{/* Content */}
							<View style={styles.timelineContent}>
								<Text style={styles.timelinePeriod}>
									{item.period}
								</Text>
								<Text style={styles.timelineDescription}>
									{item.description}
								</Text>
							</View>
						</View>
					))}
				</View>

				{/* AI Explanation Card */}
				<View style={styles.aiCard}>
					<Text style={styles.aiCardTitle}>
						💡 Como o plano foi montado
					</Text>
					<Text style={styles.aiCardText}>
						Consideramos renda líquida, despesas fixas e urgência de vencimento. Se algum valor estiver incompleto, a previsão pode mudar.
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
		paddingHorizontal: spacing.lg,
		paddingTop: spacing.md,
	},
	title: {
		fontSize: 32,
		fontWeight: "800",
		fontStyle: "italic",
		color: colors.textPrimary,
		marginBottom: 4,
	},
	subtitle: {
		fontSize: 15,
		color: colors.textSecondary,
		marginBottom: spacing.lg,
	},
	heroCard: {
		backgroundColor: colors.textPrimary,
		borderRadius: 12,
		padding: 20,
		marginBottom: spacing.xl,
	},
	heroRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 16,
	},
	heroCol: {
		flex: 1,
	},
	heroLabel: {
		fontSize: 11,
		fontWeight: "600",
		letterSpacing: 3,
		color: "rgba(255,255,255,0.5)",
		textTransform: "uppercase",
		marginBottom: 8,
	},
	heroBigText: {
		fontSize: 28,
		fontWeight: "800",
		color: "#FFFFFF",
	},
	heroGreenText: {
		fontSize: 28,
		fontWeight: "800",
		color: colors.successGreen,
	},
	strategyPill: {
		backgroundColor: "rgba(0,170,85,0.15)",
		borderRadius: 100,
		paddingHorizontal: 14,
		paddingVertical: 8,
		alignSelf: "flex-start",
	},
	strategyText: {
		fontSize: 13,
		fontWeight: "600",
		color: colors.successGreen,
	},
	sectionLabel: {
		fontSize: 11,
		fontWeight: "600",
		letterSpacing: 3,
		color: colors.textSecondary,
		textTransform: "uppercase",
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
		marginTop: 4,
	},
	dotCurrent: {
		backgroundColor: colors.accentBlue,
		width: 14,
		height: 14,
		borderRadius: 7,
	},
	dotCompleted: {
		backgroundColor: colors.successGreen,
	},
	line: {
		width: 2,
		flex: 1,
		backgroundColor: colors.border,
		marginVertical: 4,
	},
	timelineContent: {
		flex: 1,
		paddingLeft: 12,
		paddingBottom: 24,
	},
	timelinePeriod: {
		fontSize: 13,
		fontWeight: "700",
		color: colors.textSecondary,
		marginBottom: 4,
	},
	timelineDescription: {
		fontSize: 16,
		fontWeight: "600",
		color: colors.textPrimary,
		lineHeight: 22,
	},
	aiCard: {
		backgroundColor: colors.surface,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: colors.border,
		padding: 20,
		marginBottom: spacing.md,
	},
	aiCardTitle: {
		fontSize: 15,
		fontWeight: "700",
		color: colors.textPrimary,
		marginBottom: 8,
	},
	aiCardText: {
		fontSize: 14,
		color: colors.textTertiary,
		lineHeight: 22,
	},
});
