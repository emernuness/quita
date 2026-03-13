import { colors } from "@/theme/tokens";
import { StyleSheet, Text, View } from "react-native";

export default function DebtDetailScreen() {
	return (
		<View style={styles.container}>
			<Text style={styles.title}>Detalhes da Dívida</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.background,
		justifyContent: "center",
		alignItems: "center",
	},
	title: { fontSize: 24, color: colors.textPrimary },
});
