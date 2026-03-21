"use client";
import {useEffect, useRef, useState} from "react";
import Image from "next/image";

import {
	Hand,
	SquareMousePointer,
	ArrowRight,
	Minus,
	RectangleHorizontal,
	Type as TypingTool,
	Pen,
	Circle,
	Image as ImagePickerTool,
	Eraser,
	LogOut,
} from "lucide-react";

import Share from "./share";
import {useSession, signOut} from "next-auth/react";

type Tool = {
	name: string;
	icon: React.ElementType;
};

const starterTools: Tool[] = [
	{name: "Hand or panning tool", icon: Hand},
	{name: "Selection", icon: SquareMousePointer},
	{name: "Arrow", icon: ArrowRight},
	{name: "Line", icon: Minus},
	{name: "Rectangle", icon: RectangleHorizontal},
	{name: "Text", icon: TypingTool},
	{name: "Draw", icon: Pen},
	{name: "Circle", icon: Circle},
	{name: "Insert image", icon: ImagePickerTool},
	{name: "Eraser", icon: Eraser},
];

interface TopbarProps {
	activeTool: string;
	setActiveTool: (tool: string) => void;
	onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function Topbar({
	activeTool,
	setActiveTool,
	onImageUpload,
}: TopbarProps) {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [dropdownOpen, setDropdownOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const {data: session} = useSession();

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Ignore if typing in input, textarea, or editable content
			const target = e.target as HTMLElement;
			if (
				target.tagName === "INPUT" ||
				target.tagName === "TEXTAREA" ||
				target.isContentEditable
			) {
				return;
			}

			// Only digits 0–9
			if (/^[0-9]$/.test(e.key)) {
				const num = parseInt(e.key, 10);

				// Find the tool with that index
				const tool = starterTools.find((eachTool, i) =>
					eachTool.name === "Eraser" ? num === 0 : num === i + 1,
				);

				if (tool) {
					if (tool.name === "Insert image") {
						fileInputRef.current?.click();
					} else {
						setActiveTool(tool.name);
					}
				}
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(e.target as Node)
			) {
				setDropdownOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	return (
		<div className="flex justify-center bg-[#232329] w-max mx-auto rounded-md mt-3 p-2 pr-4 gap-4">
			<input
				ref={fileInputRef}
				type="file"
				accept="image/*,.gif"
				onChange={onImageUpload}
				style={{display: "none"}}
			/>
			{starterTools.map((eachTool, i) => {
				const Icon = eachTool.icon;
				const index = eachTool.name === "Eraser" ? 0 : i + 1; //to add the subscript to each icon so that users can type instead of clicking, cant have users typing two digits thats why only 0 for 10th index icon
				const isActive = activeTool === eachTool.name;

				return (
					<button
						key={eachTool.name}
						title={eachTool.name} //gives description on hover
						onClick={() => {
							// If it's the image tool, trigger the file input
							if (eachTool.name === "Insert image") {
								fileInputRef.current?.click();
							} else {
								setActiveTool(eachTool.name);
							}
						}}
						className={`rounded-md relative flex p-1.5 transition-colors ${
							isActive
								? "bg-blue-500 text-white"
								: "hover:bg-gray-700 text-gray-200"
						}`}
					>
						<Icon />
						<span className="absolute bottom-0 right-0 text-xs ">{index}</span>
					</button>
				);
			})}

			<div className="justify-center w-px h-6 bg-gray-600 m-1.5 mr-0" />

			<Share />

			{/* Profile avatar + dropdown */}
			<div className="relative" ref={dropdownRef}>
				<button
					onClick={() => setDropdownOpen((prev) => !prev)}
					className="relative flex p-1.5 rounded-md hover:bg-gray-700 transition-colors"
					title={session?.user?.name ?? "Account"}
				>
					{session?.user?.image ? (
						<Image
							src={session.user.image}
							alt="avatar"
							width={24}
							height={24}
							className="rounded-full object-cover"
						/>
					) : (
						<div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold">
							{session?.user?.name?.[0] ?? "?"}
						</div>
					)}
				</button>

				{dropdownOpen && (
					<div className="absolute right-0 mt-2 w-52 bg-[#2e2e35] rounded-lg shadow-xl border border-gray-700 py-2 z-50">
						<div className="px-4 py-2 border-b border-gray-700">
							<p className="text-white text-sm font-medium truncate">
								{session?.user?.name}
							</p>
							<p className="text-gray-400 text-xs truncate">
								{session?.user?.email}
							</p>
						</div>
						<button
							onClick={() => signOut()}
							className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors mt-1"
						>
							<LogOut size={14} />
							Sign out
						</button>
					</div>
				)}
			</div>
		</div>
	);
}
