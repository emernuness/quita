import React from "react";
import {
	Alert,
	Pressable,
	ScrollView,
	StyleSheet,
	Switch,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { colors, fonts, radius, spacing } from "@/theme/tokens";
import {
	useNotificationPrefs,
	useUpdateNotificationPrefs,
} from "../../../src/hooks/useProfile";

type NotificationPrefKey =
	| "dueDates"
	| "weeklyProgress"
	| "paymentIncentive"
	| "riskAlert"
	| "newsAndTips";

interface NotificationSetting {
	key: NotificationPrefKey;
	title: string;
	subtitle: string;
	defaultValue: boolean;
}

const NOTIFICATION_SETTINGS: NotificationSetting[] = [
	{
		key: "dueDates",
		title: "Vencimento de contas",
		subtitle: "5 dias antes do vencimento",
		defaultValue: true,
	},
	{
		key: "weeklyProgress",
		title: "Progresso semanal",
		subtitle: "Toda segunda-feira",
		defaultValue: true,
	},
	{
		key: "paymentIncentive",
		title: "Incentivo no dia do pagamento",
		subtitle: "Lembrete pra marcar como pago",
		defaultValue: true,
	},
	{
		key: "riskAlert",
		title: "Alerta de risco no plano",
		subtitle: "Se seus gastos passarem do previsto",
		defaultValue: false,
	},
	{
		key: "newsAndTips",
		title: "Novidades e dicas",
		subtitle: "Acordos, renegociações e novidades.",
		defaultValue: false,
	},
];

export default function NotificationsScreen() {
	const router = useRouter();
	const { data: prefs } = useNotificationPrefs();
	const updatePrefs = useUpdateNotificationPrefs();

	const getSettingValue = (key: NotificationPrefKey, defaultValue: boolean): boolean => {
		if (!prefs) return defaultValue;
		return prefs[key] ?? defaultValue;
	};

	const toggleSetting = (key: NotificationPrefKey) => {
		const currentValue = getSettingValue(
			key,
			NOTIFICATION_SETTINGS.find((s) => s.key === key)?.defaultValue ?? false,
		);
		updatePrefs.mutate(
			{ [key]: !currentValue },
			{
				onError: () =>
					Alert.alert("Erro", "Não foi possível atualizar a preferência."),
			},
		);
	};

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
				<Text style={styles.title}>Notificações</Text>

				{/* Subtitle */}
				<Text style={styles.subtitle}>
					Escolha o que quer receber no celular.
				</Text>

				{/* Toggle Rows */}
				{NOTIFICATION_SETTINGS.map((item) => (
					<View key={item.key} style={styles.toggleRow}>
						<View style={{ flex: 1 }}>
							<Text style={styles.toggleTitle}>{item.title}</Text>
							<Text style={styles.toggleSubtitle}>{item.subtitle}</Text>
						</View>
						<Switch
							value={getSettingValue(item.key, item.defaultValue)}
							onValueChange={() => toggleSetting(item.key)}
							trackColor={{ false: colors.border, true: colors.accentGreen }}
							thumbColor={colors.white}
							disabled={updatePrefs.isPending}
						/>
					</View>
				))}

				{/* Info Card */}
				<View style={styles.infoCard}>
					<Text style={styles.infoCardText}>
						Notificações de vencimento são exclusivas para assinantes Premium.
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
	toggleRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingVertical: spacing.md,
		borderBottomWidth: 0.5,
		borderBottomColor: colors.border,
	},
	toggleTitle: {
		fontFamily: fonts.bodySemiBold,
		fontSize: 16,
		color: colors.textPrimary,
		marginBottom: 2,
	},
	toggleSubtitle: {
		fontFamily: fonts.body,
		fontSize: 13,
		color: colors.textSecondary,
	},
	infoCard: {
		backgroundColor: colors.infoBackground,
		padding: spacing.md,
		borderRadius: radius.card,
		marginTop: spacing.xl,
	},
	infoCardText: {
		fontFamily: fonts.body,
		fontSize: 13,
		color: colors.brandTealDark,
		lineHeight: 19,
	},
});
