"use client";

import {Share2} from "lucide-react";
import {useRouter} from "next/navigation";
import {useState} from "react";
import RingLoader from "./ringLoader";

export default function Share() {
	const router = useRouter();
	const [loading, setLoading] = useState(false);

	const handleClick = () => {
		setLoading(true);
		router.push("/share");
	};

	let shareORloader;
	if (loading) {
		shareORloader = <RingLoader />;
	} else {
		shareORloader = <Share2 />;
	}
	return (
		<button
			onClick={handleClick}
			className="justify-center items-center rounded-md p-1.5 hover:bg-gray-700 text-gray-200 transition-colors "
			title="Share"
		>
			{shareORloader}
		</button>
	);
}
