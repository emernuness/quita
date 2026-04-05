import { Stack } from "expo-router";

export default function ProfileLayout() {
	return (
		<Stack screenOptions={{ headerShown: false }}>
			<Stack.Screen name="index" />
			<Stack.Screen name="notifications" />
			<Stack.Screen name="security" />
			<Stack.Screen name="discrete-mode" />
			<Stack.Screen name="export-data" />
			<Stack.Screen name="export-requested" />
		</Stack>
	);
}
