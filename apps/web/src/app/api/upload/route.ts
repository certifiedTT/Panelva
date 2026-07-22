import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const chunk = formData.get("chunk") as File;
    const filename = formData.get("filename") as string;
    const chunkIndex = parseInt(formData.get("chunkIndex") as string, 10);
    const totalChunks = parseInt(formData.get("totalChunks") as string, 10);

    if (!chunk || !filename) {
      return NextResponse.json({ error: "Missing chunk or filename" }, { status: 400 });
    }

    // In a real app, this would be an S3 multipart upload ID or similar.
    // For this mock, we write chunks to the local temp directory.
    const tempDir = path.join(process.cwd(), "tmp", "uploads", filename);
    await fs.mkdir(tempDir, { recursive: true });

    const buffer = Buffer.from(await chunk.arrayBuffer());
    const chunkPath = path.join(tempDir, `chunk-${chunkIndex}`);
    await fs.writeFile(chunkPath, buffer);

    // If this is the last chunk, we assemble them
    if (chunkIndex === totalChunks - 1) {
      const finalPath = path.join(process.cwd(), "tmp", filename);
      // Ensure the final directory exists
      await fs.mkdir(path.dirname(finalPath), { recursive: true });

      // Create a writable stream for the final file
      const writeStream = await fs.open(finalPath, "w");

      for (let i = 0; i < totalChunks; i++) {
        const cPath = path.join(tempDir, `chunk-${i}`);
        const cData = await fs.readFile(cPath);
        await writeStream.write(cData);
        // Clean up the chunk
        await fs.unlink(cPath);
      }

      await writeStream.close();
      // Clean up the temp directory
      await fs.rmdir(tempDir);

      return NextResponse.json({ success: true, message: "Upload complete", url: `/tmp/${filename}` });
    }

    return NextResponse.json({ success: true, message: `Chunk ${chunkIndex} received` });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
