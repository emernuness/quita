import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts, radius, spacing } from "../theme/tokens";

interface ActionCardProps {
	title: string;
	description: string;
	onPress?: () => void;
}

export function ActionCard({ title, description, onPress }: ActionCardProps) {
	return (
		<Pressable
			onPress={onPress}
			style={({ pressed }) => [styles.container, pressed && onPress ? { opacity: 0.9 } : undefined]}
		>
			<View style={styles.content}>
				<Text style={styles.title}>{title}</Text>
				<Text style={styles.description}>{description}</Text>
			</View>
			<Feather name="chevron-right" size={20} color={colors.white} />
		</Pressable>
	);
}

const styles = StyleSheet.create({
	container: {
		backgroundColor: colors.brandTealDark,
		borderRadius: radius.card,
		padding: spacing.lg,
		gap: spacing.sm,
		flexDirection: "row",
		alignItems: "center",
	},
	content: {
		flex: 1,
		gap: spacing.xs,
	},
	title: {
		fontSize: 14,
		fontFamily: fonts.bodySemiBold,
		color: colors.white,
	},
	description: {
		fontSize: 13,
		fontFamily: fonts.body,
		color: colors.white,
		opacity: 0.8,
	},
});
