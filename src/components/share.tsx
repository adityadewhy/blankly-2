"use client"

import {Share2} from "lucide-react";
import {useRouter} from "next/navigation";

export default function Share() {
	const router = useRouter();
	return (
		<button
			onClick={() => router.push("/share")}
			className="justify-center rounded-md p-1.5 hover:bg-gray-700 text-gray-200 transition-colors "
			title="Share"
		>
			<Share2 />
		</button>
	);
}

// add loader