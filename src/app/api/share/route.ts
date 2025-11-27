import {NextResponse} from "next/server";
import {redis} from "@/utils/redis";

function generateShareCode(): string {
	return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function POST() {
	try {
		const roomId = crypto.randomUUID();
		const shareCode = generateShareCode();

		const expirationTimeInSeconds = 2 * 60;

		await redis.set(`share:${shareCode}`, roomId, {
			ex: expirationTimeInSeconds,
		});

		return NextResponse.json({
			shareCode,
			roomId,
			expiresAt: Date.now() + expirationTimeInSeconds * 1000,
		});
	} catch (error) {
		console.error("Redis Error:", error);
		return NextResponse.json({error: "Failed to create room"}, {status: 500});
	}
}

export async function GET(request: Request) {
	const {searchParams} = new URL(request.url);
	const code = searchParams.get("code");

	if (!code) {
		return NextResponse.json({error: "Code is required"}, {status: 400});
	}

	try {
		const roomId = await redis.get(`share:${code.toUpperCase()}`);
		if (!roomId) {
			return NextResponse.json(
				{valid: false, message: "Code expired or invalid"},
				{status: 404}
			);
		}

		return NextResponse.json({valid: true, roomId});
	} catch (error) {
		console.error("Redis Error:", error);
		return NextResponse.json({error: "Failed to validate code"}, {status: 500});
	}
}
