import React, { useState } from "react";
import {
	Alert,
	Pressable,
	ScrollView,
	StyleSheet,
	Switch,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { colors, spacing } from "@/theme/tokens";
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
				<Pressable
					onPress={() => router.back()}
					style={styles.backButton}
				>
					<Feather
						name="arrow-left"
						size={20}
						color={colors.textPrimary}
					/>
					<Text style={styles.backText}>VOLTAR</Text>
				</Pressable>

				{/* Title */}
				<Text style={styles.title}>Modo Discreto</Text>

				{/* Subtitle */}
				<Text style={styles.subtitle}>
					Esconda os valores das telas com um toque. Ninguém vai ver
					quanto você deve.
				</Text>

				{/* Preview Section */}
				<Text style={styles.previewLabel}>COMO FICA</Text>
				<View style={styles.previewCard}>
					<Text style={styles.previewCardLabel}>
						TOTAL DE DÍVIDAS
					</Text>
					<Text style={styles.previewCardValue}>
						{enabled ? "R$ •••••" : "R$ 12.800,00"}
					</Text>
					<Text style={styles.previewCardLink}>
						Toque para revelar
					</Text>
				</View>

				{/* Toggle Row */}
				<View style={styles.toggleRow}>
					<View style={{ flex: 1 }}>
						<Text style={styles.toggleTitle}>
							Ativar modo discreto
						</Text>
						<Text style={styles.toggleSubtitle}>
							Oculta todos os valores
						</Text>
					</View>
					<Switch
						value={enabled}
						onValueChange={handleToggle}
						trackColor={{ false: "#E5E5E5", true: "#00AA55" }}
						thumbColor="#FFFFFF"
						disabled={toggleDiscreteMode.isPending}
					/>
				</View>

				{/* Info Card */}
				<View style={styles.infoCard}>
					<Text style={styles.infoCardTitle}>Quando usar</Text>
					<Text style={styles.infoCardText}>
						Ideal para quando você precisa abrir o app em público,
						no trabalho ou perto de outras pessoas. Ative e
						desative a qualquer momento.
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
		padding: spacing.lg,
		paddingBottom: spacing.xxl,
	},
	backButton: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		marginBottom: spacing.md,
	},
	backText: {
		fontSize: 11,
		fontWeight: "600",
		letterSpacing: 2,
		color: colors.textPrimary,
	},
	title: {
		fontSize: 32,
		fontWeight: "800",
		color: colors.textPrimary,
		marginBottom: spacing.sm,
	},
	subtitle: {
		fontSize: 15,
		color: colors.textSecondary,
		lineHeight: 22,
		marginBottom: spacing.xl,
	},
	previewLabel: {
		fontSize: 11,
		fontWeight: "600",
		letterSpacing: 3,
		color: colors.textSecondary,
		textTransform: "uppercase",
		marginBottom: spacing.sm,
	},
	previewCard: {
		backgroundColor: colors.surface,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: 12,
		padding: spacing.lg,
		alignItems: "center",
		marginBottom: spacing.xl,
	},
	previewCardLabel: {
		fontSize: 11,
		fontWeight: "600",
		letterSpacing: 3,
		color: colors.textSecondary,
		textTransform: "uppercase",
		marginBottom: spacing.sm,
	},
	previewCardValue: {
		fontSize: 32,
		fontWeight: "800",
		color: colors.textPrimary,
		marginBottom: spacing.sm,
	},
	previewCardLink: {
		fontSize: 13,
		color: colors.accentBlue,
		fontWeight: "600",
	},
	toggleRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingVertical: spacing.md,
		borderBottomWidth: 1,
		borderBottomColor: colors.border,
		marginBottom: spacing.xl,
	},
	toggleTitle: {
		fontSize: 16,
		fontWeight: "700",
		color: colors.textPrimary,
		marginBottom: 2,
	},
	toggleSubtitle: {
		fontSize: 13,
		color: colors.textSecondary,
	},
	infoCard: {
		backgroundColor: "#EEF4FF",
		padding: spacing.md,
		borderRadius: 12,
	},
	infoCardTitle: {
		fontSize: 14,
		fontWeight: "700",
		color: colors.accentBlue,
		marginBottom: spacing.xs,
	},
	infoCardText: {
		fontSize: 13,
		color: colors.accentBlue,
		lineHeight: 19,
	},
});
