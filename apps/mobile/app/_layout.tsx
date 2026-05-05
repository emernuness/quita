import {
	PlusJakartaSans_400Regular,
	PlusJakartaSans_500Medium,
	PlusJakartaSans_600SemiBold,
	PlusJakartaSans_700Bold,
	useFonts,
} from "@expo-google-fonts/plus-jakarta-sans";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { QueryProvider } from "../src/providers/QueryProvider";
import { useAuthStore } from "../src/stores/auth";

SplashScreen.preventAutoHideAsync().catch(() => {});

function AuthInit() {
	const loadToken = useAuthStore((s) => s.loadToken);

	useEffect(() => {
		loadToken();
	}, [loadToken]);

	return null;
}

export default function RootLayout() {
	const [fontsLoaded] = useFonts({
		PlusJakartaSans_400Regular,
		PlusJakartaSans_500Medium,
		PlusJakartaSans_600SemiBold,
		PlusJakartaSans_700Bold,
	});

	useEffect(() => {
		if (fontsLoaded) {
			SplashScreen.hideAsync().catch(() => {});
		}
	}, [fontsLoaded]);

	if (!fontsLoaded) return null;

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
