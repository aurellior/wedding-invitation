import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import {
  deleteWeddingAudio,
  getWeddingAudio,
  saveWeddingAudioChunk,
} from "@/lib/supabase/repository";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const audio = await getWeddingAudio();
    if (!audio || audio.buffer.length === 0) {
      return new NextResponse("Audio not found", { status: 404 });
    }

    const totalLength = audio.buffer.length;
    const rangeHeader = request.headers.get("range");

    if (rangeHeader) {
      const parts = rangeHeader.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0] ?? "0", 10);
      const end = parts[1] ? parseInt(parts[1], 10) : totalLength - 1;

      if (
        Number.isNaN(start) ||
        Number.isNaN(end) ||
        start < 0 ||
        end >= totalLength ||
        start > end
      ) {
        return new NextResponse(null, {
          status: 416,
          headers: {
            "Content-Range": `bytes */${totalLength}`,
          },
        });
      }

      const chunk = audio.buffer.subarray(start, end + 1);
      return new NextResponse(new Uint8Array(chunk), {
        status: 206,
        headers: {
          "Content-Type": audio.mimeType || "audio/mpeg",
          "Content-Length": String(chunk.length),
          "Content-Range": `bytes ${start}-${end}/${totalLength}`,
          "Accept-Ranges": "bytes",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }

    return new NextResponse(new Uint8Array(audio.buffer), {
      status: 200,
      headers: {
        "Content-Type": audio.mimeType || "audio/mpeg",
        "Content-Length": String(totalLength),
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("GET /api/audio error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const chunkBlob = formData.get("chunk");
    const fileName = String(formData.get("fileName") || "wedding-song.mp3");
    const mimeType = String(formData.get("mimeType") || "audio/mpeg");
    const chunkIndex = Number(formData.get("chunkIndex") ?? 0);
    const totalChunks = Number(formData.get("totalChunks") ?? 1);

    if (!chunkBlob || !(chunkBlob instanceof Blob)) {
      return NextResponse.json(
        { error: "File audio MP3 tidak ditemukan." },
        { status: 400 }
      );
    }

    const arrayBuffer = await chunkBlob.arrayBuffer();
    const chunkBuffer = Buffer.from(arrayBuffer);

    await saveWeddingAudioChunk({
      fileName,
      mimeType,
      chunkBuffer,
      chunkIndex,
      totalChunks,
    });

    const isLastChunk = chunkIndex >= totalChunks - 1;
    if (isLastChunk) {
      revalidatePath("/");
      revalidatePath("/admin/content");
    }

    return NextResponse.json(
      {
        done: isLastChunk,
        src: `/api/audio?v=${Date.now()}`,
        fileName,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/audio error:", error);
    return NextResponse.json(
      { error: "Gagal mengunggah potongan file audio MP3." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    await deleteWeddingAudio();
    revalidatePath("/");
    revalidatePath("/admin/content");
    return NextResponse.json(
      {
        src: "",
        message: "File MP3 dihapus. Undangan kini tanpa musik latar.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /api/audio error:", error);
    return NextResponse.json(
      { error: "Gagal menghapus file audio." },
      { status: 500 }
    );
  }
}

