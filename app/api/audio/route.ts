import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import {
  deleteWeddingAudio,
  getWeddingAudio,
  saveWeddingAudioChunk,
} from "@/lib/supabase/repository";
import { requireAdminAuth } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const MAX_CHUNK_BYTES = 2 * 1024 * 1024; // 2 MB per chunk
const MAX_TOTAL_CHUNKS = 14; // ~20 MB max file size
const ALLOWED_AUDIO_MIMES = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/x-m4a",
  "audio/wav",
  "audio/x-wav",
  "audio/ogg",
]);

function hasValidAudioSignature(buf: Buffer): boolean {
  if (buf.length < 12) return false;
  // ID3v2 tag ("ID3")
  if (buf[0] === 0x49 && buf[1] === 0x44 && buf[2] === 0x33) return true;
  // MPEG audio frame sync (0xFF followed by 0xE0..0xFF)
  if (buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0) return true;
  // WAV ("RIFF" .... "WAVE")
  if (
    buf.subarray(0, 4).toString("ascii") === "RIFF" &&
    buf.subarray(8, 12).toString("ascii") === "WAVE"
  ) {
    return true;
  }
  // Ogg ("OggS")
  if (buf.subarray(0, 4).toString("ascii") === "OggS") return true;
  // MP4 / M4A ("ftyp" at offset 4)
  if (buf.subarray(4, 8).toString("ascii") === "ftyp") return true;

  return false;
}

export async function GET(request: Request) {
  try {
    const audio = await getWeddingAudio();
    if (!audio || audio.buffer.length === 0) {
      return new NextResponse("Audio not found", { status: 404 });
    }

    const totalLength = audio.buffer.length;
    const rangeHeader = request.headers.get("range");
    const safeContentType = ALLOWED_AUDIO_MIMES.has(audio.mimeType)
      ? audio.mimeType
      : "audio/mpeg";

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
          "Content-Type": safeContentType,
          "Content-Length": String(chunk.length),
          "Content-Range": `bytes ${start}-${end}/${totalLength}`,
          "Accept-Ranges": "bytes",
          "Cache-Control": "public, max-age=31536000, immutable",
          "X-Content-Type-Options": "nosniff",
          "Content-Disposition": 'inline; filename="wedding-audio.mp3"',
        },
      });
    }

    return new NextResponse(new Uint8Array(audio.buffer), {
      status: 200,
      headers: {
        "Content-Type": safeContentType,
        "Content-Length": String(totalLength),
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        "Content-Disposition": 'inline; filename="wedding-audio.mp3"',
      },
    });
  } catch (error) {
    console.error("GET /api/audio error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAdminAuth();
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const formData = await request.formData();
    const chunkBlob = formData.get("chunk");
    const rawFileName = String(formData.get("fileName") || "wedding-song.mp3");
    const fileName = rawFileName.replace(/[^a-zA-Z0-9._ -]/g, "_").slice(0, 120);
    const mimeType = String(formData.get("mimeType") || "audio/mpeg")
      .trim()
      .toLowerCase();
    const chunkIndex = Number(formData.get("chunkIndex") ?? 0);
    const totalChunks = Number(formData.get("totalChunks") ?? 1);

    if (
      !Number.isInteger(chunkIndex) ||
      !Number.isInteger(totalChunks) ||
      chunkIndex < 0 ||
      totalChunks < 1 ||
      totalChunks > MAX_TOTAL_CHUNKS ||
      chunkIndex >= totalChunks
    ) {
      return NextResponse.json(
        {
          error:
            "Parameter chunk upload tidak valid atau melebihi batas maksimal 20 MB.",
        },
        { status: 400 }
      );
    }

    if (!ALLOWED_AUDIO_MIMES.has(mimeType)) {
      return NextResponse.json(
        {
          error:
            "Format file tidak didukung. Gunakan file MP3, M4A, WAV, atau OGG.",
        },
        { status: 400 }
      );
    }

    if (!chunkBlob || !(chunkBlob instanceof Blob)) {
      return NextResponse.json(
        { error: "File audio MP3 tidak ditemukan." },
        { status: 400 }
      );
    }

    if (chunkBlob.size === 0 || chunkBlob.size > MAX_CHUNK_BYTES) {
      return NextResponse.json(
        { error: "Ukuran potongan file audio melebihi batas maksimal 2 MB." },
        { status: 413 }
      );
    }

    const arrayBuffer = await chunkBlob.arrayBuffer();
    const chunkBuffer = Buffer.from(arrayBuffer);

    if (chunkIndex === 0 && !hasValidAudioSignature(chunkBuffer)) {
      return NextResponse.json(
        { error: "Header biner file bukan merupakan file audio yang valid." },
        { status: 400 }
      );
    }

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
  const auth = await requireAdminAuth();
  if (!auth.authorized) {
    return auth.response;
  }

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
