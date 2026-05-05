import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors, fonts, radius, spacing } from "../theme/tokens";

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
				pressed && onPress ? { opacity: 0.85 } : undefined,
			]}
		>
			<Feather
				name={icon}
				size={16}
				color={selected ? colors.white : colors.textPrimary}
			/>
			<Text
				style={[
					styles.label,
					selected ? styles.labelSelected : styles.labelUnselected,
				]}
			>
				{label}
			</Text>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		alignItems: "center",
		height: 36,
		paddingHorizontal: spacing.md + 2,
		gap: spacing.sm - 2,
		borderRadius: radius.pill,
	},
	selected: {
		backgroundColor: colors.brandTealDark,
	},
	unselected: {
		backgroundColor: colors.gray100,
	},
	label: {
		fontSize: 13,
		fontFamily: fonts.bodyMedium,
	},
	labelSelected: {
		color: colors.white,
	},
	labelUnselected: {
		color: colors.textPrimary,
	},
});
