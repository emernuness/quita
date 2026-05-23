import { badges, colors, fonts, radius, spacing } from "@/theme/tokens";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const DEBTS_DATA: Record<
	string,
	{
		creditor: string;
		category: string;
		totalAmount: string;
		paidAmount: string;
		hasInterest: boolean;
		dueDate: string;
		status: string;
		monthsLate: number;
		tip: string;
		tipLink: string;
	}
> = {
	"1": {
		creditor: "Nubank",
		category: "Cartão de crédito",
		totalAmount: "R$ 3.200",
		paidAmount: "R$ 0",
		hasInterest: true,
		dueDate: "15/12/2024",
		status: "Atrasada",
		monthsLate: 3,
		tip: "Essa dívida tem os maiores juros. Priorize o pagamento mínimo para evitar que ela cresça. Negocie direto pelo app do Nubank ou via Serasa.",
		tipLink: "Ver acordo no Serasa",
	},
	"2": {
		creditor: "Banco Inter",
		category: "Empréstimo pessoal",
		totalAmount: "R$ 5.800",
		paidAmount: "R$ 0",
		hasInterest: true,
		dueDate: "20/01/2025",
		status: "Atrasada",
		monthsLate: 2,
		tip: "Empréstimo pessoal com juros altos. Tente renegociar as parcelas para um valor que caiba no seu orçamento.",
		tipLink: "Ver acordo no Serasa",
	},
	"3": {
		creditor: "Magazine Luiza",
		category: "Carnê / crediário",
		totalAmount: "R$ 450",
		paidAmount: "R$ 0",
		hasInterest: false,
		dueDate: "10/02/2025",
		status: "Em dia",
		monthsLate: 0,
		tip: "Essa é a menor dívida. Quitá-la primeiro pode dar motivação para as próximas!",
		tipLink: "Ver acordo no Serasa",
	},
	"4": {
		creditor: "Minha mãe",
		category: "Informal / pessoal",
		totalAmount: "R$ 1.000",
		paidAmount: "R$ 0",
		hasInterest: false,
		dueDate: "Sem vencimento",
		status: "Sem prazo",
		monthsLate: 0,
		tip: "Dívida informal sem juros. Priorize as dívidas com juros primeiro, mas não esqueça de combinar um plano com ela.",
		tipLink: "",
	},
	"5": {
		creditor: "Casas Bahia",
		category: "Carnê / crediário",
		totalAmount: "R$ 2.000",
		paidAmount: "R$ 0",
		hasInterest: true,
		dueDate: "05/01/2025",
		status: "Atrasada",
		monthsLate: 2,
		tip: "Dívida em atraso com juros. Verifique se há opção de renegociação com desconto.",
		tipLink: "Ver acordo no Serasa",
	},
};

export default function DebtDetailScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const router = useRouter();
	const debt = DEBTS_DATA[id ?? "1"] ?? DEBTS_DATA["1"];

	const infoRows = [
		{ label: "Valor total", value: debt.totalAmount },
		{ label: "Já pago", value: debt.paidAmount },
		{
			label: "Juros/multa",
			value: debt.hasInterest ? "Sim" : "Não",
			valueColor: debt.hasInterest ? colors.brandTealDark : colors.textPrimary,
			isLink: debt.hasInterest,
		},
		{ label: "Vencimento", value: debt.dueDate },
	];

	const statusVariant: keyof typeof badges =
		debt.status === "Atrasada" ? "danger" : debt.status === "Em dia" ? "success" : "neutral";
	const statusBadge = badges[statusVariant];

	return (
		<SafeAreaView style={styles.safe} edges={["top"]}>
			<ScrollView
				style={styles.scroll}
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
			>
				{/* Back Button */}
				<Pressable style={styles.backButton} onPress={() => router.back()}>
					<Feather name="arrow-left" size={18} color={colors.textPrimary} />
					<Text style={styles.backText}>Voltar</Text>
				</Pressable>

				{/* Category */}
				<Text style={styles.category}>{debt.category}</Text>

				{/* Creditor Name */}
				<Text style={styles.creditor}>{debt.creditor}</Text>

				{/* Status pill */}
				<View style={[styles.statusPill, { backgroundColor: statusBadge.background }]}>
					<View style={[styles.statusDot, { backgroundColor: statusBadge.dot }]} />
					<Text style={[styles.statusText, { color: statusBadge.color }]}>
						{debt.status === "Atrasada"
							? `Atrasada há ${debt.monthsLate} meses`
							: debt.status === "Em dia"
								? "Em dia"
								: debt.status}
					</Text>
				</View>

				{/* Info Rows */}
				<View style={styles.infoSection}>
					{infoRows.map((row, index) => (
						<View key={row.label}>
							<View style={styles.infoRow}>
								<Text style={styles.infoLabel}>{row.label}</Text>
								<Text
									style={[
										styles.infoValue,
										row.valueColor ? { color: row.valueColor } : undefined,
										row.isLink ? { textDecorationLine: "underline" as const } : undefined,
									]}
								>
									{row.value}
								</Text>
							</View>
							{index < infoRows.length - 1 && <View style={styles.separator} />}
						</View>
					))}
				</View>

				{/* AI Tip Card */}
				<View style={styles.tipCard}>
					<Text style={styles.tipLabel}>Dica da IA</Text>
					<Text style={styles.tipText}>{debt.tip}</Text>
					{debt.tipLink ? <Text style={styles.tipLink}>{debt.tipLink}</Text> : null}
				</View>

				{/* Action Buttons */}
				<Pressable style={styles.primaryButton} onPress={() => router.push("/(modals)/pay-debt")}>
					<Text style={styles.primaryButtonText}>Marcar como pago</Text>
				</Pressable>

				<Pressable style={styles.secondaryButton}>
					<Text style={styles.secondaryButtonText}>Editar dívida</Text>
				</Pressable>

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
	category: {
		fontFamily: fonts.bodyMedium,
		fontSize: 13,
		color: colors.brandTealMid,
		marginBottom: spacing.sm,
	},
	creditor: {
		fontFamily: fonts.heading,
		fontSize: 32,
		color: colors.textPrimary,
		marginBottom: spacing.md,
	},
	statusPill: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.xs + 2,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.xs + 2,
		borderRadius: radius.pill,
		alignSelf: "flex-start",
		marginBottom: spacing.lg,
	},
	statusDot: {
		width: 6,
		height: 6,
		borderRadius: 3,
	},
	statusText: {
		fontFamily: fonts.bodySemiBold,
		fontSize: 13,
	},
	infoSection: {
		backgroundColor: colors.surface,
		borderWidth: 0.5,
		borderColor: colors.border,
		borderRadius: radius.card,
		padding: spacing.lg,
		marginBottom: spacing.lg,
	},
	infoRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingVertical: spacing.md,
	},
	infoLabel: {
		fontFamily: fonts.body,
		fontSize: 14,
		color: colors.textSecondary,
	},
	infoValue: {
		fontFamily: fonts.bodySemiBold,
		fontSize: 15,
		color: colors.textPrimary,
	},
	separator: {
		height: 0.5,
		backgroundColor: colors.border,
	},
	tipCard: {
		backgroundColor: colors.infoBackground,
		borderRadius: radius.card,
		borderWidth: 0.5,
		borderColor: colors.border,
		padding: spacing.xl,
		marginBottom: spacing.lg,
	},
	tipLabel: {
		fontFamily: fonts.bodySemiBold,
		fontSize: 13,
		color: colors.brandTealDark,
		marginBottom: spacing.sm + 2,
	},
	tipText: {
		fontFamily: fonts.body,
		fontSize: 14,
		color: colors.textPrimary,
		lineHeight: 22,
		marginBottom: spacing.md,
	},
	tipLink: {
		fontFamily: fonts.bodySemiBold,
		fontSize: 14,
		color: colors.brandTealDark,
	},
	primaryButton: {
		backgroundColor: colors.brandTealDark,
		borderRadius: radius.sm,
		paddingVertical: spacing.lg,
		alignItems: "center",
		marginBottom: spacing.md,
	},
	primaryButtonText: {
		fontFamily: fonts.bodySemiBold,
		fontSize: 14,
		color: colors.white,
	},
	secondaryButton: {
		backgroundColor: colors.surface,
		borderRadius: radius.sm,
		borderWidth: 0.5,
		borderColor: colors.border,
		paddingVertical: spacing.lg,
		alignItems: "center",
		marginBottom: spacing.md,
	},
	secondaryButtonText: {
		fontFamily: fonts.bodySemiBold,
		fontSize: 14,
		color: colors.textPrimary,
	},
});
