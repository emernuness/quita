import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors, spacing } from "../theme/tokens";

interface ActionCardProps {
	title: string;
	description: string;
	onPress?: () => void;
}

export function ActionCard({ title, description, onPress }: ActionCardProps) {
	return (
		<Pressable
			onPress={onPress}
			style={({ pressed }) => [
				styles.container,
				pressed && onPress ? { opacity: 0.85 } : undefined,
			]}
		>
			<View style={styles.content}>
				<Text style={styles.title}>{title}</Text>
				<Text style={styles.description}>{description}</Text>
			</View>
			<Feather name="chevron-right" size={20} color={colors.surface} />
		</Pressable>
	);
}

const styles = StyleSheet.create({
	container: {
		backgroundColor: colors.accentBlue,
		padding: spacing.md,
		gap: spacing.sm,
		flexDirection: "row",
		alignItems: "center",
	},
	content: {
		flex: 1,
		gap: spacing.sm,
	},
	title: {
		fontSize: 14,
		fontWeight: "700",
		color: colors.surface,
	},
	description: {
		fontSize: 13,
		fontWeight: "500",
		color: colors.surface,
		opacity: 0.8,
	},
});
