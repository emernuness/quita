import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../../src/components";
import { colors, fonts, radius, spacing } from "../../src/theme/tokens";

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
				{/* Success icon area */}
				<View style={styles.iconCircle}>
					<Feather name="check" size={36} color={colors.successGreen} />
				</View>

				<Text style={styles.title}>Pagamento confirmado</Text>

				<Text style={styles.subtitle}>
					O pagamento foi registrado com sucesso. Veja o que acontece agora.
				</Text>

				<View style={styles.card}>
					<Text style={styles.cardTitle}>Próximos passos</Text>
					{NEXT_STEPS.map((step, index) => (
						<View key={index} style={styles.bulletRow}>
							<View style={styles.bullet} />
							<Text style={styles.bulletText}>{step}</Text>
						</View>
					))}
				</View>

				<View style={styles.buttonGroup}>
					<Button variant="primary" label="Ver impacto no plano" onPress={() => router.back()} />
					<Button variant="secondary" label="Anexar comprovante" onPress={() => router.back()} />
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: {
		flex: 1,
		backgroundColor: colors.surface,
		borderTopLeftRadius: radius.lg,
		borderTopRightRadius: radius.lg,
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
	iconCircle: {
		width: 72,
		height: 72,
		borderRadius: radius.full,
		backgroundColor: colors.successBackground,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: spacing.lg,
	},
	title: {
		fontSize: 26,
		fontFamily: fonts.heading,
		color: colors.textPrimary,
		textAlign: "center",
		marginBottom: spacing.sm,
	},
	subtitle: {
		fontSize: 14,
		fontFamily: fonts.body,
		color: colors.textSecondary,
		textAlign: "center",
		lineHeight: 22,
		marginBottom: spacing.xl,
	},
	card: {
		backgroundColor: colors.surface,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: radius.card,
		padding: spacing.lg,
		width: "100%",
		marginBottom: spacing.xl,
	},
	cardTitle: {
		fontSize: 16,
		fontFamily: fonts.bodySemiBold,
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
		borderRadius: radius.full,
		backgroundColor: colors.successGreen,
		marginTop: 8,
	},
	bulletText: {
		flex: 1,
		fontSize: 13,
		fontFamily: fonts.body,
		color: colors.textSecondary,
		lineHeight: 20,
	},
	buttonGroup: {
		width: "100%",
		gap: spacing.sm,
	},
});
