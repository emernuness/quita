import { Redirect } from 'expo-router';

export default function Index() {
	// TODO: Check auth state and onboarding status
	// For now, redirect to auth login
	const isAuthenticated = false;
	const hasCompletedOnboarding = false;

	if (!isAuthenticated) {
		return <Redirect href="/(auth)/login" />;
	}

	if (!hasCompletedOnboarding) {
		return <Redirect href="/(onboarding)/income" />;
	}

	return <Redirect href="/(tabs)" />;
}
