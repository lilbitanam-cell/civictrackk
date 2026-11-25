import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, isFirebaseAdminConfigured } from "@/lib/firebase/admin";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    if (!isFirebaseAdminConfigured()) {
      return NextResponse.json({ error: "Server not configured" }, { status: 500 });
    }

    const { id } = await context.params;
    if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) {
      return NextResponse.json({ error: "Invalid media ID" }, { status: 400 });
    }

    const db = getAdminDb();
    const docRef = db.collection("uploadedMedia").doc(id);
    const snap = await docRef.get();

    if (!snap.exists) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    const data = snap.data()!;
    const contentType = String(data.contentType || "image/jpeg");

    let buffer: Buffer;
    if (!data.chunkCount || data.chunkCount === 0) {
      if (!data.data) {
        return NextResponse.json({ error: "Media data missing" }, { status: 404 });
      }
      buffer = Buffer.isBuffer(data.data) ? data.data : Buffer.from(data.data);
    } else {
      const chunkSnap = await docRef.collection("chunks").orderBy("index", "asc").get();
      const parts = chunkSnap.docs.map((d) => {
        const chunkData = d.data().data;
        return Buffer.isBuffer(chunkData) ? chunkData : Buffer.from(chunkData);
      });
      buffer = Buffer.concat(parts);
    }

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(buffer.length),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err: unknown) {
    console.error("GET /api/media/[id] error:", err);
    return NextResponse.json({ error: "Failed to load media" }, { status: 500 });
  }
}
