import { colors, spacing } from "@/theme/tokens";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const OPTIONS = [
	{
		icon: "plus-circle" as const,
		label: "NOVA RECEITA",
		subtitle: "Salario, bico, extra ou ajuda",
		route: "/(modals)/new-income" as const,
	},
	{
		icon: "alert-circle" as const,
		label: "NOVA DIVIDA",
		subtitle: "Conta em atraso ou parcelamento",
		route: "/(modals)/new-debt" as const,
	},
	{
		icon: "minus-circle" as const,
		label: "NOVA DESPESA",
		subtitle: "Gasto fixo, recorrente ou avulso",
		route: "/(modals)/new-expense" as const,
	},
] as const;

export default function NewItemPickerModal() {
	const router = useRouter();

	const handleSelect = (route: string) => {
		router.back();
		setTimeout(() => router.push(route as any), 300);
	};

	return (
		<SafeAreaView style={styles.safe}>
			{/* Close Button */}
			<Pressable style={styles.closeButton} onPress={() => router.back()} hitSlop={12}>
				<Feather name="x" size={20} color={colors.textPrimary} />
			</Pressable>

			<Text style={styles.title}>O que voce quer{"\n"}adicionar?</Text>
			<Text style={styles.subtitle}>Escolha uma opcao abaixo.</Text>

			<View style={styles.optionsList}>
				{OPTIONS.map((opt) => (
					<Pressable
						key={opt.route}
						style={({ pressed }) => [styles.optionPill, pressed && styles.optionPillPressed]}
						onPress={() => handleSelect(opt.route)}
					>
						<Feather name={opt.icon} size={24} color={colors.textPrimary} style={styles.optionIcon} />
						<View style={styles.optionTextContainer}>
							<Text style={styles.optionLabel}>{opt.label}</Text>
							<Text style={styles.optionSubtitle}>{opt.subtitle}</Text>
						</View>
						<Feather name="chevron-right" size={20} color={colors.textSecondary} />
					</Pressable>
				))}
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
	closeButton: { alignSelf: "flex-end", marginBottom: spacing.lg },
	title: { fontSize: 28, fontWeight: "800", color: colors.textPrimary, marginBottom: spacing.xs, lineHeight: 34 },
	subtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: spacing.xl },
	optionsList: { gap: spacing.sm },
	optionPill: {
		flexDirection: "row",
		alignItems: "center",
		borderWidth: 2,
		borderColor: colors.borderStrong,
		borderRadius: 8,
		paddingHorizontal: spacing.md,
		paddingVertical: 14,
		backgroundColor: colors.surface,
		gap: spacing.md,
	},
	optionPillPressed: { opacity: 0.85 },
	optionIcon: { width: 24 },
	optionTextContainer: { flex: 1 },
	optionLabel: { fontSize: 13, fontWeight: "700", color: colors.textPrimary, letterSpacing: 1 },
	optionSubtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
});
