import { colors } from "@/theme/tokens";
import { StyleSheet, Text, View } from "react-native";

export default function DebtsListScreen() {
	return (
		<View style={styles.container}>
			<Text style={styles.title}>Minhas Dívidas</Text>
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
