"use client";
import {useState} from "react";

import dynamic from "next/dynamic";
import Topbar from "@/components/topbar";

interface UploadedImage {
	id: string;
	src: string;
	name: string;
}

// Dynamically import CanvasComponent, disable SSR
const CanvasComponent = dynamic(() => import("@/components/canvasComponent"), {
	ssr: false,
});
export default function Home() {
	const [activeTool, setActiveTool] = useState("Rectangle");
	const [images, setImages] = useState<UploadedImage[]>([]);

	const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) {
			return;
		}

		const reader = new FileReader();
		reader.onload = () => {
			setImages((prev) => [
				...prev,
				{
					id: crypto.randomUUID(),
					src: reader.result as string,
					name: file.name,
				},
			]);
		};
		reader.readAsDataURL(file);

		e.target.value = "";
	};

	return (
		<div className="relative w-full h-screen">
			<div className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
				<div className="pointer-events-auto">
					<Topbar
						activeTool={activeTool}
						setActiveTool={setActiveTool}
						onImageUpload={handleImageUpload}
					/>
				</div>
			</div>
			<CanvasComponent activeTool={activeTool} images={images} />
		</div>
	);
}
