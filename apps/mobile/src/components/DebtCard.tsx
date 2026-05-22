import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { badges, colors, fonts, radius, spacing } from "../theme/tokens";

type DebtStatus = "pending" | "negotiating" | "settled";

interface DebtCardProps {
	creditor: string;
	category: string;
	amount: number;
	status: DebtStatus;
	dueDate: string;
	onPress?: () => void;
}

const statusConfig: Record<
	DebtStatus,
	{ label: string; badge: (typeof badges)[keyof typeof badges] }
> = {
	pending: {
		label: "Pendente",
		badge: badges.warning,
	},
	negotiating: {
		label: "Negociando",
		badge: badges.info,
	},
	settled: {
		label: "Quitada",
		badge: badges.success,
	},
};

function formatCurrency(value: number): string {
	return `R$ ${Math.abs(value)
		.toFixed(2)
		.replace(".", ",")
		.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}

export function DebtCard({ creditor, category, amount, status, dueDate, onPress }: DebtCardProps) {
	const config = statusConfig[status];
	const amountColor =
		status === "settled"
			? colors.successGreen
			: status === "pending"
				? colors.warningOrange
				: colors.textPrimary;

	return (
		<Pressable
			onPress={onPress}
			style={({ pressed }) => [
				styles.container,
				pressed && onPress ? { opacity: 0.85 } : undefined,
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
					<Text style={[styles.amount, { color: amountColor }]}>{formatCurrency(amount)}</Text>
					<View style={[styles.badge, { backgroundColor: config.badge.background }]}>
						<View style={[styles.badgeDot, { backgroundColor: config.badge.dot }]} />
						<Text style={[styles.badgeText, { color: config.badge.color }]}>{config.label}</Text>
					</View>
				</View>
			</View>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	container: {
		backgroundColor: colors.surface,
		borderWidth: 0.5,
		borderColor: colors.border,
		borderRadius: radius.card,
		padding: spacing.md + 2,
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
		fontFamily: fonts.heading,
		color: colors.textPrimary,
	},
	category: {
		fontSize: 12,
		fontFamily: fonts.bodyMedium,
		color: colors.textSecondary,
	},
	dueDate: {
		fontSize: 13,
		fontFamily: fonts.bodyMedium,
		color: colors.textTertiary,
	},
	right: {
		alignItems: "flex-end",
		gap: 6,
	},
	amount: {
		fontSize: 16,
		fontFamily: fonts.heading,
	},
	badge: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		paddingHorizontal: spacing.sm + 2,
		paddingVertical: 4,
		borderRadius: radius.pill,
	},
	badgeDot: {
		width: 6,
		height: 6,
		borderRadius: radius.full,
	},
	badgeText: {
		fontSize: 11,
		fontFamily: fonts.bodySemiBold,
	},
});
