import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { colors, spacing } from "@/theme/tokens";

const NEXT_STEPS = [
	"Seu plano será recalculado automaticamente com base neste pagamento.",
	"O comprovante pode ser anexado agora ou depois, no histórico.",
	"Você receberá uma notificação quando o impacto for processado.",
];

export default function PaymentConfirmedModal() {
	const router = useRouter();

	return (
		<SafeAreaView style={styles.safe}>
			<ScrollView
				style={styles.scroll}
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
			>
				{/* Green Circle with Checkmark */}
				<View style={styles.iconCircle}>
					<Feather name="check" size={40} color="#FFFFFF" />
				</View>

				{/* Title */}
				<Text style={styles.title}>Pagamento confirmado</Text>

				{/* Subtitle */}
				<Text style={styles.subtitle}>
					O pagamento foi registrado com sucesso. Veja o que acontece agora.
				</Text>

				{/* Próximos passos card */}
				<View style={styles.card}>
					<Text style={styles.cardTitle}>Próximos passos</Text>
					{NEXT_STEPS.map((step, index) => (
						<View key={index} style={styles.bulletRow}>
							<View style={styles.bullet} />
							<Text style={styles.bulletText}>{step}</Text>
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
					<Text style={styles.primaryButtonText}>VER IMPACTO NO PLANO</Text>
				</Pressable>

				<Pressable
					style={({ pressed }) => [
						styles.secondaryButton,
						pressed && styles.buttonPressed,
					]}
					onPress={() => router.back()}
				>
					<Text style={styles.secondaryButtonText}>ANEXAR COMPROVANTE</Text>
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
	iconCircle: {
		width: 80,
		height: 80,
		borderRadius: 40,
		backgroundColor: colors.successGreen,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: spacing.lg,
	},
	title: {
		fontSize: 32,
		fontWeight: "800",
		fontStyle: "italic",
		color: colors.successGreen,
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
	cardTitle: {
		fontSize: 16,
		fontWeight: "700",
		color: colors.textPrimary,
		marginBottom: spacing.md,
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
		backgroundColor: colors.textPrimary,
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
