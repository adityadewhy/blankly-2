import {NextRequest, NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import {redis} from "@/utils/redis";

export async function POST(req: NextRequest) {
	const session = await getServerSession();
	if (!session?.user?.email) {
		return NextResponse.json({error: "unauthorized"}, {status: 401});
	}

	const email = session.user.email;
	const rateLimitKey = `ratelimit:save:${email}`;
	const isRateLimited = await redis.get(rateLimitKey);

	if (isRateLimited) {
		return NextResponse.json(
			{error: "wait before saving again, ratelimited"},
			{status: 429},
		);
	}

	const body = await req.json();
	const {shapes, textArray, timestamp} = body;

	await redis.set(
		`canvas:${email}`,
		JSON.stringify({shapes, textArray, timestamp}),
	);
	await redis.set(rateLimitKey, "1", {ex: 30});

	return NextResponse.json({success: true});
}

export async function GET() {
	const session = await getServerSession();
	if (!session?.user?.email) {
		return NextResponse.json({error: "unauthorized"}, {status: 401});
	}

	const email = session.user.email;
	const saved = await redis.get(`canvas:${email}`);

	if (!saved) {
		return NextResponse.json({found: false});
	}

	return NextResponse.json({found: true, state: saved});
}
