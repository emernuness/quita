import { badges, colors, fonts, radius, spacing } from "@/theme/tokens";
import { Feather } from "@expo/vector-icons";
import { formatBRL, formatBRLCompact } from "@quita/shared";
import { useRouter } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDashboard } from "../../src/hooks/useDashboard";
import { useAuthStore } from "../../src/stores/auth";

export default function HomeScreen() {
	const router = useRouter();
	const { data, isLoading } = useDashboard();
	const user = useAuthStore((s) => s.user);

	const firstName = user?.name?.split(" ")[0] ?? "Você";
	const overdueCount = (data?.debtsCount ?? 0) - (data?.paidDebtsCount ?? 0);

	if (isLoading) {
		return (
			<SafeAreaView style={styles.safe} edges={["top"]}>
				<View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
					<ActivityIndicator size="large" color={colors.brandTealDark} />
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={styles.safe} edges={["top"]}>
			<ScrollView
				style={styles.scroll}
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
			>
				{/* Header */}
				<View style={styles.header}>
					<View>
						<Text style={styles.greeting}>Oi, {firstName}!</Text>
						<Text style={styles.subtitle}>
							Vamos quitar mais uma?
						</Text>
					</View>
					<Pressable
						style={styles.bellButton}
						onPress={() => router.push("/(tabs)/profile/notifications")}
					>
						<Feather
							name="bell"
							size={24}
							color={colors.textPrimary}
						/>
					</Pressable>
				</View>

				{/* Main Metric Card */}
				<View style={styles.mainCard}>
					<Text style={styles.label}>Total de dívidas</Text>
					<Text style={styles.mainAmount}>{formatBRL(data?.totalDebt ?? 0)}</Text>
					<Text style={styles.mainSubtext}>
						{overdueCount} contas em atraso · {data?.debtsCount ?? 0} no total
					</Text>
				</View>

				{/* Saldo do Mês */}
				<Text style={styles.label}>Saldo do mês</Text>
				<View style={styles.balanceRow}>
					<View style={[styles.balanceCard, { flex: 1 }]}>
						<Text style={styles.label}>Entra</Text>
						<Text style={styles.balanceAmountGreen}>{formatBRLCompact(data?.totalIncome ?? 0)}</Text>
					</View>
					<View style={{ width: spacing.md }} />
					<View style={[styles.balanceCard, { flex: 1 }]}>
						<Text style={styles.label}>Sai em fixas</Text>
						<Text style={styles.balanceAmountRed}>{formatBRLCompact(data?.totalExpenses ?? 0)}</Text>
					</View>
				</View>

				{/* Highlight Card — Sobra pra dívidas */}
				<View style={styles.greenCard}>
					<Text style={styles.greenLabel}>Sobra pra dívidas</Text>
					<Text style={styles.greenAmount}>{formatBRLCompact(data?.surplusForDebts ?? 0)}</Text>
				</View>

				{/* Action Card */}
				{data?.debts && data.debts.length > 0 && data.debts[0].status !== "paid" ? (
					<View style={styles.actionCard}>
						<View style={styles.actionHeader}>
							<Text style={styles.actionLabel}>
								Próxima ação recomendada
							</Text>
							<View style={styles.impactBadge}>
								<View style={styles.impactBadgeDot} />
								<Text style={styles.impactBadgeText}>
									Prioridade
								</Text>
							</View>
						</View>
						<Text style={styles.actionTitle}>
							Pagar {formatBRL(data.debts[0].totalAmount - data.debts[0].amountPaid)} para {data.debts[0].creditor}
						</Text>
						<Text style={styles.actionDescription}>
							{data.debts[0].category?.name ?? "Dívida"} · Comece pela menor dívida para ganhar fôlego.
						</Text>
						<View style={styles.actionButtons}>
							<Pressable
								style={styles.actionBtnPrimary}
								onPress={() => router.push(`/(tabs)/debts/${data.debts[0].id}` as any)}
							>
								<Text style={styles.actionBtnPrimaryText}>
									Ver detalhes
								</Text>
							</Pressable>
						</View>
					</View>
				) : null}

				{/* Progress Section */}
				<View style={styles.progressSection}>
					<Text style={styles.label}>Progresso</Text>
					<View style={styles.progressBarBg}>
						<View style={[styles.progressBarFill, { width: `${data?.progressPercent ?? 0}%` }]} />
					</View>
					<Text style={styles.progressText}>
						{data?.paidDebtsCount ?? 0} de {data?.debtsCount ?? 0} dívidas quitadas
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
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-start",
		marginBottom: spacing.lg,
	},
	greeting: {
		fontFamily: fonts.heading,
		fontSize: 28,
		color: colors.textPrimary,
	},
	subtitle: {
		fontFamily: fonts.body,
		fontSize: 15,
		color: colors.textSecondary,
		marginTop: spacing.xs,
	},
	bellButton: {
		width: 44,
		height: 44,
		borderRadius: radius.full,
		backgroundColor: colors.surface,
		borderWidth: 0.5,
		borderColor: colors.border,
		alignItems: "center",
		justifyContent: "center",
	},
	mainCard: {
		backgroundColor: colors.surface,
		borderWidth: 0.5,
		borderColor: colors.border,
		borderRadius: radius.card,
		padding: spacing.xl,
		marginBottom: spacing.md,
	},
	label: {
		fontFamily: fonts.bodyMedium,
		fontSize: 13,
		color: colors.textSecondary,
		marginBottom: spacing.sm,
	},
	mainAmount: {
		fontFamily: fonts.heading,
		fontSize: 40,
		color: colors.brandTealDark,
	},
	mainSubtext: {
		fontFamily: fonts.body,
		fontSize: 13,
		color: colors.textTertiary,
		marginTop: spacing.sm,
	},
	balanceRow: {
		flexDirection: "row",
		marginBottom: spacing.md,
	},
	balanceCard: {
		backgroundColor: colors.surface,
		borderWidth: 0.5,
		borderColor: colors.border,
		borderRadius: radius.card,
		padding: spacing.lg,
	},
	balanceAmountGreen: {
		fontFamily: fonts.heading,
		fontSize: 24,
		color: colors.successGreen,
	},
	balanceAmountRed: {
		fontFamily: fonts.heading,
		fontSize: 24,
		color: colors.dangerRed,
	},
	greenCard: {
		backgroundColor: colors.brandTealDark,
		borderRadius: radius.card,
		padding: spacing.xl,
		marginBottom: spacing.md,
	},
	greenLabel: {
		fontFamily: fonts.bodyMedium,
		fontSize: 13,
		color: colors.white,
		opacity: 0.8,
		marginBottom: spacing.sm,
	},
	greenAmount: {
		fontFamily: fonts.heading,
		fontSize: 32,
		color: colors.white,
	},
	actionCard: {
		backgroundColor: colors.brandTealDark,
		borderRadius: radius.card,
		padding: spacing.xl,
		marginBottom: spacing.md,
	},
	actionHeader: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.sm,
		marginBottom: spacing.md,
	},
	actionLabel: {
		fontFamily: fonts.bodyMedium,
		fontSize: 12,
		color: colors.white,
		opacity: 0.8,
	},
	impactBadge: {
		backgroundColor: badges.warning.background,
		borderRadius: radius.pill,
		paddingHorizontal: spacing.sm,
		paddingVertical: 3,
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.xs,
	},
	impactBadgeDot: {
		width: 6,
		height: 6,
		borderRadius: 3,
		backgroundColor: badges.warning.dot,
	},
	impactBadgeText: {
		fontFamily: fonts.bodySemiBold,
		fontSize: 11,
		color: badges.warning.color,
	},
	actionTitle: {
		fontFamily: fonts.heading,
		fontSize: 18,
		color: colors.white,
		marginBottom: spacing.sm,
		lineHeight: 24,
	},
	actionDescription: {
		fontFamily: fonts.body,
		fontSize: 14,
		color: colors.white,
		opacity: 0.85,
		lineHeight: 20,
		marginBottom: spacing.lg,
	},
	actionButtons: {
		flexDirection: "row",
		gap: spacing.md,
	},
	actionBtnPrimary: {
		backgroundColor: colors.white,
		borderRadius: radius.sm,
		paddingHorizontal: spacing.lg,
		paddingVertical: spacing.sm + 2,
	},
	actionBtnPrimaryText: {
		fontFamily: fonts.bodySemiBold,
		fontSize: 13,
		color: colors.brandTealDark,
	},
	progressSection: {
		marginBottom: spacing.md,
	},
	progressBarBg: {
		height: 10,
		backgroundColor: colors.gray200,
		borderRadius: radius.pill,
		marginBottom: spacing.sm,
		overflow: "hidden",
	},
	progressBarFill: {
		height: 10,
		backgroundColor: colors.successGreen,
		borderRadius: radius.pill,
	},
	progressText: {
		fontFamily: fonts.body,
		fontSize: 13,
		color: colors.textTertiary,
	},
});
