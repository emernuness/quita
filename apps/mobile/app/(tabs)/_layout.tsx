import { colors } from "@/theme/tokens";
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
											? "#FFFFFF"
											: colors.textSecondary
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
		alignItems: "center",
		paddingBottom: Platform.OS === "ios" ? 28 : 12,
		paddingTop: 12,
		paddingHorizontal: 21,
	},
	tabBarContainer: {
		flexDirection: "row",
		backgroundColor: colors.surface,
		borderRadius: 200,
		borderWidth: 1,
		borderColor: colors.border,
		paddingVertical: 4,
		paddingHorizontal: 4,
		alignItems: "center",
		justifyContent: "center",
	},
	tabItem: {
		flexDirection: "column",
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 8,
		paddingHorizontal: 18,
		borderRadius: 200,
		gap: 2,
	},
	tabItemActive: {
		backgroundColor: colors.textPrimary,
	},
	tabLabel: {
		fontSize: 10,
		fontWeight: "600",
		letterSpacing: 1,
		color: colors.textSecondary,
		textTransform: "uppercase",
	},
	tabLabelActive: {
		color: "#FFFFFF",
	},
});
