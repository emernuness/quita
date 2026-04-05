import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors, spacing } from "../theme/tokens";

interface ScreenHeaderProps {
	title: string;
	subtitle?: string;
	stepLabel?: string;
	showBack?: boolean;
	onBack?: () => void;
}

export function ScreenHeader({
	title,
	subtitle,
	stepLabel,
	showBack = false,
	onBack,
}: ScreenHeaderProps) {
	return (
		<View style={styles.container}>
			{showBack ? (
				<Pressable
					onPress={onBack}
					style={({ pressed }) => [
						styles.backButton,
						pressed ? { opacity: 0.6 } : undefined,
					]}
				>
					<Feather name="arrow-left" size={16} color={colors.textPrimary} />
					<Text style={styles.backLabel}>VOLTAR</Text>
				</Pressable>
			) : null}

			{stepLabel ? <Text style={styles.stepLabel}>{stepLabel}</Text> : null}

			<Text style={styles.title}>{title}</Text>

			{subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		gap: spacing.sm,
	},
	backButton: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.sm,
		marginBottom: spacing.sm,
	},
	backLabel: {
		fontSize: 11,
		fontWeight: "600",
		letterSpacing: 2,
		color: colors.textPrimary,
	},
	stepLabel: {
		fontSize: 11,
		fontWeight: "600",
		letterSpacing: 2,
		textTransform: "uppercase",
		color: colors.successGreen,
	},
	title: {
		fontSize: 30,
		fontWeight: "800",
		color: colors.textPrimary,
		letterSpacing: -1,
	},
	subtitle: {
		fontSize: 14,
		fontWeight: "500",
		color: colors.textTertiary,
	},
});
