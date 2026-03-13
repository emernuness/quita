import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/theme/tokens';

export default function ExpensesScreen() {
	return (
		<View style={styles.container}>
			<Text style={styles.title}>Gastos Mensais</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.background,
		justifyContent: 'center',
		alignItems: 'center',
	},
	title: { fontSize: 24, color: colors.textPrimary },
});
