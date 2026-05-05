import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Button } from "@/components/Button";
import { colors, fonts, radius, spacing } from "@/theme/tokens";

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
				<Pressable onPress={() => router.back()} style={styles.backButton}>
					<Feather name="arrow-left" size={20} color={colors.textPrimary} />
					<Text style={styles.backText}>Voltar</Text>
				</Pressable>

				{/* Title */}
				<Text style={styles.title}>Exportar meus dados</Text>

				{/* Subtitle */}
				<Text style={styles.subtitle}>
					Seus dados são seus. Baixe uma cópia completa, entenda o prazo de geração
					e revise o que será incluído.
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
				<Text style={styles.dangerLabel}>Zona de perigo</Text>

				<Text style={styles.dangerText}>
					Ao excluir sua conta, todos os seus dados serão permanentemente apagados.
					Antes disso, exporte uma cópia e revise o prazo legal de retenção.
				</Text>

				<Button
					variant="destructive"
					label="Excluir minha conta"
					onPress={() => {
						/* TODO: delete account flow */
					}}
					style={styles.dangerButton}
				/>

				<Text style={styles.disclaimerText}>
					Em conformidade com a LGPD (Lei Geral de Proteção de Dados), você tem
					direito ao acesso e portabilidade dos seus dados a qualquer momento.
				</Text>

				{/* Info Card */}
				<View style={styles.infoCard}>
					<Text style={styles.infoCardTitle}>Como funciona a exportação</Text>
					<Text style={styles.infoCardText}>
						Os arquivos podem levar alguns minutos para serem gerados. Você
						receberá uma notificação quando estiver pronto.{"\n\n"}Inclui: dívidas,
						receitas, despesas, histórico de pagamentos e plano atual.
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
	optionCard: {
		backgroundColor: colors.surface,
		borderWidth: 0.5,
		borderColor: colors.border,
		borderRadius: radius.card,
		padding: spacing.lg,
		marginBottom: spacing.md,
	},
	optionTitle: {
		fontFamily: fonts.bodySemiBold,
		fontSize: 16,
		color: colors.textPrimary,
		marginBottom: 2,
	},
	optionSubtitle: {
		fontFamily: fonts.body,
		fontSize: 13,
		color: colors.textSecondary,
	},
	dangerLabel: {
		fontFamily: fonts.bodySemiBold,
		fontSize: 14,
		color: colors.dangerRed,
		marginTop: spacing.xl,
		marginBottom: spacing.md,
	},
	dangerText: {
		fontFamily: fonts.body,
		fontSize: 14,
		color: colors.dangerRed,
		lineHeight: 20,
		marginBottom: spacing.md,
	},
	dangerButton: {
		marginBottom: spacing.md,
	},
	disclaimerText: {
		fontFamily: fonts.body,
		fontSize: 12,
		color: colors.textSecondary,
		lineHeight: 18,
		marginBottom: spacing.xl,
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
