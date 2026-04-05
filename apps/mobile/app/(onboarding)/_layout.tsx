import { Stack } from "expo-router";

export default function OnboardingLayout() {
	return (
		<Stack
			screenOptions={{
				headerShown: false,
				contentStyle: { backgroundColor: "#FAFAFA" },
				animation: "slide_from_right",
			}}
		>
			<Stack.Screen name="income" />
			<Stack.Screen name="categories" />
			<Stack.Screen name="debt-detail" />
			<Stack.Screen name="expenses" />
		</Stack>
	);
}
