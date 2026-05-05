import React from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { colors } from "../theme/tokens";

interface ProgressBarProps {
	progress: number; // 0 to 1
	color?: string;
	style?: ViewStyle;
}

export function ProgressBar({ progress, color, style }: ProgressBarProps) {
	const clampedProgress = Math.min(1, Math.max(0, progress));

	return (
		<View style={[styles.track, style]}>
			<View
				style={[
					styles.fill,
					{
						width: `${clampedProgress * 100}%`,
						backgroundColor: color ?? colors.accentGreen,
					},
				]}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	track: {
		width: "100%",
		height: 4,
		backgroundColor: colors.gray200,
		borderRadius: 2,
		overflow: "hidden",
	},
	fill: {
		height: "100%",
		borderRadius: 2,
	},
});
