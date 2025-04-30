// next/src/features/table-management/types/seatmap.ts

export type SeatType = "table" | "booth" | "area" | "decor" | "bar_seat" | "service";
export type SeatShape = "circle" | "ellipse" | "rect" | "longrect";
export type SeatStatus = "available" | "blocked" | "reserved" | "occupied" | "maintenance";

export interface SeatMapItem {
	id: string;
	label: string;
	type: SeatType;
	shape: SeatShape;
	x: number;
	y: number;
	width: number;
	height: number;
	rotation: number; // Rotation angle in degrees
	status: SeatStatus;
	metadata: {
		color?: string; // Optional color override
		capacity?: number;
		description?: string;
		isReservable?: boolean;
	};
}

// Optional: Define a type for the onSelect handler prop
export type SeatSelectHandler = (item: SeatMapItem) => void;
