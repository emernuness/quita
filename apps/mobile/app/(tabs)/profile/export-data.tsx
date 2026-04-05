import React from "react";
import {
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { colors, spacing } from "@/theme/tokens";

export default function ExportDataScreen() {
	const router = useRouter();

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
				<Text style={styles.title}>Exportar meus dados</Text>

				{/* Subtitle */}
				<Text style={styles.subtitle}>
					Seus dados são seus. Baixe uma cópia completa, entenda o
					prazo de geração e revise o que será incluído.
				</Text>

				{/* Export Option: PDF */}
				<Pressable
					style={({ pressed }) => [
						styles.optionCard,
						pressed && { opacity: 0.85 },
					]}
					onPress={() => {
						/* TODO: export PDF */
					}}
				>
					<Text style={styles.optionTitle}>Relatório em PDF</Text>
					<Text style={styles.optionSubtitle}>
						Resumo de dívidas, plano e progresso
					</Text>
				</Pressable>

				{/* Export Option: CSV */}
				<Pressable
					style={({ pressed }) => [
						styles.optionCard,
						pressed && { opacity: 0.85 },
					]}
					onPress={() => {
						/* TODO: export CSV */
					}}
				>
					<Text style={styles.optionTitle}>Planilha CSV</Text>
					<Text style={styles.optionSubtitle}>
						Todos os seus dados em formato editável
					</Text>
				</Pressable>

				{/* Danger Zone */}
				<Text style={styles.dangerLabel}>ZONA DE PERIGO</Text>

				<Text style={styles.dangerText}>
					Ao excluir sua conta, todos os seus dados serão
					permanentemente apagados. Antes disso, exporte uma cópia e
					revise o prazo legal de retenção.
				</Text>

				<Pressable
					style={({ pressed }) => [
						styles.dangerButton,
						pressed && { opacity: 0.85 },
					]}
					onPress={() => {
						/* TODO: delete account flow */
					}}
				>
					<Text style={styles.dangerButtonText}>
						EXCLUIR MINHA CONTA
					</Text>
				</Pressable>

				<Text style={styles.disclaimerText}>
					Em conformidade com a LGPD (Lei Geral de Proteção de Dados),
					você tem direito ao acesso e portabilidade dos seus dados a
					qualquer momento.
				</Text>

				{/* Info Card */}
				<View style={styles.infoCard}>
					<Text style={styles.infoCardTitle}>
						Como funciona a exportação
					</Text>
					<Text style={styles.infoCardText}>
						Os arquivos podem levar alguns minutos para serem
						gerados. Você receberá uma notificação quando estiver
						pronto.{"\n\n"}Inclui: dívidas, receitas, despesas,
						histórico de pagamentos e plano atual.
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
	optionCard: {
		backgroundColor: colors.surface,
		borderWidth: 2,
		borderColor: colors.borderStrong,
		borderRadius: 12,
		padding: spacing.md,
		marginBottom: spacing.md,
	},
	optionTitle: {
		fontSize: 16,
		fontWeight: "700",
		color: colors.textPrimary,
		marginBottom: 2,
	},
	optionSubtitle: {
		fontSize: 13,
		color: colors.textSecondary,
	},
	dangerLabel: {
		fontSize: 11,
		fontWeight: "600",
		letterSpacing: 3,
		color: colors.dangerRed,
		textTransform: "uppercase",
		marginTop: spacing.xl,
		marginBottom: spacing.md,
	},
	dangerText: {
		fontSize: 14,
		color: colors.dangerRed,
		lineHeight: 20,
		marginBottom: spacing.md,
	},
	dangerButton: {
		borderWidth: 2,
		borderColor: colors.dangerRed,
		borderRadius: 12,
		height: 52,
		justifyContent: "center",
		alignItems: "center",
		marginBottom: spacing.md,
	},
	dangerButtonText: {
		fontSize: 11,
		fontWeight: "700",
		letterSpacing: 2,
		color: colors.dangerRed,
		textTransform: "uppercase",
	},
	disclaimerText: {
		fontSize: 12,
		color: colors.textSecondary,
		lineHeight: 18,
		marginBottom: spacing.xl,
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
