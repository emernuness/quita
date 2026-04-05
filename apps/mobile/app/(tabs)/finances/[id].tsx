import { colors, spacing } from "@/theme/tokens";
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
		category: "CARTÃO DE CRÉDITO",
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
		category: "EMPRÉSTIMO PESSOAL",
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
		category: "CARNÊ / CREDIÁRIO",
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
		category: "INFORMAL / PESSOAL",
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
		category: "CARNÊ / CREDIÁRIO",
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
			valueColor: debt.hasInterest
				? colors.accentBlue
				: colors.textPrimary,
			isLink: debt.hasInterest,
		},
		{ label: "Vencimento", value: debt.dueDate },
	];

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
					<Feather
						name="arrow-left"
						size={18}
						color={colors.textPrimary}
					/>
					<Text style={styles.backText}>VOLTAR</Text>
				</Pressable>

				{/* Category */}
				<Text style={styles.category}>{debt.category}</Text>

				{/* Creditor Name */}
				<Text style={styles.creditor}>{debt.creditor}</Text>

				{/* Status */}
				<View style={styles.statusRow}>
					<View
						style={[
							styles.statusDot,
							debt.status === "Atrasada" && { backgroundColor: colors.dangerRed },
							debt.status === "Em dia" && { backgroundColor: colors.successGreen },
						]}
					/>
					<Text
						style={[
							styles.statusText,
							debt.status === "Atrasada" && { color: colors.dangerRed },
							debt.status === "Em dia" && { color: colors.successGreen },
						]}
					>
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
								<Text style={styles.infoLabel}>
									{row.label}
								</Text>
								<Text
									style={[
										styles.infoValue,
										row.valueColor
											? { color: row.valueColor }
											: undefined,
										row.isLink
											? { textDecorationLine: "underline" as const }
											: undefined,
									]}
								>
									{row.value}
								</Text>
							</View>
							{index < infoRows.length - 1 && (
								<View style={styles.separator} />
							)}
						</View>
					))}
				</View>

				{/* AI Tip Card */}
				<View style={styles.tipCard}>
					<Text style={styles.tipLabel}>💡 DICA DA IA</Text>
					<Text style={styles.tipText}>{debt.tip}</Text>
					{debt.tipLink ? (
						<Text style={styles.tipLink}>
							👉 {debt.tipLink}
						</Text>
					) : null}
				</View>

				{/* Action Buttons */}
				<Pressable
					style={styles.primaryButton}
					onPress={() => router.push("/(modals)/pay-debt")}
				>
					<Text style={styles.primaryButtonText}>
						MARCAR COMO PAGO
					</Text>
				</Pressable>

				<Pressable style={styles.secondaryButton}>
					<Text style={styles.secondaryButtonText}>
						EDITAR DÍVIDA
					</Text>
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
		paddingHorizontal: spacing.lg,
		paddingTop: spacing.md,
	},
	backButton: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		marginBottom: spacing.lg,
	},
	backText: {
		fontSize: 12,
		fontWeight: "700",
		letterSpacing: 2,
		color: colors.textPrimary,
	},
	category: {
		fontSize: 11,
		fontWeight: "600",
		letterSpacing: 3,
		color: colors.successGreen,
		textTransform: "uppercase",
		marginBottom: 8,
	},
	creditor: {
		fontSize: 32,
		fontWeight: "800",
		color: colors.textPrimary,
		marginBottom: 8,
	},
	statusRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		marginBottom: spacing.lg,
	},
	statusDot: {
		width: 10,
		height: 10,
		borderRadius: 5,
		backgroundColor: colors.textSecondary,
	},
	statusText: {
		fontSize: 15,
		fontWeight: "600",
		color: colors.textSecondary,
	},
	infoSection: {
		backgroundColor: colors.surface,
		borderRadius: 12,
		padding: 16,
		marginBottom: spacing.lg,
	},
	infoRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingVertical: 12,
	},
	infoLabel: {
		fontSize: 14,
		color: colors.textSecondary,
	},
	infoValue: {
		fontSize: 15,
		fontWeight: "700",
		color: colors.textPrimary,
	},
	separator: {
		height: 1,
		backgroundColor: colors.border,
	},
	tipCard: {
		backgroundColor: "#EEF4FF",
		borderRadius: 12,
		padding: 20,
		marginBottom: spacing.lg,
	},
	tipLabel: {
		fontSize: 11,
		fontWeight: "700",
		letterSpacing: 3,
		color: colors.accentBlue,
		marginBottom: 10,
	},
	tipText: {
		fontSize: 14,
		color: colors.textPrimary,
		lineHeight: 22,
		marginBottom: 12,
	},
	tipLink: {
		fontSize: 14,
		fontWeight: "700",
		color: colors.accentBlue,
	},
	primaryButton: {
		backgroundColor: colors.textPrimary,
		borderRadius: 12,
		paddingVertical: 16,
		alignItems: "center",
		marginBottom: 12,
	},
	primaryButtonText: {
		fontSize: 14,
		fontWeight: "700",
		letterSpacing: 2,
		color: "#FFFFFF",
	},
	secondaryButton: {
		backgroundColor: colors.surface,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: colors.border,
		paddingVertical: 16,
		alignItems: "center",
		marginBottom: spacing.md,
	},
	secondaryButtonText: {
		fontSize: 14,
		fontWeight: "700",
		letterSpacing: 2,
		color: colors.textPrimary,
	},
});
