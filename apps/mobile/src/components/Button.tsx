import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, type ViewStyle } from "react-native";
import { colors, fonts, radius, spacing } from "../theme/tokens";

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";

interface ButtonProps {
	variant?: ButtonVariant;
	label: string;
	onPress?: () => void;
	disabled?: boolean;
	loading?: boolean;
	style?: ViewStyle;
}

export function Button({
	variant = "primary",
	label,
	onPress,
	disabled = false,
	loading = false,
	style,
}: ButtonProps) {
	const containerStyle =
		variant === "primary"
			? styles.primary
			: variant === "secondary"
				? styles.secondary
				: variant === "ghost"
					? styles.ghost
					: styles.destructive;

	const labelStyle =
		variant === "primary"
			? styles.labelPrimary
			: variant === "secondary"
				? styles.labelSecondary
				: variant === "ghost"
					? styles.labelGhost
					: styles.labelDestructive;

	const indicatorColor =
		variant === "primary" || variant === "destructive"
			? colors.white
			: variant === "ghost"
				? colors.accentGreen
				: colors.brandTealDark;

	return (
		<Pressable
			onPress={onPress}
			disabled={disabled || loading}
			style={({ pressed }) => [
				styles.base,
				containerStyle,
				(disabled || loading) && styles.disabled,
				pressed && !disabled && !loading && { opacity: 0.85 },
				style,
			]}
		>
			{loading ? (
				<ActivityIndicator color={indicatorColor} size="small" />
			) : (
				<Text style={[styles.label, labelStyle]}>{label}</Text>
			)}
		</Pressable>
	);
}

const styles = StyleSheet.create({
	base: {
		height: 48,
		alignItems: "center",
		justifyContent: "center",
		width: "100%",
		paddingHorizontal: spacing.lg + 4,
		borderRadius: radius.sm,
	},
	primary: {
		backgroundColor: colors.brandTealDark,
	},
	secondary: {
		backgroundColor: "transparent",
		borderWidth: 1.5,
		borderColor: colors.brandTealDark,
	},
	ghost: {
		backgroundColor: "transparent",
		borderWidth: 1.5,
		borderColor: colors.accentGreen,
	},
	destructive: {
		backgroundColor: colors.dangerRed,
	},
	disabled: {
		opacity: 0.5,
	},
	label: {
		fontSize: 14,
		fontFamily: fonts.bodySemiBold,
	},
	labelPrimary: {
		color: colors.white,
	},
	labelSecondary: {
		color: colors.brandTealDark,
	},
	labelGhost: {
		color: colors.accentGreen,
	},
	labelDestructive: {
		color: colors.white,
	},
});
