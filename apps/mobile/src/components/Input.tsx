import React, { useState } from "react";
import {
	StyleSheet,
	Text,
	TextInput,
	View,
	type KeyboardTypeOptions,
} from "react-native";
import { colors, fonts, radius, spacing } from "../theme/tokens";

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
	const [focused, setFocused] = useState(false);

	return (
		<View style={styles.container}>
			<Text style={styles.label}>{label}</Text>
			<TextInput
				style={[
					styles.input,
					focused ? styles.inputFocused : undefined,
					error ? styles.inputError : undefined,
				]}
				placeholder={placeholder}
				placeholderTextColor={colors.textTertiary}
				value={value}
				onChangeText={onChangeText}
				secureTextEntry={secureTextEntry}
				keyboardType={keyboardType}
				autoCapitalize={autoCapitalize ?? "none"}
				onFocus={() => setFocused(true)}
				onBlur={() => setFocused(false)}
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
		fontSize: 12,
		fontFamily: fonts.bodyMedium,
		color: colors.textSecondary,
	},
	input: {
		height: 48,
		backgroundColor: colors.surface,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: radius.input,
		paddingHorizontal: spacing.md,
		fontSize: 14,
		fontFamily: fonts.body,
		color: colors.textPrimary,
	},
	inputFocused: {
		borderColor: colors.brandTealDark,
	},
	inputError: {
		borderColor: colors.dangerRed,
	},
	error: {
		fontSize: 12,
		fontFamily: fonts.bodyMedium,
		color: colors.dangerRed,
	},
});
