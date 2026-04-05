import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { QueryProvider } from "../src/providers/QueryProvider";
import { useAuthStore } from "../src/stores/auth";

function AuthInit() {
	const loadToken = useAuthStore((s) => s.loadToken);

	useEffect(() => {
		loadToken();
	}, [loadToken]);

	return null;
}

export default function RootLayout() {
	return (
		<QueryProvider>
			<AuthInit />
			<StatusBar style="dark" />
			<Stack screenOptions={{ headerShown: false }}>
				<Stack.Screen name="splash" />
				<Stack.Screen name="(auth)" />
				<Stack.Screen name="(onboarding)" />
				<Stack.Screen name="(tabs)" />
				<Stack.Screen name="(modals)" options={{ presentation: "modal" }} />
			</Stack>
		</QueryProvider>
	);
}
