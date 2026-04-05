import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { colors, spacing } from "@/theme/tokens";

export default function SplashScreen() {
	const router = useRouter();

	return (
		<View style={styles.container}>
			{/* Center Content */}
			<View style={styles.centerContent}>
				<Text style={styles.logo}>QUITA</Text>
				<Text style={styles.subtitle}>
					Saia das dívidas sem adiar.{"\n"}Monte seu plano com clareza.
				</Text>
			</View>

			{/* Bottom Buttons */}
			<View style={styles.bottomContainer}>
				<Pressable
					style={({ pressed }) => [
						styles.primaryButton,
						pressed && styles.primaryButtonPressed,
					]}
					onPress={() => router.push("/(auth)/register")}
				>
					<Text style={styles.primaryButtonText}>COMEÇAR AGORA</Text>
				</Pressable>

				<Pressable
					style={styles.linkButton}
					onPress={() => router.push("/(auth)/login")}
				>
					<Text style={styles.linkText}>JÁ TENHO CONTA</Text>
				</Pressable>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#0A0A0A",
		justifyContent: "space-between",
		paddingHorizontal: spacing.lg,
		paddingTop: spacing.xxl,
		paddingBottom: spacing.xxl,
	},
	centerContent: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	logo: {
		fontSize: 48,
		fontWeight: "800",
		color: "#FFFFFF",
		textAlign: "center",
		marginBottom: spacing.md,
	},
	subtitle: {
		fontSize: 16,
		fontWeight: "500",
		color: "rgba(255,255,255,0.7)",
		textAlign: "center",
		lineHeight: 24,
	},
	bottomContainer: {
		gap: spacing.md,
	},
	primaryButton: {
		backgroundColor: "#FFFFFF",
		height: 52,
		justifyContent: "center",
		alignItems: "center",
	},
	primaryButtonPressed: {
		opacity: 0.85,
	},
	primaryButtonText: {
		color: "#0A0A0A",
		fontSize: 11,
		fontWeight: "600",
		letterSpacing: 1,
		textTransform: "uppercase",
	},
	linkButton: {
		height: 44,
		justifyContent: "center",
		alignItems: "center",
	},
	linkText: {
		color: "#FFFFFF",
		fontSize: 11,
		fontWeight: "600",
		letterSpacing: 3,
		textTransform: "uppercase",
	},
});
