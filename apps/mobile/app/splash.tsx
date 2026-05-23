import { colors, fonts, radius, spacing } from "@/theme/tokens";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { Animated, Image, Pressable, StyleSheet, Text, View } from "react-native";

const BG_IMAGES = [
	"https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=1080&q=80&auto=format&fit=crop",
	"https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=1080&q=80&auto=format&fit=crop",
	"https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=1080&q=80&auto=format&fit=crop",
	"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1080&q=80&auto=format&fit=crop",
	"https://images.unsplash.com/photo-1521119989659-a83eee488004?w=1080&q=80&auto=format&fit=crop",
];

const FADE_MS = 1400;
const HOLD_MS = 4200;

export default function SplashScreen() {
	const router = useRouter();
	const opacities = useRef(BG_IMAGES.map((_, i) => new Animated.Value(i === 0 ? 1 : 0))).current;
	const activeIdx = useRef(0);

	useEffect(() => {
		BG_IMAGES.forEach((uri) => Image.prefetch(uri));
	}, []);

	useEffect(() => {
		const interval = setInterval(() => {
			const next = (activeIdx.current + 1) % BG_IMAGES.length;
			Animated.parallel([
				Animated.timing(opacities[activeIdx.current], {
					toValue: 0,
					duration: FADE_MS,
					useNativeDriver: true,
				}),
				Animated.timing(opacities[next], {
					toValue: 1,
					duration: FADE_MS,
					useNativeDriver: true,
				}),
			]).start();
			activeIdx.current = next;
		}, FADE_MS + HOLD_MS);
		return () => clearInterval(interval);
	}, [opacities]);

	return (
		<View style={styles.container}>
			<StatusBar style="light" />

			{BG_IMAGES.map((uri, i) => (
				<Animated.Image
					key={uri}
					source={{ uri }}
					style={[StyleSheet.absoluteFillObject, { opacity: opacities[i] }]}
					resizeMode="cover"
				/>
			))}

			<View pointerEvents="none" style={[StyleSheet.absoluteFillObject, styles.tealOverlay]} />

			<LinearGradient
				pointerEvents="none"
				colors={["rgba(10,82,72,0.55)", "rgba(10,82,72,0.05)", "rgba(13,13,13,0.85)"]}
				locations={[0, 0.45, 1]}
				style={StyleSheet.absoluteFillObject}
			/>

			<LinearGradient
				pointerEvents="none"
				colors={["rgba(13,13,13,0.55)", "rgba(13,13,13,0)", "rgba(13,13,13,0.55)"]}
				locations={[0, 0.5, 1]}
				start={{ x: 0, y: 0.5 }}
				end={{ x: 1, y: 0.5 }}
				style={StyleSheet.absoluteFillObject}
			/>

			<View style={styles.content}>
				<View style={styles.centerContent}>
					<Image
						source={require("../assets/brand/logo-04.png")}
						style={styles.logo}
						resizeMode="contain"
					/>
					<Text style={styles.subtitle}>
						Saia das dívidas sem adiar.{"\n"}Monte seu plano com clareza.
					</Text>
				</View>

				<View style={styles.bottomContainer}>
					<Pressable
						style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
						onPress={() => router.push("/(auth)/register")}
					>
						<Text style={styles.primaryButtonText}>Começar agora</Text>
					</Pressable>

					<Pressable style={styles.linkButton} onPress={() => router.push("/(auth)/login")}>
						<Text style={styles.linkText}>Já tenho conta</Text>
					</Pressable>
				</View>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.brandTealDark,
	},
	tealOverlay: {
		backgroundColor: "rgba(10,82,72,0.55)",
	},
	content: {
		flex: 1,
		justifyContent: "space-between",
		paddingHorizontal: spacing.lg,
		paddingTop: spacing.xxxl,
		paddingBottom: spacing.xxl,
	},
	centerContent: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	logo: {
		width: 220,
		height: 90,
		marginBottom: spacing.lg,
	},
	subtitle: {
		fontSize: 16,
		fontFamily: fonts.bodyMedium,
		color: colors.white,
		textAlign: "center",
		lineHeight: 24,
		opacity: 0.95,
		textShadowColor: "rgba(0,0,0,0.35)",
		textShadowOffset: { width: 0, height: 1 },
		textShadowRadius: 8,
	},
	bottomContainer: {
		gap: spacing.md,
	},
	primaryButton: {
		backgroundColor: colors.accentGreen,
		height: 52,
		paddingHorizontal: 20,
		borderRadius: radius.sm,
		justifyContent: "center",
		alignItems: "center",
		shadowColor: "#000",
		shadowOpacity: 0.25,
		shadowRadius: 12,
		shadowOffset: { width: 0, height: 6 },
		elevation: 4,
	},
	primaryButtonPressed: {
		opacity: 0.88,
	},
	primaryButtonText: {
		color: colors.white,
		fontSize: 15,
		fontFamily: fonts.bodySemiBold,
	},
	linkButton: {
		height: 44,
		justifyContent: "center",
		alignItems: "center",
	},
	linkText: {
		color: colors.white,
		fontSize: 14,
		fontFamily: fonts.bodySemiBold,
		opacity: 0.92,
	},
});
