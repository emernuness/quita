import { Stack } from "expo-router";
import { colors } from "../../src/theme/tokens";

export default function ModalsLayout() {
	return (
		<Stack
			screenOptions={{
				headerShown: false,
				presentation: "modal",
				contentStyle: { backgroundColor: colors.surface },
			}}
		>
			<Stack.Screen name="pay-debt" />
			<Stack.Screen name="new-item-picker" />
			<Stack.Screen name="new-income" />
			<Stack.Screen name="new-expense" />
			<Stack.Screen name="new-debt" />
			<Stack.Screen name="payment-confirmed" />
			<Stack.Screen name="critical" />
			<Stack.Screen name="celebration" />
			<Stack.Screen name="blue-mode" />
		</Stack>
	);
}
