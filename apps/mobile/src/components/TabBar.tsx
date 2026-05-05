import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts, radius, spacing } from "../theme/tokens";

interface TabItem {
	name: string;
	label: string;
	icon: keyof typeof Feather.glyphMap;
}

const TABS: TabItem[] = [
	{ name: "index", label: "Início", icon: "home" },
	{ name: "finances", label: "Finanças", icon: "dollar-sign" },
	{ name: "plan", label: "Plano", icon: "target" },
	{ name: "profile", label: "Perfil", icon: "user" },
];

interface CustomTabBarProps {
	state: {
		index: number;
		routes: Array<{ key: string; name: string }>;
	};
	navigation: {
		navigate: (name: string) => void;
		emit: (event: {
			type: string;
			target: string;
			canPreventDefault: boolean;
		}) => {
			defaultPrevented: boolean;
		};
	};
}

export function CustomTabBar({ state, navigation }: CustomTabBarProps) {
	const insets = useSafeAreaInsets();

	return (
		<View
			style={[
				styles.wrapper,
				{ paddingBottom: Math.max(insets.bottom, spacing.sm) },
			]}
		>
			<View style={styles.container}>
				{TABS.map((tab, index) => {
					const isActive = state.index === index;
					const routeKey = state.routes[index]?.key;

					return (
						<Pressable
							key={tab.name}
							onPress={() => {
								if (routeKey) {
									const event = navigation.emit({
										type: "tabPress",
										target: routeKey,
										canPreventDefault: true,
									});
									if (!event.defaultPrevented) {
										navigation.navigate(tab.name);
									}
								}
							}}
							style={[styles.tab, isActive ? styles.tabActive : undefined]}
						>
							<Feather
								name={tab.icon}
								size={18}
								color={isActive ? colors.brandTealDark : colors.textSecondary}
							/>
							<Text
								style={[
									styles.tabLabel,
									isActive ? styles.tabLabelActive : undefined,
								]}
							>
								{tab.label}
							</Text>
						</Pressable>
					);
				})}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	wrapper: {
		position: "absolute",
		bottom: 0,
		left: 0,
		right: 0,
		backgroundColor: colors.surface,
		borderTopWidth: 0.5,
		borderTopColor: colors.border,
		paddingHorizontal: spacing.md,
	},
	container: {
		flexDirection: "row",
		paddingVertical: spacing.sm,
		gap: spacing.xs,
	},
	tab: {
		flex: 1,
		flexDirection: "column",
		alignItems: "center",
		justifyContent: "center",
		gap: 4,
		paddingVertical: spacing.sm,
		paddingHorizontal: spacing.sm,
		borderRadius: radius.sm,
	},
	tabActive: {
		backgroundColor: "transparent",
	},
	tabLabel: {
		fontSize: 12,
		fontFamily: fonts.bodyMedium,
		color: colors.textSecondary,
	},
	tabLabelActive: {
		color: colors.brandTealDark,
		fontFamily: fonts.bodySemiBold,
	},
});
