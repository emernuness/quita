import React from "react";
import { StyleSheet, Text, TextInput, View, type KeyboardTypeOptions } from "react-native";
import { colors, spacing } from "../theme/tokens";

interface InputProps {
	label: string;
	placeholder?: string;
	value?: string;
	onChangeText?: (text: string) => void;
	secureTextEntry?: boolean;
	keyboardType?: KeyboardTypeOptions;
	error?: string;
	autoCapitalize?: "none" | "sentences" | "words" | "characters";
}

export function Input({
	label,
	placeholder,
	value,
	onChangeText,
	secureTextEntry,
	keyboardType,
	error,
	autoCapitalize,
}: InputProps) {
	return (
		<View style={styles.container}>
			<Text style={styles.label}>{label}</Text>
			<TextInput
				style={[styles.input, error ? styles.inputError : undefined]}
				placeholder={placeholder}
				placeholderTextColor={colors.textSecondary}
				value={value}
				onChangeText={onChangeText}
				secureTextEntry={secureTextEntry}
				keyboardType={keyboardType}
				autoCapitalize={autoCapitalize ?? "none"}
			/>
			{error ? <Text style={styles.error}>{error}</Text> : null}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		width: "100%",
		gap: spacing.sm,
	},
	label: {
		fontSize: 11,
		fontWeight: "600",
		letterSpacing: 3,
		textTransform: "uppercase",
		color: colors.textSecondary,
	},
	input: {
		height: 52,
		backgroundColor: colors.surface,
		borderWidth: 2,
		borderColor: colors.textPrimary,
		paddingHorizontal: spacing.md,
		fontSize: 16,
		fontWeight: "500",
		color: colors.textPrimary,
	},
	inputError: {
		borderColor: colors.dangerRed,
	},
	error: {
		fontSize: 12,
		fontWeight: "500",
		color: colors.dangerRed,
	},
});
