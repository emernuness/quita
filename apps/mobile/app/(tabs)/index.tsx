import { colors, spacing } from "@/theme/tokens";
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
					<ActivityIndicator size="large" color={colors.accentBlue} />
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
					<Text style={styles.label}>TOTAL DE DÍVIDAS</Text>
					<Text style={styles.mainAmount}>{formatBRL(data?.totalDebt ?? 0)}</Text>
					<Text style={styles.mainSubtext}>
						{overdueCount} contas em atraso · {data?.debtsCount ?? 0} no total
					</Text>
				</View>

				{/* Saldo do Mês */}
				<Text style={styles.label}>SALDO DO MÊS</Text>
				<View style={styles.balanceRow}>
					<View style={[styles.balanceCard, { flex: 1 }]}>
						<Text style={styles.label}>ENTRA</Text>
						<Text style={styles.balanceAmountGreen}>{formatBRLCompact(data?.totalIncome ?? 0)}</Text>
					</View>
					<View style={{ width: 12 }} />
					<View style={[styles.balanceCard, { flex: 1 }]}>
						<Text style={styles.label}>SAI EM FIXAS</Text>
						<Text style={styles.balanceAmountRed}>{formatBRLCompact(data?.totalExpenses ?? 0)}</Text>
					</View>
				</View>

				{/* Green Highlight Card */}
				<View style={styles.greenCard}>
					<Text style={styles.greenLabel}>SOBRA PRA DÍVIDAS</Text>
					<Text style={styles.greenAmount}>{formatBRLCompact(data?.surplusForDebts ?? 0)}</Text>
				</View>

				{/* Action Card */}
				{data?.debts && data.debts.length > 0 && data.debts[0].status !== "paid" ? (
					<View style={styles.actionCard}>
						<View style={styles.actionHeader}>
							<Text style={styles.actionLabel}>
								PRÓXIMA AÇÃO RECOMENDADA
							</Text>
							<View style={styles.impactBadge}>
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
									ver detalhes
								</Text>
							</Pressable>
						</View>
					</View>
				) : null}

				{/* Progress Section */}
				<View style={styles.progressSection}>
					<Text style={styles.label}>PROGRESSO</Text>
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
		paddingHorizontal: spacing.lg,
		paddingTop: spacing.md,
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-start",
		marginBottom: spacing.lg,
	},
	greeting: {
		fontSize: 28,
		fontWeight: "800",
		color: colors.textPrimary,
	},
	subtitle: {
		fontSize: 15,
		color: colors.textSecondary,
		marginTop: 4,
	},
	bellButton: {
		width: 44,
		height: 44,
		borderRadius: 22,
		backgroundColor: colors.surface,
		borderWidth: 1,
		borderColor: colors.border,
		alignItems: "center",
		justifyContent: "center",
	},
	mainCard: {
		backgroundColor: colors.surface,
		borderWidth: 2,
		borderColor: colors.borderStrong,
		borderRadius: 12,
		padding: 20,
		marginBottom: spacing.md,
	},
	label: {
		fontSize: 11,
		fontWeight: "600",
		letterSpacing: 3,
		color: colors.textSecondary,
		textTransform: "uppercase",
		marginBottom: 8,
	},
	mainAmount: {
		fontSize: 44,
		fontWeight: "800",
		color: colors.dangerRed,
		letterSpacing: -2,
	},
	mainSubtext: {
		fontSize: 13,
		color: colors.textTertiary,
		marginTop: 8,
	},
	balanceRow: {
		flexDirection: "row",
		marginBottom: spacing.md,
	},
	balanceCard: {
		backgroundColor: colors.surface,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: 12,
		padding: 16,
	},
	balanceAmountGreen: {
		fontSize: 24,
		fontWeight: "800",
		color: colors.successGreen,
	},
	balanceAmountRed: {
		fontSize: 24,
		fontWeight: "800",
		color: colors.dangerRed,
	},
	greenCard: {
		backgroundColor: colors.successGreen,
		borderRadius: 12,
		padding: 20,
		marginBottom: spacing.md,
	},
	greenLabel: {
		fontSize: 11,
		fontWeight: "600",
		letterSpacing: 3,
		color: "rgba(255,255,255,0.7)",
		textTransform: "uppercase",
		marginBottom: 8,
	},
	greenAmount: {
		fontSize: 32,
		fontWeight: "800",
		color: "#FFFFFF",
	},
	actionCard: {
		backgroundColor: colors.accentBlue,
		borderRadius: 12,
		padding: 20,
		marginBottom: spacing.md,
	},
	actionHeader: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		marginBottom: 12,
	},
	actionLabel: {
		fontSize: 11,
		fontWeight: "600",
		letterSpacing: 3,
		color: "rgba(255,255,255,0.7)",
		textTransform: "uppercase",
	},
	impactBadge: {
		backgroundColor: colors.warningOrange,
		borderRadius: 100,
		paddingHorizontal: 8,
		paddingVertical: 3,
	},
	impactBadgeText: {
		fontSize: 11,
		fontWeight: "700",
		color: "#FFFFFF",
	},
	actionTitle: {
		fontSize: 18,
		fontWeight: "700",
		color: "#FFFFFF",
		marginBottom: 8,
		lineHeight: 24,
	},
	actionDescription: {
		fontSize: 14,
		color: "rgba(255,255,255,0.8)",
		lineHeight: 20,
		marginBottom: 16,
	},
	actionButtons: {
		flexDirection: "row",
		gap: 12,
	},
	actionBtnPrimary: {
		backgroundColor: "#FFFFFF",
		borderRadius: 100,
		paddingHorizontal: 16,
		paddingVertical: 10,
	},
	actionBtnPrimaryText: {
		fontSize: 13,
		fontWeight: "700",
		color: colors.accentBlue,
	},
	actionBtnSecondary: {
		backgroundColor: "rgba(255,255,255,0.2)",
		borderRadius: 100,
		paddingHorizontal: 16,
		paddingVertical: 10,
	},
	actionBtnSecondaryText: {
		fontSize: 13,
		fontWeight: "600",
		color: "#FFFFFF",
	},
	progressSection: {
		marginBottom: spacing.md,
	},
	progressBarBg: {
		height: 14,
		backgroundColor: colors.border,
		borderRadius: 7,
		marginBottom: 8,
	},
	progressBarFill: {
		height: 14,
		backgroundColor: colors.successGreen,
		borderRadius: 4,
	},
	progressText: {
		fontSize: 13,
		color: colors.textTertiary,
	},
});
