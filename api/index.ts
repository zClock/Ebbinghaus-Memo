/**
 * Vercel Serverless Function 入口
 *
 * 为什么这层存在：Vercel 的 @vercel/node runtime 在 ESM 模式下
 * 要求 api/ 内的文件只能 import 同目录或 npm 包，
 * 直接 import 项目根的 server.ts 会报 ERR_MODULE_NOT_FOUND。
 *
 * 因此真正的 Express app 实现放在 api/server.ts（同目录），
 * 这里只做 handler 适配。
 */
import type { Request, Response } from "express";
import app from "./server";

export default function handler(req: Request, res: Response) {
  return app(req as any, res as any);
}
