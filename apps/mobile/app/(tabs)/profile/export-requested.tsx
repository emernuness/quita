import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Button } from "@/components/Button";
import { colors, fonts, radius, spacing } from "@/theme/tokens";

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
					<Feather name="download" size={48} color={colors.brandTealDark} />
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
				<Button
					variant="primary"
					label="Entendi"
					onPress={() => router.back()}
					style={styles.primaryButton}
				/>

				<Button
					variant="secondary"
					label="Ver o que será exportado"
					onPress={() => router.back()}
					style={styles.secondaryButton}
				/>
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
		paddingHorizontal: spacing.xl,
		paddingTop: spacing.xxl,
		paddingBottom: spacing.xxl,
		alignItems: "center",
	},
	iconContainer: {
		marginBottom: spacing.lg,
	},
	title: {
		fontFamily: fonts.heading,
		fontSize: 28,
		color: colors.brandTealDark,
		textAlign: "center",
		marginBottom: spacing.sm,
	},
	subtitle: {
		fontFamily: fonts.bodyMedium,
		fontSize: 14,
		color: colors.textSecondary,
		textAlign: "center",
		lineHeight: 22,
		marginBottom: spacing.xl,
	},
	card: {
		backgroundColor: colors.surface,
		borderWidth: 0.5,
		borderColor: colors.border,
		borderRadius: radius.card,
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
		backgroundColor: colors.brandTealDark,
		marginTop: 6,
	},
	bulletText: {
		flex: 1,
		fontFamily: fonts.bodyMedium,
		fontSize: 13,
		color: colors.textSecondary,
		lineHeight: 20,
	},
	primaryButton: {
		marginBottom: spacing.sm,
	},
	secondaryButton: {
		marginBottom: spacing.sm,
	},
});
