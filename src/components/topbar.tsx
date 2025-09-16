"use client";
import {useEffect} from "react";

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
} from "lucide-react";

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
    activeTool : string,
    setActiveTool : (tool:string) => void
}

export default function Topbar({activeTool,setActiveTool}:TopbarProps) {

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
					eachTool.name === "Eraser" ? num === 0 : num === i + 1
				);

				if (tool) {
					setActiveTool(tool.name);
				}
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);

	return (
		<div className="flex justify-center bg-[#232329] w-max mx-auto rounded-md mt-3 p-2 pr-4 gap-4 z-10 relative">
			{starterTools.map((eachTool, i) => {
				const Icon = eachTool.icon;
				const index = eachTool.name === "Eraser" ? 0 : i + 1; //to add the subscript to each icon so that users can type instead of clicking, cant have users typing two digits thats why only 0 for 10th index icon
				const isActive = activeTool === eachTool.name;

				return (
					<button
						key={eachTool.name}
						title={eachTool.name} //gives description on hover
						onClick={() => {
							setActiveTool(eachTool.name);
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
		</div>
	);
}
