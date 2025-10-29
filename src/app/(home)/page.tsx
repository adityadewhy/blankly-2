"use client";
import {useState} from "react";

import dynamic from "next/dynamic";
import Topbar from "@/components/topbar";

// Dynamically import CanvasComponent, disable SSR
const CanvasComponent = dynamic(() => import("@/components/canvasComponent"), {
	ssr: false,
});
export default function Home() {
	const [activeTool, setActiveTool] = useState("Rectangle");
	return (
		<div className="relative w-full h-screen">
			<div className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
				<div className="pointer-events-auto">
					<Topbar activeTool={activeTool} setActiveTool={setActiveTool} />
				</div>
			</div>
			<CanvasComponent activeTool={activeTool} />
		</div>
	);
}
