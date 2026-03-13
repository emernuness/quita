import { Stack } from "expo-router";

export default function ModalsLayout() {
	return (
		<Stack screenOptions={{ headerShown: false, presentation: "modal" }}>
			<Stack.Screen name="pay-debt" />
			<Stack.Screen name="new-income" />
			<Stack.Screen name="new-expense" />
		</Stack>
	);
}
