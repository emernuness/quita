import { colors, spacing } from "@/theme/tokens";
import { Feather } from "@expo/vector-icons";
import { formatBRL } from "@quita/shared";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
	ActivityIndicator,
	LayoutAnimation,
	Platform,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	UIManager,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDebts } from "../../../src/hooks/useDebts";
import { useExpenses, useFinancialSummary, useIncomes } from "../../../src/hooks/useFinancial";

// --- Android LayoutAnimation ---
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
	UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- Types ---
type ItemTypeFilter = "all" | "debts" | "incomes" | "expenses";
type SortOrder = "dueDate" | "amount" | "name";

interface SectionItem {
	id: string;
	type: "debt" | "income" | "expense";
	name: string;
	amount: number;
	detail: string;
	frequency: string;
	dueDate: string | null;
	rawId: string;
}

interface Section {
	key: string;
	title: string;
	total: number;
	color: string;
	items: SectionItem[];
}

// --- Constants ---
const TYPE_FILTER_OPTIONS: { key: ItemTypeFilter; label: string }[] = [
	{ key: "all", label: "TUDO" },
	{ key: "debts", label: "DIVIDAS" },
	{ key: "incomes", label: "RECEITAS" },
	{ key: "expenses", label: "DESPESAS" },
];

const STATUS_FILTER_OPTIONS = [
	{ key: "overdue", label: "ATRASADA" },
	{ key: "on_time", label: "EM DIA" },
	{ key: "renegotiated", label: "NEGOCIANDO" },
	{ key: "paid", label: "QUITADA" },
];

const SORT_OPTIONS: { key: SortOrder; label: string }[] = [
	{ key: "dueDate", label: "VENCIMENTO" },
	{ key: "amount", label: "VALOR" },
	{ key: "name", label: "NOME" },
];

const STATUS_LABELS: Record<string, string> = {
	on_time: "Em dia",
	overdue: "Atrasada",
	renegotiated: "Negociando",
	paid: "Quitada",
};

const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
	housing: "Moradia",
	bills: "Contas",
	food: "Alimentacao",
	transport: "Transporte",
	telecom: "Internet",
	other: "Outros",
};

const TYPE_LABELS: Record<string, string> = {
	fixed: "Fixa",
	one_time: "Pontual",
	recurring: "Recorrente",
};

const FREQUENCY_LABELS: Record<string, string> = {
	fixed: "Mensal",
	one_time: "Avulsa",
	recurring: "Recorrente",
};

function formatCompact(value: number): string {
	const abs = Math.abs(value);
	const sign = value < 0 ? "-" : "";
	if (abs >= 1_000_000) {
		const v = Math.floor((abs / 1_000_000) * 10) / 10;
		const str = v % 1 === 0 ? v.toFixed(0) : v.toFixed(1).replace(".", ",");
		return `${sign}R$ ${str}M`;
	}
	if (abs >= 1_000) {
		const v = Math.floor((abs / 1_000) * 10) / 10;
		const str = v % 1 === 0 ? v.toFixed(0) : v.toFixed(1).replace(".", ",");
		return `${sign}R$ ${str}k`;
	}
	return `${sign}R$ ${abs.toFixed(0)}`;
}

function animateLayout() {
	LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
}

// --- Component ---
export default function FinancesScreen() {
	const router = useRouter();

	// Data hooks
	const { data: debts, isLoading: debtsLoading } = useDebts();
	const { data: incomes, isLoading: incomesLoading } = useIncomes();
	const { data: expenses, isLoading: expensesLoading } = useExpenses();
	const { data: summary } = useFinancialSummary();

	// Month navigation
	const [selectedMonth, setSelectedMonth] = useState(() => new Date());

	// Filters
	const [showFilters, setShowFilters] = useState(false);
	const [typeFilter, setTypeFilter] = useState<ItemTypeFilter>("all");
	const [statusFilter, setStatusFilter] = useState<string | null>(null);
	const [sortBy, setSortBy] = useState<SortOrder>("dueDate");

	const isLoading = debtsLoading || incomesLoading || expensesLoading;

	const monthLabel = useMemo(() => {
		const label = selectedMonth.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
		return label.charAt(0).toUpperCase() + label.slice(1);
	}, [selectedMonth]);

	const goToPrevMonth = useCallback(() => {
		setSelectedMonth((prev) => {
			const d = new Date(prev);
			d.setMonth(d.getMonth() - 1);
			return d;
		});
	}, []);

	const goToNextMonth = useCallback(() => {
		setSelectedMonth((prev) => {
			const d = new Date(prev);
			d.setMonth(d.getMonth() + 1);
			return d;
		});
	}, []);

	const isInSelectedMonth = useCallback(
		(dateStr: string | null): boolean => {
			if (!dateStr) return true;
			const d = new Date(dateStr);
			return d.getMonth() === selectedMonth.getMonth() && d.getFullYear() === selectedMonth.getFullYear();
		},
		[selectedMonth],
	);

	// Active filter count
	const activeFilterCount = useMemo(() => {
		let count = 0;
		if (typeFilter !== "all") count++;
		if (statusFilter) count++;
		if (sortBy !== "dueDate") count++;
		return count;
	}, [typeFilter, statusFilter, sortBy]);

	const clearFilters = useCallback(() => {
		animateLayout();
		setTypeFilter("all");
		setStatusFilter(null);
		setSortBy("dueDate");
	}, []);

	const toggleFilters = useCallback(() => {
		animateLayout();
		setShowFilters((prev) => !prev);
	}, []);

	// Build grouped sections
	const sections = useMemo(() => {
		const result: Section[] = [];

		const sortItems = (items: SectionItem[]) => {
			return [...items].sort((a, b) => {
				if (sortBy === "amount") return b.amount - a.amount;
				if (sortBy === "name") return a.name.localeCompare(b.name, "pt-BR");
				// dueDate
				if (!a.dueDate && !b.dueDate) return 0;
				if (!a.dueDate) return 1;
				if (!b.dueDate) return -1;
				return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
			});
		};

		// --- Dividas ---
		if (typeFilter === "all" || typeFilter === "debts") {
			const items: SectionItem[] = [];
			for (const debt of debts ?? []) {
				if (!isInSelectedMonth(debt.dueDate)) continue;
				if (statusFilter && debt.status !== statusFilter) continue;
				const remaining = (debt.totalAmount ?? 0) - (debt.amountPaid ?? 0);
				const categoryName = (debt as any).category?.name ?? "";
				const duePart = debt.dueDate
					? `Vence ${new Date(debt.dueDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}`
					: "";
				items.push({
					id: `debt-${debt.id}`,
					type: "debt",
					name: debt.creditor,
					amount: remaining,
					detail: [categoryName, duePart].filter(Boolean).join(" \u00B7 "),
					frequency: STATUS_LABELS[debt.status] ?? debt.status,
					dueDate: debt.dueDate,
					rawId: debt.id,
				});
			}
			if (items.length > 0) {
				result.push({
					key: "debts",
					title: "Dividas",
					total: items.reduce((s, i) => s + i.amount, 0),
					color: colors.dangerRed,
					items: sortItems(items),
				});
			}
		}

		// --- Receitas ---
		if (typeFilter === "all" || typeFilter === "incomes") {
			const items: SectionItem[] = [];
			for (const income of incomes ?? []) {
				if (!isInSelectedMonth(income.dueDate)) continue;
				const typeLabel = TYPE_LABELS[income.type] ?? income.type;
				const duePart = income.dueDate
					? `Dia ${new Date(income.dueDate).getDate().toString().padStart(2, "0")}`
					: "";
				items.push({
					id: `income-${income.id}`,
					type: "income",
					name: income.name,
					amount: income.amount,
					detail: [duePart, typeLabel].filter(Boolean).join(" \u00B7 "),
					frequency: FREQUENCY_LABELS[income.type] ?? income.type,
					dueDate: income.dueDate,
					rawId: income.id,
				});
			}
			if (items.length > 0) {
				result.push({
					key: "incomes",
					title: "Receitas",
					total: items.reduce((s, i) => s + i.amount, 0),
					color: colors.successGreen,
					items: sortItems(items),
				});
			}
		}

		// --- Despesas ---
		if (typeFilter === "all" || typeFilter === "expenses") {
			const items: SectionItem[] = [];
			for (const expense of expenses ?? []) {
				if (!isInSelectedMonth(expense.dueDate)) continue;
				const typeLabel = TYPE_LABELS[expense.type] ?? expense.type;
				const duePart = expense.dueDate
					? `Dia ${new Date(expense.dueDate).getDate().toString().padStart(2, "0")}`
					: "";
				items.push({
					id: `expense-${expense.id}`,
					type: "expense",
					name: expense.name,
					amount: expense.amount,
					detail: [duePart, typeLabel].filter(Boolean).join(" \u00B7 "),
					frequency: FREQUENCY_LABELS[expense.type] ?? expense.type,
					dueDate: expense.dueDate,
					rawId: expense.id,
				});
			}
			if (items.length > 0) {
				result.push({
					key: "expenses",
					title: "Despesas",
					total: items.reduce((s, i) => s + i.amount, 0),
					color: colors.dangerRed,
					items: sortItems(items),
				});
			}
		}

		return result;
	}, [debts, incomes, expenses, typeFilter, statusFilter, sortBy, isInSelectedMonth]);

	const totalItems = sections.reduce((s, sec) => s + sec.items.length, 0);

	return (
		<SafeAreaView style={styles.safe} edges={["top"]}>
			<ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
				{/* ═══ Header ═══ */}
				<View style={styles.headerRow}>
					<View style={styles.headerLeft}>
						<Text style={styles.title}>Minhas{"\n"}Financas</Text>
						<Text style={styles.subtitle}>Veja entradas e saidas de qualquer mes</Text>
					</View>
					<View style={styles.headerButtons}>
						<Pressable style={styles.filterHeaderButton} onPress={toggleFilters}>
							<Feather name="sliders" size={12} color={colors.textSecondary} />
							<Text style={styles.filterHeaderButtonText}>FILTROS</Text>
						</Pressable>
						<Pressable
							style={styles.headerButton}
							onPress={() => router.push("/(modals)/new-item-picker")}
						>
							<Text style={styles.headerButtonText}>+ NOVA</Text>
						</Pressable>
					</View>
				</View>

				{/* ═══ Summary Boxes ═══ */}
				<View style={styles.summaryRow}>
					<View style={[styles.summaryBox, { borderLeftColor: colors.successGreen }]}>
						<Text style={styles.summaryLabel}>ENTROU</Text>
						<Text style={[styles.summaryValue, { color: colors.successGreen }]} numberOfLines={1}>
							{formatCompact(summary?.totalIncome ?? 0)}
						</Text>
					</View>
					<View style={[styles.summaryBox, { borderLeftColor: colors.dangerRed }]}>
						<Text style={styles.summaryLabel}>SAIU</Text>
						<Text style={[styles.summaryValue, { color: colors.dangerRed }]} numberOfLines={1}>
							{formatCompact(summary?.totalExpenses ?? 0)}
						</Text>
					</View>
					<View
						style={[
							styles.summaryBox,
							{
								borderLeftColor:
									(summary?.available ?? 0) >= 0 ? colors.successGreen : colors.dangerRed,
							},
						]}
					>
						<Text style={styles.summaryLabel}>SOBROU</Text>
						<Text
							style={[
								styles.summaryValue,
								{ color: (summary?.available ?? 0) >= 0 ? colors.successGreen : colors.dangerRed },
							]}
							numberOfLines={1}
						>
							{formatCompact(summary?.available ?? 0)}
						</Text>
					</View>
				</View>

				{/* ═══ Sobra pra Dividas ═══ */}
				<View style={styles.debtSurplusCard}>
					<View style={styles.debtSurplusLeft}>
						<Text style={styles.debtSurplusLabel}>SOBRA PRA DIVIDAS</Text>
						<Text style={styles.debtSurplusValue}>
							{formatCompact(summary?.available ?? 0)}/mes
						</Text>
					</View>
					<Feather name="trending-up" size={24} color={colors.successGreen} />
				</View>

				{/* ═══ Expandable Filters ═══ */}
				{showFilters && (
					<View style={styles.filtersContainer}>
						{/* Type */}
						<View style={styles.filterSection}>
							<Text style={styles.filterLabel}>TIPO</Text>
							<View style={styles.filterPillRow}>
								{TYPE_FILTER_OPTIONS.map((opt) => (
									<Pressable
										key={opt.key}
										style={[styles.filterPill, typeFilter === opt.key && styles.filterPillSelected]}
										onPress={() => {
											setTypeFilter(opt.key);
											if (opt.key !== "all" && opt.key !== "debts") setStatusFilter(null);
										}}
									>
										<Text
											style={[styles.filterPillText, typeFilter === opt.key && styles.filterPillTextSelected]}
										>
											{opt.label}
										</Text>
									</Pressable>
								))}
							</View>
						</View>

						{/* Status (debt-only) */}
						{(typeFilter === "all" || typeFilter === "debts") && (
							<View style={styles.filterSection}>
								<Text style={styles.filterLabel}>SITUACAO</Text>
								<View style={styles.filterPillRow}>
									{STATUS_FILTER_OPTIONS.map((opt) => (
										<Pressable
											key={opt.key}
											style={[styles.filterPill, statusFilter === opt.key && styles.filterPillSelected]}
											onPress={() => setStatusFilter(statusFilter === opt.key ? null : opt.key)}
										>
											<Text
												style={[
													styles.filterPillText,
													statusFilter === opt.key && styles.filterPillTextSelected,
												]}
											>
												{opt.label}
											</Text>
										</Pressable>
									))}
								</View>
							</View>
						)}

						{/* Sort */}
						<View style={styles.filterSection}>
							<Text style={styles.filterLabel}>ORDENAR POR</Text>
							<View style={styles.filterPillRow}>
								{SORT_OPTIONS.map((opt) => (
									<Pressable
										key={opt.key}
										style={[styles.filterPill, sortBy === opt.key && styles.filterPillSelected]}
										onPress={() => setSortBy(opt.key)}
									>
										<Text style={[styles.filterPillText, sortBy === opt.key && styles.filterPillTextSelected]}>
											{opt.label}
										</Text>
									</Pressable>
								))}
							</View>
						</View>

						{/* Clear filters */}
						{activeFilterCount > 0 && (
							<Pressable onPress={clearFilters} style={styles.clearFiltersButton}>
								<Text style={styles.clearFiltersText}>Limpar filtros</Text>
							</Pressable>
						)}
					</View>
				)}

				{/* ═══ Month Navigator ═══ */}
				<View style={styles.monthNav}>
					<Pressable style={styles.monthArrow} onPress={goToPrevMonth} hitSlop={8}>
						<Feather name="chevron-left" size={20} color={colors.textPrimary} />
					</Pressable>
					<Text style={styles.monthText}>{monthLabel}</Text>
					<Pressable style={styles.monthArrow} onPress={goToNextMonth} hitSlop={8}>
						<Feather name="chevron-right" size={20} color={colors.textPrimary} />
					</Pressable>
				</View>

				{/* ═══ Sections ═══ */}
				{isLoading ? (
					<View style={styles.emptyContainer}>
						<ActivityIndicator size="large" color={colors.accentBlue} />
					</View>
				) : totalItems === 0 ? (
					<View style={styles.emptyContainer}>
						<Text style={styles.emptyText}>
							{activeFilterCount > 0 ? "Nenhum item encontrado com esses filtros" : "Nenhum item cadastrado"}
						</Text>
					</View>
				) : (
					sections.map((section) => (
						<View key={section.key} style={styles.sectionContainer}>
							{/* Section Header */}
							<View style={[styles.sectionHeader, { borderBottomColor: section.color }]}>
								<Text style={styles.sectionTitle}>{section.title}</Text>
								<Text style={[styles.sectionTotal, { color: section.color }]}>
									{formatBRL(section.total)}
								</Text>
							</View>

							{/* Section Items */}
							{section.items.map((item) => (
								<Pressable
									key={item.id}
									style={styles.itemRow}
									onPress={
										item.type === "debt"
											? () => router.push(`/(tabs)/finances/${item.rawId}`)
											: undefined
									}
								>
									<View style={styles.itemLeft}>
										<Text style={styles.itemName}>{item.name}</Text>
										{item.detail ? <Text style={styles.itemDetail}>{item.detail}</Text> : null}
									</View>
									<View style={styles.itemRight}>
										<Text style={[styles.itemAmount, { color: section.color }]}>
											{formatBRL(item.amount)}
										</Text>
										<Text style={styles.itemFrequency}>{item.frequency}</Text>
									</View>
								</Pressable>
							))}
						</View>
					))
				)}

				<View style={{ height: 120 }} />
			</ScrollView>
		</SafeAreaView>
	);
}

// --- Styles ---
const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: colors.background },
	scroll: { flex: 1 },
	content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },

	// Header
	headerRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-start",
		marginBottom: spacing.lg,
	},
	headerLeft: { flex: 1 },
	title: { fontSize: 28, fontWeight: "800", color: colors.textPrimary, lineHeight: 34 },
	subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: spacing.xs },
	headerButtons: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs },
	filterHeaderButton: {
		borderRadius: 100,
		paddingHorizontal: 14,
		paddingVertical: 8,
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		borderWidth: 1,
		borderColor: colors.border,
		backgroundColor: colors.surface,
	},
	filterHeaderButtonText: { fontSize: 11, fontWeight: "700", letterSpacing: 2, color: colors.textSecondary },
	headerButton: {
		backgroundColor: colors.textPrimary,
		borderRadius: 100,
		paddingHorizontal: 14,
		paddingVertical: 8,
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
	},
	headerButtonText: { fontSize: 11, fontWeight: "700", letterSpacing: 2, color: "#FFFFFF" },

	// Month Navigator
	monthNav: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingVertical: 4,
		marginBottom: spacing.sm,
	},
	monthArrow: { width: 28, height: 28, alignItems: "center", justifyContent: "center" },
	monthText: { fontSize: 14, fontWeight: "700", color: colors.textPrimary },

	// Summary Boxes (left colored border + thin gray border)
	summaryRow: { flexDirection: "row", gap: 8, marginBottom: spacing.sm },
	summaryBox: {
		flex: 1,
		backgroundColor: colors.surface,
		borderWidth: 1,
		borderColor: colors.border,
		borderLeftWidth: 4,
		paddingHorizontal: 12,
		paddingVertical: 12,
	},
	summaryLabel: {
		fontSize: 11,
		fontWeight: "600",
		letterSpacing: 2,
		color: colors.textSecondary,
		textTransform: "uppercase",
		marginBottom: 4,
	},
	summaryValue: { fontSize: 20, fontWeight: "800" },

	// Sobra pra Dividas (dark card)
	debtSurplusCard: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		backgroundColor: colors.textPrimary,
		paddingHorizontal: spacing.md,
		paddingVertical: 14,
		marginBottom: spacing.md,
	},
	debtSurplusLeft: { flex: 1 },
	debtSurplusLabel: {
		fontSize: 11,
		fontWeight: "600",
		letterSpacing: 2,
		color: colors.textSecondary,
		textTransform: "uppercase",
		marginBottom: 4,
	},
	debtSurplusValue: { fontSize: 22, fontWeight: "800", color: "#FFFFFF" },

	// Filter actions
	clearFiltersButton: { alignSelf: "flex-end" },
	clearFiltersText: { fontSize: 12, fontWeight: "500", color: colors.accentBlue },

	// Expandable Filters
	filtersContainer: {
		backgroundColor: colors.surface,
		borderWidth: 1,
		borderColor: colors.border,
		padding: spacing.md,
		gap: spacing.md,
		marginBottom: spacing.md,
	},
	filterSection: { gap: spacing.xs },
	filterLabel: {
		fontSize: 10,
		fontWeight: "600",
		letterSpacing: 2,
		color: colors.textSecondary,
		textTransform: "uppercase",
	},
	filterPillRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
	filterPill: {
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 100,
		borderWidth: 1,
		borderColor: colors.border,
		backgroundColor: colors.background,
	},
	filterPillSelected: { backgroundColor: colors.textPrimary, borderColor: colors.textPrimary },
	filterPillText: { fontSize: 11, fontWeight: "600", color: colors.textSecondary },
	filterPillTextSelected: { color: "#FFFFFF" },

	// Sections
	emptyContainer: { paddingVertical: spacing.xl, alignItems: "center" },
	emptyText: { fontSize: 14, color: colors.textSecondary },

	sectionContainer: { marginBottom: spacing.lg },
	sectionHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingBottom: spacing.sm,
		borderBottomWidth: 2,
	},
	sectionTitle: { fontSize: 20, fontWeight: "800", fontStyle: "italic", color: colors.textPrimary },
	sectionTotal: { fontSize: 16, fontWeight: "700" },

	// Item rows (prototype: 53px, separator line at top)
	itemRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingVertical: 12,
		borderTopWidth: 1,
		borderTopColor: colors.border,
	},
	itemLeft: { flex: 1, marginRight: spacing.sm },
	itemName: { fontSize: 15, fontWeight: "600", color: colors.textPrimary, marginBottom: 2 },
	itemDetail: { fontSize: 12, color: colors.textSecondary },
	itemRight: { alignItems: "flex-end" },
	itemAmount: { fontSize: 15, fontWeight: "700", marginBottom: 2 },
	itemFrequency: { fontSize: 12, color: colors.textSecondary },
});
