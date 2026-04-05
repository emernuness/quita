import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors, spacing } from "../theme/tokens";

interface CategoryChipProps {
	icon: keyof typeof Feather.glyphMap;
	label: string;
	selected?: boolean;
	onPress?: () => void;
}

export function CategoryChip({
	icon,
	label,
	selected = false,
	onPress,
}: CategoryChipProps) {
	return (
		<Pressable
			onPress={onPress}
			style={({ pressed }) => [
				styles.container,
				selected ? styles.selected : styles.unselected,
				pressed && onPress ? { opacity: 0.8 } : undefined,
			]}
		>
			<Feather
				name={icon}
				size={18}
				color={selected ? colors.surface : colors.textPrimary}
			/>
			<Text style={[styles.label, selected ? styles.labelSelected : styles.labelUnselected]}>
				{label}
			</Text>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		alignItems: "center",
		height: 52,
		paddingHorizontal: 14,
		gap: spacing.sm,
	},
	selected: {
		backgroundColor: colors.textPrimary,
	},
	unselected: {
		backgroundColor: colors.surface,
		borderWidth: 2,
		borderColor: colors.textPrimary,
	},
	label: {
		fontSize: 14,
		fontWeight: "600",
	},
	labelSelected: {
		color: colors.surface,
	},
	labelUnselected: {
		color: colors.textPrimary,
	},
});
