import { Button } from "@/components/Button";
import { colors, fonts, radius, spacing } from "@/theme/tokens";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import type { ComponentProps } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useProfile } from "../../../src/hooks/useProfile";
import { useAuthStore } from "../../../src/stores/auth";

type FeatherName = ComponentProps<typeof Feather>["name"];

interface MenuItem {
	icon: FeatherName;
	label: string;
	route?: string;
	danger?: boolean;
}

const MENU_ITEMS: MenuItem[] = [
	{ icon: "bell", label: "Notificações", route: "/(tabs)/profile/notifications" },
	{ icon: "shield", label: "Segurança e biometria", route: "/(tabs)/profile/security" },
	{ icon: "eye-off", label: "Modo discreto", route: "/(tabs)/profile/discrete-mode" },
	{ icon: "download", label: "Exportar meus dados", route: "/(tabs)/profile/export-data" },
	{ icon: "trash-2", label: "Apagar minha conta", danger: true },
];

export default function ProfileScreen() {
	const router = useRouter();
	const { user, logout } = useAuthStore();
	const { data: profile } = useProfile();

	const displayName = profile?.name ?? user?.name ?? "Usuário";
	const displayPhone = profile?.phone ?? user?.phone ?? "";
	const displayInitials =
		profile?.avatarInitials ?? user?.avatarInitials ?? displayName.slice(0, 2).toUpperCase();

	const handleMenuPress = (item: MenuItem) => {
		if (item.danger) {
			Alert.alert(
				"Apagar minha conta",
				"Tem certeza que deseja apagar sua conta? Essa ação não pode ser desfeita.",
				[
					{ text: "Cancelar", style: "cancel" },
					{ text: "Apagar", style: "destructive", onPress: () => {} },
				],
			);
			return;
		}
		if (item.route) {
			router.push(item.route as never);
		}
	};

	const handleLogout = async () => {
		await logout();
		router.replace("/");
	};

	return (
		<SafeAreaView style={styles.safe} edges={["top"]}>
			<ScrollView
				style={styles.scroll}
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
			>
				{/* Avatar */}
				<View style={styles.avatarSection}>
					<View style={styles.avatar}>
						<Text style={styles.avatarText}>{displayInitials}</Text>
					</View>
					<Text style={styles.name}>{displayName}</Text>
					<Text style={styles.phone}>{displayPhone}</Text>
				</View>

				{/* Settings Section */}
				<Text style={styles.sectionLabel}>Configurações</Text>
				<View style={styles.menuCard}>
					{MENU_ITEMS.map((item, index) => (
						<View key={item.label}>
							<Pressable style={styles.menuItem} onPress={() => handleMenuPress(item)}>
								<View style={styles.menuLeft}>
									<Feather
										name={item.icon}
										size={20}
										color={item.danger ? colors.dangerRed : colors.textPrimary}
									/>
									<Text style={[styles.menuLabel, item.danger && styles.menuLabelDanger]}>
										{item.label}
									</Text>
								</View>
								<Feather
									name="chevron-right"
									size={20}
									color={item.danger ? colors.dangerRed : colors.textTertiary}
								/>
							</Pressable>
							{index < MENU_ITEMS.length - 1 && <View style={styles.separator} />}
						</View>
					))}
				</View>

				{/* Logout Button */}
				<Pressable style={styles.logoutButton} onPress={handleLogout}>
					<Feather name="log-out" size={20} color={colors.dangerRed} />
					<Text style={styles.logoutText}>Sair</Text>
				</Pressable>

				{/* Premium Card */}
				<View style={styles.premiumCard}>
					<View style={styles.premiumHeader}>
						<View style={styles.premiumBadge}>
							<Text style={styles.premiumBadgeText}>Premium</Text>
						</View>
						<Text style={styles.premiumPrice}>R$ 9,90/mês</Text>
					</View>
					<Text style={styles.premiumDescription}>
						Desbloqueie simulações ilimitadas, plano personalizado pela IA, alertas inteligentes e
						suporte prioritário.
					</Text>
					<Button
						variant="primary"
						label="Assinar agora"
						onPress={() => {}}
						style={styles.premiumButton}
					/>
				</View>

				{/* Disclaimer */}
				<Text style={styles.disclaimer}>
					QUITA v1.0 · Feito no Brasil{"\n"}
					Seus dados são criptografados e nunca compartilhados.
				</Text>

				<View style={{ height: 120 }} />
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
		paddingHorizontal: spacing.xl,
		paddingTop: spacing.xl,
	},
	avatarSection: {
		alignItems: "center",
		marginBottom: spacing.xl,
	},
	avatar: {
		width: 80,
		height: 80,
		borderRadius: radius.full,
		backgroundColor: colors.brandNavy,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: spacing.md,
	},
	avatarText: {
		fontFamily: fonts.heading,
		fontSize: 28,
		color: colors.white,
	},
	name: {
		fontFamily: fonts.heading,
		fontSize: 22,
		color: colors.textPrimary,
		textAlign: "center",
		marginBottom: spacing.xs,
	},
	phone: {
		fontFamily: fonts.body,
		fontSize: 14,
		color: colors.textSecondary,
		textAlign: "center",
	},
	sectionLabel: {
		fontFamily: fonts.bodySemiBold,
		fontSize: 14,
		color: colors.textSecondary,
		marginBottom: spacing.md,
	},
	menuCard: {
		backgroundColor: colors.surface,
		borderRadius: radius.card,
		borderWidth: 0.5,
		borderColor: colors.border,
		marginBottom: spacing.xl,
	},
	menuItem: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingVertical: spacing.lg,
		paddingHorizontal: spacing.lg,
	},
	menuLeft: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.md,
	},
	menuLabel: {
		fontFamily: fonts.body,
		fontSize: 14,
		color: colors.textPrimary,
	},
	menuLabelDanger: {
		color: colors.dangerRed,
	},
	separator: {
		height: 0.5,
		backgroundColor: colors.border,
		marginHorizontal: spacing.lg,
	},
	logoutButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: spacing.sm,
		paddingVertical: spacing.md,
		marginBottom: spacing.xl,
		borderWidth: 1,
		borderColor: colors.dangerRed,
		borderRadius: radius.sm,
	},
	logoutText: {
		fontFamily: fonts.bodySemiBold,
		fontSize: 14,
		color: colors.dangerRed,
	},
	premiumCard: {
		backgroundColor: colors.brandNavy,
		borderRadius: radius.card,
		padding: spacing.lg,
		marginBottom: spacing.lg,
	},
	premiumHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: spacing.md,
	},
	premiumBadge: {
		backgroundColor: "rgba(255,255,255,0.15)",
		borderRadius: radius.pill,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.xs,
	},
	premiumBadgeText: {
		fontFamily: fonts.bodySemiBold,
		fontSize: 12,
		color: colors.white,
	},
	premiumPrice: {
		fontFamily: fonts.bodySemiBold,
		fontSize: 15,
		color: "rgba(255,255,255,0.7)",
	},
	premiumDescription: {
		fontFamily: fonts.body,
		fontSize: 14,
		color: "rgba(255,255,255,0.7)",
		lineHeight: 22,
		marginBottom: spacing.lg,
	},
	premiumButton: {
		marginTop: 0,
	},
	disclaimer: {
		fontFamily: fonts.body,
		fontSize: 12,
		color: colors.textSecondary,
		textAlign: "center",
		lineHeight: 20,
	},
});
