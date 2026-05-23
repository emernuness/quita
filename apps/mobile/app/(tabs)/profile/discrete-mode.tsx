import { colors, fonts, radius, spacing } from "@/theme/tokens";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useToggleDiscreteMode } from "../../../src/hooks/useProfile";
import { useAuthStore } from "../../../src/stores/auth";

export default function DiscreteModeScreen() {
	const router = useRouter();
	const user = useAuthStore((s) => s.user);
	const [enabled, setEnabled] = useState(user?.discreteMode ?? false);
	const toggleDiscreteMode = useToggleDiscreteMode();

	const handleToggle = (value: boolean) => {
		setEnabled(value);
		toggleDiscreteMode.mutate(
			{ enabled: value },
			{
				onError: () => {
					setEnabled(!value);
					Alert.alert("Erro", "Não foi possível alterar o modo discreto.");
				},
			},
		);
	};

	return (
		<SafeAreaView style={styles.safe}>
			<ScrollView
				style={styles.flex}
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			>
				{/* Back Button */}
				<Pressable onPress={() => router.back()} style={styles.backButton}>
					<Feather name="arrow-left" size={20} color={colors.textPrimary} />
					<Text style={styles.backText}>Voltar</Text>
				</Pressable>

				{/* Title */}
				<Text style={styles.title}>Modo discreto</Text>

				{/* Subtitle */}
				<Text style={styles.subtitle}>
					Esconda os valores das telas com um toque. Ninguém vai ver quanto você deve.
				</Text>

				{/* Preview Section */}
				<Text style={styles.previewLabel}>Como fica</Text>
				<View style={styles.previewCard}>
					<Text style={styles.previewCardLabel}>Total de dívidas</Text>
					<Text style={styles.previewCardValue}>{enabled ? "R$ •••••" : "R$ 12.800,00"}</Text>
					<Text style={styles.previewCardLink}>Toque para revelar</Text>
				</View>

				{/* Toggle Row */}
				<View style={styles.toggleRow}>
					<View style={{ flex: 1 }}>
						<Text style={styles.toggleTitle}>Ativar modo discreto</Text>
						<Text style={styles.toggleSubtitle}>Oculta todos os valores</Text>
					</View>
					<Switch
						value={enabled}
						onValueChange={handleToggle}
						trackColor={{ false: colors.border, true: colors.accentGreen }}
						thumbColor={colors.white}
						disabled={toggleDiscreteMode.isPending}
					/>
				</View>

				{/* Info Card */}
				<View style={styles.infoCard}>
					<Text style={styles.infoCardTitle}>Quando usar</Text>
					<Text style={styles.infoCardText}>
						Ideal para quando você precisa abrir o app em público, no trabalho ou perto de outras
						pessoas. Ative e desative a qualquer momento.
					</Text>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: {
		flex: 1,
		backgroundColor: colors.background,
	},
	flex: {
		flex: 1,
	},
	scrollContent: {
		paddingHorizontal: spacing.xl,
		paddingVertical: spacing.lg,
		paddingBottom: spacing.xxl,
	},
	backButton: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.sm,
		marginBottom: spacing.md,
	},
	backText: {
		fontFamily: fonts.bodySemiBold,
		fontSize: 14,
		color: colors.textPrimary,
	},
	title: {
		fontFamily: fonts.heading,
		fontSize: 28,
		color: colors.textPrimary,
		marginBottom: spacing.sm,
	},
	subtitle: {
		fontFamily: fonts.body,
		fontSize: 15,
		color: colors.textSecondary,
		lineHeight: 22,
		marginBottom: spacing.xl,
	},
	previewLabel: {
		fontFamily: fonts.bodySemiBold,
		fontSize: 14,
		color: colors.textSecondary,
		marginBottom: spacing.sm,
	},
	previewCard: {
		backgroundColor: colors.surface,
		borderWidth: 0.5,
		borderColor: colors.border,
		borderRadius: radius.card,
		padding: spacing.lg,
		alignItems: "center",
		marginBottom: spacing.xl,
	},
	previewCardLabel: {
		fontFamily: fonts.bodyMedium,
		fontSize: 12,
		color: colors.textSecondary,
		marginBottom: spacing.sm,
	},
	previewCardValue: {
		fontFamily: fonts.heading,
		fontSize: 32,
		color: colors.textPrimary,
		marginBottom: spacing.sm,
	},
	previewCardLink: {
		fontFamily: fonts.bodySemiBold,
		fontSize: 13,
		color: colors.brandTealDark,
	},
	toggleRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingVertical: spacing.md,
		borderBottomWidth: 0.5,
		borderBottomColor: colors.border,
		marginBottom: spacing.xl,
	},
	toggleTitle: {
		fontFamily: fonts.bodySemiBold,
		fontSize: 16,
		color: colors.textPrimary,
		marginBottom: 2,
	},
	toggleSubtitle: {
		fontFamily: fonts.body,
		fontSize: 13,
		color: colors.textSecondary,
	},
	infoCard: {
		backgroundColor: colors.infoBackground,
		padding: spacing.md,
		borderRadius: radius.card,
	},
	infoCardTitle: {
		fontFamily: fonts.bodySemiBold,
		fontSize: 14,
		color: colors.brandTealDark,
		marginBottom: spacing.xs,
	},
	infoCardText: {
		fontFamily: fonts.body,
		fontSize: 13,
		color: colors.brandTealDark,
		lineHeight: 19,
	},
});
