import { Stack } from "expo-router";
import { colors } from "../../src/theme/tokens";

export default function OnboardingLayout() {
	return (
		<Stack
			screenOptions={{
				headerShown: false,
				contentStyle: { backgroundColor: colors.background },
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
