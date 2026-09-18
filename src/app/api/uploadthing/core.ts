import { createUploadthing } from "uploadthing/next";
import type { FileRouter } from "uploadthing/next";
import { cookies } from "next/headers";
import { UploadThingError } from "uploadthing/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";

const f = createUploadthing();

export const ourFileRouter = {
  newsImage: f({ image: { maxFileSize: "8MB", maxFileCount: 1 } })
    .middleware(async () => {
      const token = (await cookies()).get(SESSION_COOKIE)?.value;
      if (!verifySession(token)) {
        throw new UploadThingError({
          code: "FORBIDDEN",
          message: "No autorizado",
        });
      }
      return {};
    })
    .onUploadComplete(async ({ file }) => ({ url: file.ufsUrl })),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
