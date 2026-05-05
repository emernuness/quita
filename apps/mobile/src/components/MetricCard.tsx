import React from "react";
import { StyleSheet, Text, View, type ViewStyle } from "react-native";
import { colors, fonts, radius, spacing } from "../theme/tokens";

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
		backgroundColor: colors.gray100,
		borderWidth: 0.5,
		borderColor: colors.border,
		borderRadius: radius.card,
		padding: spacing.lg,
	},
	label: {
		fontSize: 11,
		fontFamily: fonts.bodyMedium,
		color: colors.textTertiary,
	},
	value: {
		fontSize: 22,
		fontFamily: fonts.heading,
		marginTop: spacing.xs,
	},
	subtitle: {
		fontSize: 13,
		fontFamily: fonts.bodyMedium,
		color: colors.textTertiary,
		marginTop: spacing.xs,
	},
});
