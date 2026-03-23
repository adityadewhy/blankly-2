"use client";
import {useEffect, useState} from "react";

import dynamic from "next/dynamic";
import Topbar from "@/components/topbar";
import {useSession, signIn} from "next-auth/react";
import {saveCanvasState} from "@/utils/canvasStorage";

interface UploadedImage {
	id: string;
	src: string;
	name: string;
}

// Dynamically import CanvasComponent, disable SSR
const CanvasComponent = dynamic(() => import("@/components/canvasComponent"), {
	ssr: false,
});

type CloudPromptStatus = "checking" | "prompt" | "done";

export default function Home() {
	const {data: session, status} = useSession();
	const [activeTool, setActiveTool] = useState("Rectangle");
	const [images, setImages] = useState<UploadedImage[]>([]);

	const [cloudPrompt, setCloudPrompt] = useState<CloudPromptStatus>("checking");
	const [cloudTimestamp, setCloudTimestamp] = useState<number | null>(null);

	useEffect(() => {
		if (status !== "authenticated") return;

		const checkCloud = async () => {
			try {
				const res = await fetch("/api/canvas");
				if (!res.ok) {
					setCloudPrompt("done");
					return;
				}

				const data = await res.json();
				if (data.found && data.state) {
					const parsed =
						typeof data.state === "string"
							? JSON.parse(data.state)
							: data.state;
					setCloudTimestamp(parsed.timestamp ?? null);
					setCloudPrompt("prompt");
				} else {
					setCloudPrompt("done");
				}
			} catch {
				setCloudPrompt("done");
			}
		};
		checkCloud();
	}, [status]);

	const handleLoadCloud = async () => {
		try {
			const res = await fetch("/api/canvas");
			const data = await res.json();

			if (data.found && data.state) {
				const parsed =
					typeof data.state === "string" ? JSON.parse(data.state) : data.state;

				await saveCanvasState({
					shapes: parsed.shapes || [],
					textArray: parsed.textArray || [],
					konvaImages: [],
					timestamp: parsed.timestamp ?? Date.now(),
				});
			}
		} catch (e) {
			console.error("Failed to load cloud state", e);
		}
		setCloudPrompt("done");
	};

	const handleKeepLocal = () => {
		setCloudPrompt("done");
	};

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

	if (
		status === "loading" ||
		(status === "authenticated" && cloudPrompt === "checking")
	) {
		return (
			<div className="flex items-center justify-center w-full h-screen bg-[#1a1a1f]">
				<p className="text-gray-400 text-sm">Loading...</p>
			</div>
		);
	}

	if (!session) {
		return (
			<div className="flex flex-col items-center justify-center w-full h-screen bg-[#1a1a1f] gap-6">
				<h1 className="text-white text-4xl font-semibold tracking-tight">
					Blankly
				</h1>
				<p className="text-gray-400 text-sm">A blank canvas for your ideas</p>
				<button
					onClick={() => signIn("google")}
					className="flex items-center gap-3 px-5 py-2.5 bg-white text-gray-800 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
				>
					<svg width="18" height="18" viewBox="0 0 48 48">
						<path
							fill="#EA4335"
							d="M24 9.5c3.14 0 5.95 1.08 8.17 2.85l6.08-6.08C34.46 3.39 29.5 1.5 24 1.5 14.82 1.5 7.01 7.1 3.61 15.02l7.1 5.52C12.4 14.36 17.73 9.5 24 9.5z"
						/>
						<path
							fill="#4285F4"
							d="M46.1 24.5c0-1.64-.15-3.22-.43-4.75H24v9h12.43c-.54 2.9-2.18 5.36-4.64 7.01l7.19 5.59C43.18 37.27 46.1 31.32 46.1 24.5z"
						/>
						<path
							fill="#FBBC05"
							d="M10.71 28.54A14.5 14.5 0 0 1 9.5 24c0-1.58.27-3.11.75-4.54l-7.1-5.52A22.45 22.45 0 0 0 1.5 24c0 3.61.86 7.02 2.38 10.04l6.83-5.5z"
						/>
						<path
							fill="#34A853"
							d="M24 46.5c5.5 0 10.12-1.82 13.49-4.95l-7.19-5.59c-1.82 1.22-4.15 1.95-6.3 1.95-6.27 0-11.6-4.86-13.29-11.37l-6.83 5.5C7.01 40.9 14.82 46.5 24 46.5z"
						/>
					</svg>
					Sign in with Google
				</button>
			</div>
		);
	}

	if (cloudPrompt === "prompt") {
		const savedDate = cloudTimestamp
			? new Date(cloudTimestamp).toLocaleString()
			: "unknown time";
		return (
			<div className="flex flex-col items-center justify-center w-full h-screen bg-[#1a1a1f] gap-6">
				<h1 className="text-white text-2xl font-semibold">Cloud save found</h1>
				<p className="text-gray-400 text-sm">Last saved on {savedDate}</p>
				<p className="text-gray-500 text-xs">
					Note: images are not included in cloud saves
				</p>
				<div className="flex gap-3">
					<button
						onClick={handleLoadCloud}
						className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
					>
						Load from cloud
					</button>
					<button
						onClick={handleKeepLocal}
						className="px-5 py-2.5 bg-[#2e2e35] text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
					>
						Keep local version
					</button>
				</div>
			</div>
		);
	}

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
