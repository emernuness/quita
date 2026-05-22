import { Feather } from "@expo/vector-icons";
import { onboardingDebtCategoriesSchema } from "@quita/shared";
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
import { Button } from "../../src/components";
import { useDebtCategories } from "../../src/hooks/useDebts";
import { useSaveCategories } from "../../src/hooks/useOnboarding";
import { colors, fonts, radius, spacing } from "../../src/theme/tokens";
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
			const categoryError =
				result.errors.categoryIds ||
				Object.entries(result.errors).find(([k]) => k.startsWith("categoryIds"))?.[1] ||
				"Selecione pelo menos uma categoria";
			setError(categoryError);
			return;
		}

		saveCategories.mutate(result.data, {
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
		});
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
				<Text style={styles.stepIndicator}>Passo 3 de 4 · escolha tudo que faz sentido hoje</Text>

				<Pressable style={styles.backButton} onPress={() => router.back()} hitSlop={12}>
					<Feather name="arrow-left" size={16} color={colors.textPrimary} />
					<Text style={styles.backText}>Voltar</Text>
				</Pressable>

				<Text style={styles.stepLabel}>Mapeamento de dívidas</Text>

				<Text style={styles.title}>Pra quem você deve hoje?</Text>

				<Text style={styles.subtitle}>
					Selecione as categorias que representam suas dívidas atuais. Você vai detalhar cada uma no
					próximo passo.
				</Text>

				<View style={styles.infoBox}>
					<Text style={styles.infoTitle}>Por que separar por categoria?</Text>
					<Text style={styles.infoText}>
						Cada tipo de dívida tem uma estratégia diferente. Cartão cobra juros altos, empréstimo
						pode ser renegociado, e dívida com pessoa conhecida precisa de conversa. Separar ajuda a
						priorizar.
					</Text>
				</View>

				<View style={styles.grid}>
					{isLoadingCategories ? (
						<ActivityIndicator
							color={colors.textSecondary}
							style={{ marginVertical: spacing.lg }}
						/>
					) : !categories?.length ? (
						<Text style={styles.emptyText}>
							Não foi possível carregar as categorias. Tente novamente.
						</Text>
					) : (
						categories.map(({ id, icon, name }) => {
							const isSelected = selected.has(id);
							return (
								<Pressable
									key={id}
									style={[styles.chip, isSelected && styles.chipSelected]}
									onPress={() => toggleCategory(id)}
								>
									<Feather
										name={icon as React.ComponentProps<typeof Feather>["name"]}
										size={18}
										color={isSelected ? colors.white : colors.textPrimary}
									/>
									<Text
										style={[styles.chipLabel, isSelected && styles.chipTextSelected]}
										numberOfLines={1}
									>
										{name}
									</Text>
								</Pressable>
							);
						})
					)}
				</View>

				{error ? <Text style={styles.errorText}>{error}</Text> : null}

				<Text style={styles.helperText}>
					Não se preocupe se esqueceu alguma. Você pode adicionar depois.
				</Text>
			</ScrollView>

			<View style={styles.bottomContainer}>
				<Button
					variant="primary"
					label="Continuar"
					onPress={handleContinue}
					loading={saveCategories.isPending}
					disabled={saveCategories.isPending}
				/>
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
		backgroundColor: colors.accentGreen,
	},
	scrollContent: {
		paddingHorizontal: spacing.xl,
		paddingTop: spacing.lg,
		paddingBottom: spacing.xl,
	},
	stepIndicator: {
		fontSize: 13,
		fontFamily: fonts.body,
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
		fontSize: 13,
		fontFamily: fonts.bodySemiBold,
		color: colors.textPrimary,
	},
	stepLabel: {
		fontSize: 13,
		fontFamily: fonts.bodySemiBold,
		color: colors.brandTealDark,
		marginBottom: spacing.sm,
	},
	title: {
		fontSize: 26,
		fontFamily: fonts.heading,
		color: colors.textPrimary,
		marginBottom: spacing.md,
	},
	subtitle: {
		fontSize: 14,
		fontFamily: fonts.body,
		color: colors.textSecondary,
		lineHeight: 22,
		marginBottom: spacing.lg,
	},
	infoBox: {
		backgroundColor: colors.infoBackground,
		borderRadius: radius.card,
		padding: spacing.md,
		marginBottom: spacing.lg,
		gap: spacing.xs,
	},
	infoTitle: {
		fontSize: 13,
		fontFamily: fonts.bodySemiBold,
		color: colors.brandTealDark,
	},
	infoText: {
		fontSize: 13,
		fontFamily: fonts.body,
		color: colors.textSecondary,
		lineHeight: 19,
	},
	grid: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: spacing.md,
		marginBottom: spacing.lg,
	},
	chip: {
		flexBasis: "47%",
		flexGrow: 1,
		height: 52,
		backgroundColor: colors.surface,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: radius.sm,
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: spacing.md,
		gap: spacing.sm,
		overflow: "hidden",
	},
	chipSelected: {
		backgroundColor: colors.brandTealDark,
		borderColor: colors.brandTealDark,
	},
	chipLabel: {
		fontSize: 13,
		fontFamily: fonts.bodySemiBold,
		color: colors.textPrimary,
		flexShrink: 1,
	},
	chipTextSelected: {
		color: colors.white,
	},
	emptyText: {
		fontSize: 14,
		fontFamily: fonts.body,
		color: colors.textSecondary,
		textAlign: "center",
		marginVertical: spacing.lg,
	},
	errorText: {
		fontSize: 12,
		fontFamily: fonts.body,
		color: colors.dangerRed,
		marginBottom: spacing.sm,
	},
	helperText: {
		fontSize: 13,
		fontFamily: fonts.body,
		color: colors.textSecondary,
		lineHeight: 18,
	},
	bottomContainer: {
		paddingHorizontal: spacing.lg,
		paddingBottom: spacing.md,
		paddingTop: spacing.sm,
	},
});
