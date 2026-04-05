import React from "react";
import { StyleSheet, Text, View, type ViewStyle } from "react-native";
import { colors, spacing } from "../theme/tokens";

interface MetricCardProps {
	label: string;
	value: string;
	subtitle?: string;
	valueColor?: string;
	style?: ViewStyle;
}

export function MetricCard({
	label,
	value,
	subtitle,
	valueColor = colors.textPrimary,
	style,
}: MetricCardProps) {
	return (
		<View style={[styles.container, style]}>
			<Text style={styles.label}>{label}</Text>
			<Text style={[styles.value, { color: valueColor }]}>{value}</Text>
			{subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		backgroundColor: colors.surface,
		borderWidth: 2,
		borderColor: colors.textPrimary,
		paddingVertical: 20,
		paddingHorizontal: spacing.md,
	},
	label: {
		fontSize: 11,
		fontWeight: "600",
		letterSpacing: 3,
		textTransform: "uppercase",
		color: colors.textSecondary,
	},
	value: {
		fontSize: 44,
		fontWeight: "800",
		letterSpacing: -2,
		marginTop: spacing.xs,
	},
	subtitle: {
		fontSize: 14,
		fontWeight: "500",
		color: colors.textTertiary,
		marginTop: spacing.xs,
	},
});
