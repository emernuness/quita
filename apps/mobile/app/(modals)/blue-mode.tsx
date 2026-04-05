import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { colors, spacing } from "@/theme/tokens";

const STATS = [
	{ value: "5", label: "dívidas quitadas" },
	{ value: "8", label: "meses de jornada" },
	{ value: "R$ 1.2k", label: "economia em juros" },
];

export default function BlueModeModal() {
	const router = useRouter();

	return (
		<View style={styles.gradientBg}>
			<SafeAreaView style={styles.safe}>
				<ScrollView
					style={styles.scroll}
					contentContainerStyle={styles.content}
					showsVerticalScrollIndicator={false}
				>
					{/* Trophy Icon */}
					<View style={styles.iconContainer}>
						<Feather name="award" size={48} color="#FFFFFF" />
					</View>

					{/* Title */}
					<Text style={styles.title}>Você está no azul!</Text>

					{/* Subtitle */}
					<Text style={styles.subtitle}>
						Todas as suas dívidas foram quitadas. Sua jornada financeira
						começa agora.
					</Text>

					{/* Journey Card */}
					<View style={styles.card}>
						<Text style={styles.cardTitle}>Sua jornada</Text>
						<View style={styles.statsRow}>
							{STATS.map((stat, index) => (
								<React.Fragment key={stat.label}>
									<View style={styles.statItem}>
										<Text style={styles.statValue}>{stat.value}</Text>
										<Text style={styles.statLabel}>{stat.label}</Text>
									</View>
									{index < STATS.length - 1 && (
										<View style={styles.statDivider} />
									)}
								</React.Fragment>
							))}
						</View>
					</View>

					{/* Next Step Card */}
					<View style={styles.nextStepCard}>
						<Text style={styles.nextStepLabel}>PRÓXIMO PASSO</Text>
						<Text style={styles.nextStepText}>
							Agora que você saiu das dívidas, o próximo objetivo é construir
							uma reserva de emergência. Recomendamos guardar o equivalente a
							3 meses de despesas.
						</Text>
					</View>

					{/* Buttons */}
					<Pressable
						style={({ pressed }) => [
							styles.primaryButton,
							pressed && styles.buttonPressed,
						]}
						onPress={() => router.back()}
					>
						<Text style={styles.primaryButtonText}>
							CRIAR RESERVA DE EMERGÊNCIA
						</Text>
					</Pressable>

					<Pressable
						style={({ pressed }) => [
							styles.secondaryButton,
							pressed && styles.buttonPressed,
						]}
						onPress={() => router.back()}
					>
						<Text style={styles.secondaryButtonText}>IR PARA O INÍCIO</Text>
					</Pressable>
				</ScrollView>
			</SafeAreaView>
		</View>
	);
}

const styles = StyleSheet.create({
	gradientBg: {
		flex: 1,
		backgroundColor: colors.blueModeGradientMid,
	},
	safe: {
		flex: 1,
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
		color: "#FFFFFF",
		textAlign: "center",
		marginBottom: spacing.sm,
	},
	subtitle: {
		fontSize: 14,
		fontWeight: "500",
		color: "rgba(255,255,255,0.8)",
		textAlign: "center",
		lineHeight: 22,
		marginBottom: spacing.xl,
	},
	card: {
		backgroundColor: colors.surface,
		borderRadius: 12,
		padding: spacing.md,
		width: "100%",
		marginBottom: spacing.md,
	},
	cardTitle: {
		fontSize: 16,
		fontWeight: "700",
		color: colors.textPrimary,
		marginBottom: spacing.md,
	},
	statsRow: {
		flexDirection: "row",
		alignItems: "center",
	},
	statItem: {
		flex: 1,
		alignItems: "center",
		gap: spacing.xs,
	},
	statValue: {
		fontSize: 20,
		fontWeight: "800",
		color: colors.textPrimary,
	},
	statLabel: {
		fontSize: 11,
		fontWeight: "500",
		color: colors.textSecondary,
		textAlign: "center",
	},
	statDivider: {
		width: 1,
		height: 40,
		backgroundColor: colors.border,
	},
	nextStepCard: {
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.3)",
		borderRadius: 12,
		padding: spacing.md,
		width: "100%",
		marginBottom: spacing.xl,
	},
	nextStepLabel: {
		fontSize: 11,
		fontWeight: "700",
		letterSpacing: 2,
		color: "#FFFFFF",
		textTransform: "uppercase",
		marginBottom: spacing.sm,
	},
	nextStepText: {
		fontSize: 13,
		fontWeight: "500",
		color: "rgba(255,255,255,0.8)",
		lineHeight: 20,
	},
	primaryButton: {
		backgroundColor: "#FFFFFF",
		height: 52,
		justifyContent: "center",
		alignItems: "center",
		width: "100%",
		marginBottom: spacing.sm,
	},
	primaryButtonText: {
		color: colors.textPrimary,
		fontSize: 11,
		fontWeight: "600",
		letterSpacing: 2,
		textTransform: "uppercase",
	},
	secondaryButton: {
		backgroundColor: "transparent",
		height: 52,
		justifyContent: "center",
		alignItems: "center",
		width: "100%",
		borderWidth: 2,
		borderColor: "#FFFFFF",
	},
	secondaryButtonText: {
		color: "#FFFFFF",
		fontSize: 11,
		fontWeight: "600",
		letterSpacing: 2,
		textTransform: "uppercase",
	},
	buttonPressed: {
		opacity: 0.85,
	},
});
