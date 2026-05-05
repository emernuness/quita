import { colors, fonts, radius, spacing } from "@/theme/tokens";
import { Feather } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import type { ComponentProps } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

type FeatherName = ComponentProps<typeof Feather>["name"];

interface TabConfig {
	name: string;
	title: string;
	icon: FeatherName;
}

const TABS: TabConfig[] = [
	{ name: "index", title: "Início", icon: "home" },
	{ name: "finances", title: "Finanças", icon: "bar-chart-2" },
	{ name: "plan", title: "Plano", icon: "map" },
	{ name: "profile", title: "Perfil", icon: "user" },
];

function CustomTabBar({
	state,
	descriptors,
	navigation,
}: {
	state: { routes: { key: string; name: string }[]; index: number };
	descriptors: Record<
		string,
		{ options: { title?: string; tabBarLabel?: string } }
	>;
	navigation: {
		emit: (args: {
			type: string;
			target: string;
			canPreventDefault: boolean;
		}) => { defaultPrevented: boolean };
		navigate: (name: string) => void;
	};
}) {
	return (
		<View style={styles.tabBarWrapper}>
			<View style={styles.tabBarContainer}>
				{state.routes.map(
					(
						route: { key: string; name: string },
						index: number,
					) => {
						const tab = TABS.find((t) => t.name === route.name);
						if (!tab) return null;

						const isFocused = state.index === index;

						const onPress = () => {
							const event = navigation.emit({
								type: "tabPress",
								target: route.key,
								canPreventDefault: true,
							});

							if (!isFocused && !event.defaultPrevented) {
								navigation.navigate(route.name);
							}
						};

						return (
							<Pressable
								key={route.key}
								onPress={onPress}
								style={[
									styles.tabItem,
									isFocused && styles.tabItemActive,
								]}
								accessibilityRole="button"
								accessibilityState={
									isFocused ? { selected: true } : {}
								}
								accessibilityLabel={tab.title}
							>
								<Feather
									name={tab.icon}
									size={20}
									color={
										isFocused
											? colors.brandTealDark
											: colors.textTertiary
									}
								/>
								<Text
									style={[
										styles.tabLabel,
										isFocused && styles.tabLabelActive,
									]}
								>
									{tab.title}
								</Text>
							</Pressable>
						);
					},
				)}
			</View>
		</View>
	);
}

export default function TabLayout() {
	return (
		<Tabs
			tabBar={(props) => <CustomTabBar {...(props as any)} />}
			screenOptions={{
				headerShown: false,
			}}
		>
			<Tabs.Screen name="index" options={{ title: "Início" }} />
			<Tabs.Screen name="finances" options={{ title: "Finanças" }} />
			<Tabs.Screen name="plan" options={{ title: "Plano" }} />
			<Tabs.Screen name="profile" options={{ title: "Perfil" }} />
		</Tabs>
	);
}

const styles = StyleSheet.create({
	tabBarWrapper: {
		position: "absolute",
		bottom: 0,
		left: 0,
		right: 0,
		backgroundColor: colors.surface,
		borderTopWidth: 0.5,
		borderTopColor: colors.border,
		paddingBottom: Platform.OS === "ios" ? 28 : spacing.md,
		paddingTop: spacing.sm,
		paddingHorizontal: spacing.sm,
	},
	tabBarContainer: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-around",
	},
	tabItem: {
		flexDirection: "column",
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: spacing.sm,
		paddingHorizontal: spacing.md,
		borderRadius: radius.sm,
		gap: spacing.xs,
	},
	tabItemActive: {
		backgroundColor: "transparent",
	},
	tabLabel: {
		fontFamily: fonts.bodyMedium,
		fontSize: 12,
		color: colors.textTertiary,
	},
	tabLabelActive: {
		color: colors.brandTealDark,
		fontFamily: fonts.bodySemiBold,
	},
});
