import { colors, spacing } from "@/theme/tokens";
import { onboardingDebtCategoriesSchema } from "@quita/shared";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSaveCategories } from "../../src/hooks/useOnboarding";
import { useDebtCategories } from "../../src/hooks/useDebts";
import { validateWithZod } from "../../src/utils/validation";

export default function CategoriesScreen() {
	const router = useRouter();
	const { data: categories, isLoading: isLoadingCategories } = useDebtCategories();
	const saveCategories = useSaveCategories();
	const [selected, setSelected] = useState<Set<string>>(new Set());
	const [error, setError] = useState<string | null>(null);

	const toggleCategory = useCallback((id: string) => {
		setSelected((prev) => {
			const next = new Set(prev);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			return next;
		});
		setError(null);
	}, []);

	const handleContinue = useCallback(() => {
		const result = validateWithZod(onboardingDebtCategoriesSchema, {
			categoryIds: Array.from(selected),
		});

		if (!result.success) {
			const categoryError = result.errors.categoryIds ||
				Object.entries(result.errors).find(([k]) => k.startsWith("categoryIds"))?.[1] ||
				"Selecione pelo menos uma categoria";
			setError(categoryError);
			return;
		}

		saveCategories.mutate(
			result.data,
			{
				onSuccess: () => {
					const selectedCategories = Array.from(selected)
						.map((id) => {
							const cat = categories?.find((c) => c.id === id);
							return cat ? { id: cat.id, name: cat.name, icon: cat.icon } : null;
						})
						.filter(Boolean);
					router.push({
						pathname: "/(onboarding)/debt-detail",
						params: {
							categories: JSON.stringify(selectedCategories),
						},
					});
				},
				onError: (err) => {
					Alert.alert(
						"Erro",
						err.message || "Não foi possível salvar as categorias. Tente novamente.",
					);
				},
			},
		);
	}, [selected, saveCategories, router, categories]);

	return (
		<SafeAreaView style={styles.safeArea}>
			<View style={styles.progressBarTrack}>
				<View style={[styles.progressBarFill, { width: "75%" }]} />
			</View>

			<ScrollView
				style={styles.flex}
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			>
				<Text style={styles.stepIndicator}>
					Passo 3 de 4 · escolha tudo que faz sentido hoje
				</Text>

				{/* Back Button */}
				<Pressable
					style={styles.backButton}
					onPress={() => router.back()}
					hitSlop={12}
				>
					<Feather name="arrow-left" size={16} color={colors.textPrimary} />
					<Text style={styles.backText}>VOLTAR</Text>
				</Pressable>

				<Text style={styles.stepLabel}>MAPEAMENTO DE DÍVIDAS</Text>

				<Text style={styles.title}>Pra quem você deve hoje?</Text>

				<Text style={styles.subtitle}>
					Selecione as categorias que representam suas dívidas atuais. Você vai
					detalhar cada uma no próximo passo.
				</Text>

				<View style={styles.infoBox}>
					<Text style={styles.infoTitle}>Por que separar por categoria?</Text>
					<Text style={styles.infoText}>
						Cada tipo de dívida tem uma estratégia diferente. Cartão cobra juros
						altos, empréstimo pode ser renegociado, e dívida com pessoa conhecida
						precisa de conversa. Separar ajuda a priorizar.
					</Text>
				</View>

				<View style={styles.grid}>
					{isLoadingCategories ? (
						<ActivityIndicator color={colors.textSecondary} style={{ marginVertical: spacing.lg }} />
					) : !categories?.length ? (
						<Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: "center", marginVertical: spacing.lg }}>
							Não foi possível carregar as categorias. Tente novamente.
						</Text>
					) : (
						categories.map(({ id, icon, name }) => {
							const isSelected = selected.has(id);
							return (
								<Pressable
									key={id}
									style={[
										styles.chip,
										isSelected && styles.chipSelected,
									]}
									onPress={() => toggleCategory(id)}
								>
									<Feather
										name={icon as React.ComponentProps<typeof Feather>["name"]}
										size={18}
										color={isSelected ? colors.surface : colors.textPrimary}
									/>
									<Text
										style={[
											styles.chipLabel,
											isSelected && styles.chipTextSelected,
										]}
										numberOfLines={1}
									>
										{name}
									</Text>
								</Pressable>
							);
						})
					)}
				</View>

				{error ? (
					<Text style={{ fontSize: 12, color: colors.dangerRed, marginBottom: spacing.sm }}>
						{error}
					</Text>
				) : null}

				<Text style={styles.helperText}>
					Não se preocupe se esqueceu alguma. Você pode adicionar depois.
				</Text>
			</ScrollView>

			<View style={styles.bottomContainer}>
				<Pressable
					style={({ pressed }) => [
						styles.primaryButton,
						saveCategories.isPending && styles.primaryButtonDisabled,
						pressed && !saveCategories.isPending && styles.primaryButtonPressed,
					]}
					onPress={handleContinue}
					disabled={saveCategories.isPending}
				>
					{saveCategories.isPending ? (
						<ActivityIndicator color={colors.surface} />
					) : (
						<Text style={styles.primaryButtonText}>CONTINUAR</Text>
					)}
				</Pressable>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: colors.background,
	},
	flex: {
		flex: 1,
	},
	progressBarTrack: {
		height: 4,
		backgroundColor: colors.border,
		width: "100%",
	},
	progressBarFill: {
		height: 4,
		backgroundColor: colors.successGreen,
	},
	scrollContent: {
		paddingHorizontal: spacing.lg,
		paddingTop: spacing.lg,
		paddingBottom: spacing.xl,
	},
	stepIndicator: {
		fontSize: 13,
		color: colors.textSecondary,
		marginBottom: spacing.lg,
	},
	backButton: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.xs,
		marginBottom: spacing.md,
		alignSelf: "flex-start",
	},
	backText: {
		fontSize: 11,
		fontWeight: "600",
		letterSpacing: 2,
		color: colors.textPrimary,
	},
	stepLabel: {
		fontSize: 11,
		fontWeight: "600",
		color: colors.successGreen,
		letterSpacing: 3,
		textTransform: "uppercase",
		marginBottom: spacing.sm,
	},
	title: {
		fontSize: 28,
		fontWeight: "800",
		color: colors.textPrimary,
		marginBottom: spacing.md,
	},
	subtitle: {
		fontSize: 15,
		color: colors.textTertiary,
		lineHeight: 22,
		marginBottom: spacing.lg,
	},
	infoBox: {
		backgroundColor: "#F5F5F5",
		borderRadius: 12,
		padding: spacing.md,
		marginBottom: spacing.lg,
		gap: spacing.xs,
	},
	infoTitle: {
		fontSize: 13,
		fontWeight: "700",
		color: colors.textPrimary,
	},
	infoText: {
		fontSize: 13,
		color: colors.textTertiary,
		lineHeight: 19,
	},
	grid: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 12,
		marginBottom: spacing.lg,
	},
	chip: {
		flexBasis: "47%",
		flexGrow: 1,
		height: 52,
		backgroundColor: colors.surface,
		borderWidth: 2,
		borderColor: colors.borderStrong,
		borderRadius: 8,
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: spacing.sm,
		gap: spacing.sm,
		overflow: "hidden",
	},
	chipSelected: {
		backgroundColor: colors.textPrimary,
		borderColor: colors.textPrimary,
	},
	chipLabel: {
		fontSize: 13,
		fontWeight: "600",
		color: colors.textPrimary,
		flexShrink: 1,
	},
	chipTextSelected: {
		color: colors.surface,
	},
	helperText: {
		fontSize: 13,
		color: colors.textSecondary,
		lineHeight: 18,
	},
	bottomContainer: {
		paddingHorizontal: spacing.lg,
		paddingBottom: spacing.md,
		paddingTop: spacing.sm,
	},
	primaryButton: {
		backgroundColor: colors.textPrimary,
		height: 52,
		borderRadius: 8,
		justifyContent: "center",
		alignItems: "center",
	},
	primaryButtonDisabled: {
		opacity: 0.4,
	},
	primaryButtonPressed: {
		opacity: 0.85,
	},
	primaryButtonText: {
		color: colors.surface,
		fontSize: 14,
		fontWeight: "700",
		letterSpacing: 2,
	},
});
