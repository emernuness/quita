import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../theme/tokens";

type DebtStatus = "pending" | "negotiating" | "settled";

interface DebtCardProps {
	creditor: string;
	category: string;
	amount: number;
	status: DebtStatus;
	dueDate: string;
	onPress?: () => void;
}

const statusConfig: Record<DebtStatus, { label: string; color: string; bg: string }> = {
	pending: {
		label: "PENDENTE",
		color: colors.dangerRed,
		bg: "#FFF0EB",
	},
	negotiating: {
		label: "NEGOCIANDO",
		color: colors.accentBlue,
		bg: "#EBF0FF",
	},
	settled: {
		label: "QUITADA",
		color: colors.successGreen,
		bg: "#EBFFF3",
	},
};

function formatCurrency(value: number): string {
	return `R$ ${Math.abs(value)
		.toFixed(2)
		.replace(".", ",")
		.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}

export function DebtCard({
	creditor,
	category,
	amount,
	status,
	dueDate,
	onPress,
}: DebtCardProps) {
	const config = statusConfig[status];
	const amountColor = status === "settled" ? colors.successGreen : colors.dangerRed;

	return (
		<Pressable
			onPress={onPress}
			style={({ pressed }) => [
				styles.container,
				pressed && onPress ? { opacity: 0.8 } : undefined,
			]}
		>
			<View style={styles.content}>
				<View style={styles.left}>
					<Text style={styles.creditor} numberOfLines={1}>
						{creditor}
					</Text>
					<Text style={styles.category}>{category}</Text>
					<Text style={styles.dueDate}>{dueDate}</Text>
				</View>
				<View style={styles.right}>
					<Text style={[styles.amount, { color: amountColor }]}>
						{formatCurrency(amount)}
					</Text>
					<View style={[styles.badge, { backgroundColor: config.bg }]}>
						<Text style={[styles.badgeText, { color: config.color }]}>
							{config.label}
						</Text>
					</View>
				</View>
			</View>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	container: {
		backgroundColor: colors.surface,
		borderWidth: 2,
		borderColor: colors.textPrimary,
		padding: spacing.md,
	},
	content: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-start",
	},
	left: {
		flex: 1,
		gap: 4,
		marginRight: spacing.md,
	},
	creditor: {
		fontSize: 16,
		fontWeight: "700",
		color: colors.textPrimary,
	},
	category: {
		fontSize: 11,
		fontWeight: "600",
		letterSpacing: 2,
		textTransform: "uppercase",
		color: colors.textSecondary,
	},
	dueDate: {
		fontSize: 13,
		fontWeight: "500",
		color: colors.textTertiary,
	},
	right: {
		alignItems: "flex-end",
		gap: 6,
	},
	amount: {
		fontSize: 16,
		fontWeight: "700",
	},
	badge: {
		paddingHorizontal: 8,
		paddingVertical: 3,
		borderRadius: 4,
	},
	badgeText: {
		fontSize: 10,
		fontWeight: "700",
		letterSpacing: 1,
		textTransform: "uppercase",
	},
});
