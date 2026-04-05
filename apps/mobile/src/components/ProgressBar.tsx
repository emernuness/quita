import React from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { colors } from "../theme/tokens";

interface ProgressBarProps {
	progress: number; // 0 to 1
	style?: ViewStyle;
}

export function ProgressBar({ progress, style }: ProgressBarProps) {
	const clampedProgress = Math.min(1, Math.max(0, progress));

	return (
		<View style={[styles.track, style]}>
			<View style={[styles.fill, { width: `${clampedProgress * 100}%` }]} />
		</View>
	);
}

const styles = StyleSheet.create({
	track: {
		width: "100%",
		height: 12,
		backgroundColor: colors.border,
		overflow: "hidden",
	},
	fill: {
		height: "100%",
		backgroundColor: colors.successGreen,
	},
});
