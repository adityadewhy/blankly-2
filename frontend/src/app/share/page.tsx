"use client";

import {useEffect, useState} from "react";
import {useRouter} from "next/navigation";

export default function Share() {
	const router = useRouter();

	const [status, setStatus] = useState<string>("");
	const [shareCode, setShareCode] = useState<string | null>(null);
	const [roomId, setRoomId] = useState<string | null>(null);
	const [expiresAt, setExpiresAt] = useState<number | null>(null);
	const [timeLeft, setTimeLeft] = useState<number>(0);
	const [isGenerating, setIsGenerating] = useState(false);

	const [joinCode, setJoinCode] = useState("");
	const [isJoining, setIsJoining] = useState(false);
	const [joinError, setJoinError] = useState("");

	useEffect(() => {
		if (!expiresAt) return;

		const interval = setInterval(() => {
			const remaining = Math.max(
				0,
				Math.floor((expiresAt - Date.now()) / 1000)
			);
			setTimeLeft(remaining);
			if (remaining <= 0) {
				setStatus("Code expired. Please generate a new one.");
				setShareCode(null);
				setExpiresAt(null);
				clearInterval(interval);
			}
		}, 1000);

		return () => clearInterval(interval);
	}, [expiresAt]);

	const formatTime = (seconds: number) => {
		const m = Math.floor(seconds / 60)
			.toString()
			.padStart(2, "0");
		const s = (seconds % 60).toString().padStart(2, "0");
		return `${m}:${s}`;
	};

	const generateCode = async () => {
		setIsGenerating(true);
		setStatus("");
		try {
			const res = await fetch("/api/share", {method: "POST"});
			if (!res.ok) throw new Error("Failed to generate");

			const data = await res.json();

			setShareCode(data.shareCode);
			setRoomId(data.roomId);
			setExpiresAt(data.expiresAt);
			setStatus("Waiting for others to join...");
		} catch (e) {
			console.error(e);
			setStatus("Error generating code.");
		} finally {
			setIsGenerating(false);
		}
	};

	const enterMyRoom = () => {
		if (roomId) {
			router.push(`/?room=${roomId}&role=host`);
		}
	};

	const handleJoin = async () => {
		if (!joinCode) return;
		setIsJoining(true);
		setJoinError("");

		try {
			const res = await fetch(`/api/share?code=${joinCode}`);
			const data = await res.json();

			if (res.ok && data.valid && data.roomId) {
				// Redirect to the homepage with the room ID
				router.push(`/?room=${data.roomId}`);
			} else {
				setJoinError("Invalid or expired code");
			}
		} catch (e) {
			setJoinError("Failed to join");
		} finally {
			setIsJoining(false);
		}
	};

	const renderCodeGenerationBlock = () => {
		if (!shareCode) {
			return (
				<button
					onClick={generateCode}
					disabled={isGenerating}
					className="cursor-pointer disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2 rounded-md font-bold transition w-full"
				>
					{isGenerating ? "Generating..." : "Generate Code"}
				</button>
			);
		}

		// If shareCode exists
		return (
			<div className="w-full bg-[#1a1a1e] p-4 rounded-lg border border-gray-700 flex flex-col items-center animate-in fade-in zoom-in">
				<p className="text-gray-400 text-xs uppercase tracking-widest mb-1">
					Share Code
				</p>

				<p className="text-4xl font-mono text-white tracking-wider mb-2 select-all cursor-pointer">
					{shareCode}
				</p>

				<p className="text-red-400 text-sm font-mono mb-4">
					Expires in {formatTime(timeLeft)}
				</p>

				<div className="w-full text-center">
					<p className="text-gray-400 text-sm mb-2">{status}</p>
					<button
						onClick={enterMyRoom}
						className="text-blue-400 hover:text-blue-300 text-sm underline cursor-pointer"
					>
						Enter Room Now &rarr;
					</button>
				</div>
			</div>
		);
	};

	return (
		<div className="grid place-items-center h-dvh bg-[#121212] ">
			<div className="bg-[#232329] rounded-md p-6 flex flex-col items-center w-[400px]">
				<div>
					<p className="text-white text-3xl font-extrabold underline mb-6">
						Blankly
					</p>
				</div>

				<div className="w-full flex flex-col items-center">
					<p className="text-white font-bold text-lg mb-2">
						Live Collaboration
					</p>
					<p className="text-gray-400 text-sm mb-4 text-center">
						Invite people to collaborate on a new blankly
					</p>

					{renderCodeGenerationBlock()}
				</div>

				<div className="bg-gray-600 w-full h-px my-8 opacity-30" />

				{/* --- GUEST SECTION --- */}
				<div className="w-full">
					<p className="text-white font-bold text-center mb-2">
						Join a Session
					</p>
					<p className="text-gray-400 text-sm text-center mb-4">
						Enter a code to collaborate on another's blankly
					</p>

					<div className="flex gap-2">
						<input
							type="text"
							placeholder="XY1234"
							maxLength={6}
							className="bg-[#121212] border border-gray-600 rounded text-white px-3 py-2 w-full font-mono text-center uppercase focus:outline-none focus:border-blue-500"
							value={joinCode}
							onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
						/>
						<button
							onClick={handleJoin}
							disabled={isJoining || joinCode.length <= 5}
							className="cursor-pointer disabled:cursor-not-allowed bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded font-bold transition"
						>
							{isJoining ? "..." : "Join"}
						</button>
					</div>
					{joinError && (
						<p className="text-red-500 text-sm text-center mt-2">{joinError}</p>
					)}
				</div>
			</div>
		</div>
	);
}
