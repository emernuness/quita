import { colors } from "@/theme/tokens";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuthStore } from "../src/stores/auth";

export default function Index() {
	const { isAuthenticated, isLoading, user } = useAuthStore();

	if (isLoading) {
		return (
			<View
				style={{
					flex: 1,
					justifyContent: "center",
					alignItems: "center",
					backgroundColor: colors.background,
				}}
			>
				<ActivityIndicator size="large" color={colors.textPrimary} />
			</View>
		);
	}

	if (!isAuthenticated) {
		return <Redirect href="/splash" />;
	}

	if (!user?.onboardingCompleted) {
		const step = user?.onboardingStep ?? 0;
		if (step >= 3) {
			return <Redirect href="/(onboarding)/expenses" />;
		}
		if (step >= 1) {
			// Steps 1-2: income done, categories next (or re-select before debt-detail)
			return <Redirect href="/(onboarding)/categories" />;
		}
		return <Redirect href="/(onboarding)/income" />;
	}

	return <Redirect href="/(tabs)" />;
}
