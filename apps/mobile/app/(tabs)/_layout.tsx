import { Tabs } from 'expo-router';
import { colors } from '@/theme/tokens';

export default function TabLayout() {
	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				tabBarActiveTintColor: colors.accentBlue,
				tabBarInactiveTintColor: colors.textSecondary,
				tabBarStyle: {
					backgroundColor: colors.surface,
					borderTopColor: colors.border,
				},
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: 'Home',
				}}
			/>
			<Tabs.Screen
				name="debts"
				options={{
					title: 'Dívidas',
				}}
			/>
			<Tabs.Screen
				name="plan"
				options={{
					title: 'Plano',
				}}
			/>
			<Tabs.Screen
				name="finances"
				options={{
					title: 'Finanças',
				}}
			/>
			<Tabs.Screen
				name="profile"
				options={{
					title: 'Perfil',
				}}
			/>
		</Tabs>
	);
}
