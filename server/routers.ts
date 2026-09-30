import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { addScoreboardPoint, getScoreboardPlayers, updateScoreboardPlayer } from "./db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

const playerIdInput = z.object({
  id: z.number().int().positive(),
});

const playerProfileInput = z.object({
  id: z.number().int().positive(),
  name: z.string().trim().min(1, "กรุณาใส่ชื่อผู้เล่น").max(80, "ชื่อยาวเกินไป"),
  imageUrl: z
    .string()
    .trim()
    .max(500, "ลิงก์รูปยาวเกินไป")
    .refine(value => value === "" || /^https?:\/\//i.test(value), "กรุณาใช้ลิงก์รูปที่ขึ้นต้นด้วย http หรือ https"),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  scoreboard: router({
    list: publicProcedure.query(() => getScoreboardPlayers()),
    addPoint: publicProcedure.input(playerIdInput).mutation(async ({ input }) => {
      const player = await addScoreboardPoint(input.id);
      if (!player) {
        throw new TRPCError({ code: "NOT_FOUND", message: "ไม่พบผู้เล่นคนนี้" });
      }
      return player;
    }),
    updatePlayer: publicProcedure.input(playerProfileInput).mutation(async ({ input }) => {
      const player = await updateScoreboardPlayer(input.id, {
        name: input.name,
        imageUrl: input.imageUrl,
      });
      if (!player) {
        throw new TRPCError({ code: "NOT_FOUND", message: "ไม่พบผู้เล่นคนนี้" });
      }
      return player;
    }),
  }),
});

export type AppRouter = typeof appRouter;
