import React from "react";
import {
	ActivityIndicator,
	Pressable,
	StyleSheet,
	Text,
	type ViewStyle,
} from "react-native";
import { colors, spacing } from "../theme/tokens";

type ButtonVariant = "primary" | "secondary";

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
	const isPrimary = variant === "primary";

	return (
		<Pressable
			onPress={onPress}
			disabled={disabled || loading}
			style={({ pressed }) => [
				styles.base,
				isPrimary ? styles.primary : styles.secondary,
				(disabled || loading) && styles.disabled,
				pressed && !disabled && !loading && { opacity: 0.8 },
				style,
			]}
		>
			{loading ? (
				<ActivityIndicator
					color={isPrimary ? colors.surface : colors.textPrimary}
					size="small"
				/>
			) : (
				<Text
					style={[
						styles.label,
						isPrimary ? styles.labelPrimary : styles.labelSecondary,
					]}
				>
					{label}
				</Text>
			)}
		</Pressable>
	);
}

const styles = StyleSheet.create({
	base: {
		height: 52,
		alignItems: "center",
		justifyContent: "center",
		width: "100%",
	},
	primary: {
		backgroundColor: colors.textPrimary,
	},
	secondary: {
		backgroundColor: colors.surface,
		borderWidth: 2,
		borderColor: colors.textPrimary,
	},
	disabled: {
		opacity: 0.5,
	},
	label: {
		fontSize: 11,
		fontWeight: "600",
		letterSpacing: 1,
		textTransform: "uppercase",
	},
	labelPrimary: {
		color: colors.surface,
	},
	labelSecondary: {
		color: colors.textPrimary,
	},
});
