import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { colors, spacing } from "@/theme/tokens";

const INFO_ITEMS = [
	"Formatos disponíveis: PDF e CSV.",
	"Prazo estimado: até 24 horas.",
	"Dados incluídos: dívidas, pagamentos, receitas e despesas.",
];

export default function ExportRequestedScreen() {
	const router = useRouter();

	return (
		<SafeAreaView style={styles.safe} edges={["top"]}>
			<ScrollView
				style={styles.scroll}
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
			>
				{/* Icon */}
				<View style={styles.iconContainer}>
					<Feather name="download" size={48} color={colors.accentBlue} />
				</View>

				{/* Title */}
				<Text style={styles.title}>Exportação solicitada</Text>

				{/* Subtitle */}
				<Text style={styles.subtitle}>
					Seu arquivo está sendo preparado. Você receberá uma notificação quando
					estiver pronto para download.
				</Text>

				{/* Info card */}
				<View style={styles.card}>
					{INFO_ITEMS.map((item, index) => (
						<View key={index} style={styles.bulletRow}>
							<View style={styles.bullet} />
							<Text style={styles.bulletText}>{item}</Text>
						</View>
					))}
				</View>

				{/* Buttons */}
				<Pressable
					style={({ pressed }) => [
						styles.primaryButton,
						pressed && styles.buttonPressed,
					]}
					onPress={() => router.back()}
				>
					<Text style={styles.primaryButtonText}>ENTENDI</Text>
				</Pressable>

				<Pressable
					style={({ pressed }) => [
						styles.secondaryButton,
						pressed && styles.buttonPressed,
					]}
					onPress={() => router.back()}
				>
					<Text style={styles.secondaryButtonText}>
						VER O QUE SERÁ EXPORTADO
					</Text>
				</Pressable>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: {
		flex: 1,
		backgroundColor: colors.background,
	},
	scroll: {
		flex: 1,
	},
	content: {
		paddingHorizontal: spacing.lg,
		paddingTop: spacing.xxl,
		paddingBottom: 40,
		alignItems: "center",
	},
	iconContainer: {
		marginBottom: spacing.lg,
	},
	title: {
		fontSize: 32,
		fontWeight: "800",
		fontStyle: "italic",
		color: colors.accentBlue,
		textAlign: "center",
		marginBottom: spacing.sm,
	},
	subtitle: {
		fontSize: 14,
		fontWeight: "500",
		color: colors.textSecondary,
		textAlign: "center",
		lineHeight: 22,
		marginBottom: spacing.xl,
	},
	card: {
		backgroundColor: colors.surface,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: 12,
		padding: spacing.md,
		width: "100%",
		marginBottom: spacing.xl,
	},
	bulletRow: {
		flexDirection: "row",
		gap: spacing.sm,
		marginBottom: spacing.sm,
	},
	bullet: {
		width: 6,
		height: 6,
		borderRadius: 3,
		backgroundColor: colors.accentBlue,
		marginTop: 6,
	},
	bulletText: {
		flex: 1,
		fontSize: 13,
		fontWeight: "500",
		color: colors.textTertiary,
		lineHeight: 20,
	},
	primaryButton: {
		backgroundColor: colors.textPrimary,
		height: 52,
		justifyContent: "center",
		alignItems: "center",
		width: "100%",
		marginBottom: spacing.sm,
	},
	primaryButtonText: {
		color: colors.surface,
		fontSize: 11,
		fontWeight: "600",
		letterSpacing: 2,
		textTransform: "uppercase",
	},
	secondaryButton: {
		backgroundColor: colors.surface,
		height: 52,
		justifyContent: "center",
		alignItems: "center",
		width: "100%",
		borderWidth: 2,
		borderColor: colors.borderStrong,
	},
	secondaryButtonText: {
		color: colors.textPrimary,
		fontSize: 11,
		fontWeight: "600",
		letterSpacing: 2,
		textTransform: "uppercase",
	},
	buttonPressed: {
		opacity: 0.85,
	},
});
