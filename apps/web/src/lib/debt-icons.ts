import {
	AlertCircle,
	Briefcase,
	CreditCard,
	Home,
	type LucideIcon,
	MoreHorizontal,
	Users,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
	"credit-card": CreditCard,
	briefcase: Briefcase,
	"alert-circle": AlertCircle,
	home: Home,
	users: Users,
	"more-horizontal": MoreHorizontal,
};

export function getDebtCategoryIcon(name: string | null | undefined): LucideIcon {
	if (!name) return MoreHorizontal;
	return ICON_MAP[name] ?? MoreHorizontal;
}
