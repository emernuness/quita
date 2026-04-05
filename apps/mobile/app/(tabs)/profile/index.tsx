import { colors, spacing } from "@/theme/tokens";
import { Feather } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../../src/stores/auth";
import { useProfile } from "../../../src/hooks/useProfile";

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
	const displayInitials = profile?.avatarInitials ?? user?.avatarInitials ?? displayName.slice(0, 2).toUpperCase();

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
				<Text style={styles.sectionLabel}>CONFIGURAÇÕES</Text>
				<View style={styles.menuCard}>
					{MENU_ITEMS.map((item, index) => (
						<View key={item.label}>
							<Pressable
								style={styles.menuItem}
								onPress={() => handleMenuPress(item)}
							>
								<View style={styles.menuLeft}>
									<Feather
										name={item.icon}
										size={20}
										color={item.danger ? colors.dangerRed : colors.textPrimary}
									/>
									<Text
										style={[
											styles.menuLabel,
											item.danger && styles.menuLabelDanger,
										]}
									>
										{item.label}
									</Text>
								</View>
								<Feather
									name="chevron-right"
									size={20}
									color={item.danger ? colors.dangerRed : colors.textSecondary}
								/>
							</Pressable>
							{index < MENU_ITEMS.length - 1 && (
								<View style={styles.separator} />
							)}
						</View>
					))}
				</View>

				{/* Logout Button */}
				<Pressable style={styles.logoutButton} onPress={handleLogout}>
					<Feather name="log-out" size={20} color={colors.dangerRed} />
					<Text style={styles.logoutText}>SAIR</Text>
				</Pressable>

				{/* Premium Card */}
				<View style={styles.premiumCard}>
					<View style={styles.premiumHeader}>
						<View style={styles.premiumBadge}>
							<Text style={styles.premiumBadgeText}>
								PREMIUM
							</Text>
						</View>
						<Text style={styles.premiumPrice}>R$ 9,90/mês</Text>
					</View>
					<Text style={styles.premiumDescription}>
						Desbloqueie simulações ilimitadas, plano personalizado
						pela IA, alertas inteligentes e suporte prioritário.
					</Text>
					<Pressable style={styles.premiumButton}>
						<Text style={styles.premiumButtonText}>
							ASSINAR AGORA
						</Text>
					</Pressable>
				</View>

				{/* Disclaimer */}
				<Text style={styles.disclaimer}>
					QUITA v1.0 · Feito com 💙 no Brasil{"\n"}
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
		paddingHorizontal: spacing.lg,
		paddingTop: spacing.xl,
	},
	avatarSection: {
		alignItems: "center",
		marginBottom: spacing.xl,
	},
	avatar: {
		width: 80,
		height: 80,
		borderRadius: 40,
		backgroundColor: colors.textPrimary,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 12,
	},
	avatarText: {
		fontSize: 28,
		fontWeight: "800",
		color: "#FFFFFF",
	},
	name: {
		fontSize: 22,
		fontWeight: "800",
		color: colors.textPrimary,
		textAlign: "center",
		marginBottom: 4,
	},
	phone: {
		fontSize: 14,
		color: colors.textSecondary,
		textAlign: "center",
	},
	sectionLabel: {
		fontSize: 11,
		fontWeight: "600",
		letterSpacing: 3,
		color: colors.textSecondary,
		textTransform: "uppercase",
		marginBottom: 12,
	},
	menuCard: {
		backgroundColor: colors.surface,
		borderRadius: 12,
		padding: 4,
		marginBottom: spacing.xl,
	},
	menuItem: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingVertical: 14,
		paddingHorizontal: 14,
	},
	menuLeft: {
		flexDirection: "row",
		alignItems: "center",
		gap: 14,
	},
	menuLabel: {
		fontSize: 15,
		fontWeight: "600",
		color: colors.textPrimary,
	},
	menuLabelDanger: {
		color: colors.dangerRed,
	},
	separator: {
		height: 1,
		backgroundColor: colors.border,
		marginHorizontal: 14,
	},
	logoutButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		paddingVertical: 14,
		marginBottom: spacing.xl,
		borderWidth: 1,
		borderColor: colors.dangerRed,
		borderRadius: 12,
	},
	logoutText: {
		fontSize: 14,
		fontWeight: "700",
		letterSpacing: 2,
		color: colors.dangerRed,
	},
	premiumCard: {
		backgroundColor: colors.textPrimary,
		borderRadius: 12,
		padding: 20,
		marginBottom: spacing.lg,
	},
	premiumHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: 12,
	},
	premiumBadge: {
		backgroundColor: "rgba(255,255,255,0.15)",
		borderRadius: 100,
		paddingHorizontal: 10,
		paddingVertical: 4,
	},
	premiumBadgeText: {
		fontSize: 12,
		fontWeight: "700",
		color: "#FFFFFF",
		letterSpacing: 2,
	},
	premiumPrice: {
		fontSize: 15,
		fontWeight: "700",
		color: "rgba(255,255,255,0.7)",
	},
	premiumDescription: {
		fontSize: 14,
		color: "rgba(255,255,255,0.7)",
		lineHeight: 22,
		marginBottom: 16,
	},
	premiumButton: {
		backgroundColor: "#FFFFFF",
		borderRadius: 12,
		paddingVertical: 14,
		alignItems: "center",
	},
	premiumButtonText: {
		fontSize: 14,
		fontWeight: "700",
		letterSpacing: 2,
		color: colors.textPrimary,
	},
	disclaimer: {
		fontSize: 12,
		color: colors.textSecondary,
		textAlign: "center",
		lineHeight: 20,
	},
});
