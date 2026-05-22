import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts, spacing } from "../theme/tokens";

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
					style={({ pressed }) => [styles.backButton, pressed ? { opacity: 0.6 } : undefined]}
				>
					<Feather name="arrow-left" size={16} color={colors.textPrimary} />
					<Text style={styles.backLabel}>Voltar</Text>
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
		backgroundColor: colors.surface,
		borderBottomWidth: 0.5,
		borderBottomColor: colors.border,
		paddingBottom: spacing.md,
	},
	backButton: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.xs + 2,
		marginBottom: spacing.xs,
	},
	backLabel: {
		fontSize: 13,
		fontFamily: fonts.bodyMedium,
		color: colors.textPrimary,
	},
	stepLabel: {
		fontSize: 12,
		fontFamily: fonts.bodyMedium,
		color: colors.brandTealDark,
	},
	title: {
		fontSize: 24,
		fontFamily: fonts.heading,
		color: colors.textPrimary,
	},
	subtitle: {
		fontSize: 14,
		fontFamily: fonts.body,
		color: colors.textSecondary,
	},
});
