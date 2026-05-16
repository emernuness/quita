import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Base({ size = 20, children, ...rest }: IconProps & { children: React.ReactNode }) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={1.7}
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
			focusable="false"
			{...rest}
		>
			{children}
		</svg>
	);
}

export const HomeIcon = (p: IconProps) => (
	<Base {...p}>
		<path d="M3 11.5 12 4l9 7.5" />
		<path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
	</Base>
);

export const BarsIcon = (p: IconProps) => (
	<Base {...p}>
		<path d="M5 20V10" />
		<path d="M12 20V4" />
		<path d="M19 20v-7" />
	</Base>
);

export const MapIcon = (p: IconProps) => (
	<Base {...p}>
		<path d="m9 4-6 2v14l6-2 6 2 6-2V4l-6 2z" />
		<path d="M9 4v14" />
		<path d="M15 6v14" />
	</Base>
);

export const UserIcon = (p: IconProps) => (
	<Base {...p}>
		<circle cx="12" cy="8" r="4" />
		<path d="M4 20c1.5-4 5-6 8-6s6.5 2 8 6" />
	</Base>
);

export const BellIcon = (p: IconProps) => (
	<Base {...p}>
		<path d="M6 8a6 6 0 0 1 12 0c0 6 3 7 3 7H3s3-1 3-7" />
		<path d="M10 21a2 2 0 0 0 4 0" />
	</Base>
);

export const PlusIcon = (p: IconProps) => (
	<Base {...p}>
		<path d="M12 5v14" />
		<path d="M5 12h14" />
	</Base>
);

export const CheckIcon = (p: IconProps) => (
	<Base {...p}>
		<path d="m5 12 5 5L20 7" />
	</Base>
);

export const XIcon = (p: IconProps) => (
	<Base {...p}>
		<path d="M6 6l12 12" />
		<path d="M18 6 6 18" />
	</Base>
);

export const ArrowLeftIcon = (p: IconProps) => (
	<Base {...p}>
		<path d="M19 12H5" />
		<path d="m12 19-7-7 7-7" />
	</Base>
);

export const ArrowRightIcon = (p: IconProps) => (
	<Base {...p}>
		<path d="M5 12h14" />
		<path d="m12 5 7 7-7 7" />
	</Base>
);

export const ChevronRightIcon = (p: IconProps) => (
	<Base {...p}>
		<path d="m9 6 6 6-6 6" />
	</Base>
);

export const EyeIcon = (p: IconProps) => (
	<Base {...p}>
		<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
		<circle cx="12" cy="12" r="3" />
	</Base>
);

export const EyeOffIcon = (p: IconProps) => (
	<Base {...p}>
		<path d="M3 3l18 18" />
		<path d="M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a16 16 0 0 1-3.4 4.4" />
		<path d="M6.2 6.2A16 16 0 0 0 2 12s3.5 7 10 7c1.6 0 3-.3 4.3-.8" />
		<path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
	</Base>
);

export const LockIcon = (p: IconProps) => (
	<Base {...p}>
		<rect x="4" y="11" width="16" height="9" rx="2" />
		<path d="M8 11V8a4 4 0 0 1 8 0v3" />
	</Base>
);

export const TrendingDownIcon = (p: IconProps) => (
	<Base {...p}>
		<path d="m3 7 7 7 4-4 7 7" />
		<path d="M21 17v-5h-5" />
	</Base>
);

export const TrendingUpIcon = (p: IconProps) => (
	<Base {...p}>
		<path d="m3 17 7-7 4 4 7-7" />
		<path d="M21 7v5h-5" />
	</Base>
);

export const SearchIcon = (p: IconProps) => (
	<Base {...p}>
		<circle cx="11" cy="11" r="7" />
		<path d="m20 20-3.5-3.5" />
	</Base>
);

export const SettingsIcon = (p: IconProps) => (
	<Base {...p}>
		<circle cx="12" cy="12" r="3" />
		<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09c0 .66.39 1.26 1 1.51a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.25.61.85 1 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
	</Base>
);

export const LogOutIcon = (p: IconProps) => (
	<Base {...p}>
		<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
		<path d="M16 17l5-5-5-5" />
		<path d="M21 12H9" />
	</Base>
);

export const TrashIcon = (p: IconProps) => (
	<Base {...p}>
		<path d="M3 6h18" />
		<path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
		<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
	</Base>
);

export const EditIcon = (p: IconProps) => (
	<Base {...p}>
		<path d="M12 20h9" />
		<path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" />
	</Base>
);

export const FileTextIcon = (p: IconProps) => (
	<Base {...p}>
		<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
		<path d="M14 3v6h6" />
		<path d="M8 13h8" />
		<path d="M8 17h8" />
	</Base>
);

export const ShieldIcon = (p: IconProps) => (
	<Base {...p}>
		<path d="M12 3 4 6v6c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V6z" />
	</Base>
);
