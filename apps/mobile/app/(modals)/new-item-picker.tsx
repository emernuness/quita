import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, fonts, radius, spacing } from "../../src/theme/tokens";

const OPTIONS = [
	{
		icon: "plus-circle" as const,
		label: "Nova receita",
		subtitle: "Salário, bico, extra ou ajuda",
		route: "/(modals)/new-income" as const,
	},
	{
		icon: "alert-circle" as const,
		label: "Nova dívida",
		subtitle: "Conta em atraso ou parcelamento",
		route: "/(modals)/new-debt" as const,
	},
	{
		icon: "minus-circle" as const,
		label: "Nova despesa",
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

			<Text style={styles.title}>O que você quer{"\n"}adicionar?</Text>
			<Text style={styles.subtitle}>Escolha uma opção abaixo.</Text>

			<View style={styles.optionsList}>
				{OPTIONS.map((opt) => (
					<Pressable
						key={opt.route}
						style={({ pressed }) => [styles.optionPill, pressed && styles.optionPillPressed]}
						onPress={() => handleSelect(opt.route)}
					>
						<Feather
							name={opt.icon}
							size={24}
							color={colors.brandTealDark}
							style={styles.optionIcon}
						/>
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
	safe: {
		flex: 1,
		backgroundColor: colors.surface,
		paddingHorizontal: spacing.xl,
		paddingTop: spacing.md,
		borderTopLeftRadius: radius.lg,
		borderTopRightRadius: radius.lg,
	},
	closeButton: {
		alignSelf: "flex-end",
		marginBottom: spacing.lg,
	},
	title: {
		fontSize: 28,
		fontFamily: fonts.heading,
		color: colors.textPrimary,
		marginBottom: spacing.xs,
		lineHeight: 34,
	},
	subtitle: {
		fontSize: 14,
		fontFamily: fonts.body,
		color: colors.textSecondary,
		marginBottom: spacing.xl,
	},
	optionsList: {
		gap: spacing.sm,
	},
	optionPill: {
		flexDirection: "row",
		alignItems: "center",
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: radius.card,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.md + 2,
		backgroundColor: colors.surface,
		gap: spacing.md,
	},
	optionPillPressed: {
		opacity: 0.85,
	},
	optionIcon: {
		width: 24,
	},
	optionTextContainer: {
		flex: 1,
	},
	optionLabel: {
		fontSize: 15,
		fontFamily: fonts.bodySemiBold,
		color: colors.textPrimary,
	},
	optionSubtitle: {
		fontSize: 12,
		fontFamily: fonts.body,
		color: colors.textSecondary,
		marginTop: 2,
	},
});
