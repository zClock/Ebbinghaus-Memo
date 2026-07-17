import type { Request, Response } from "express";
import app from "../server";

/**
 * Vercel Serverless Function 入口
 *
 * Vercel Node.js runtime 期望默认导出是一个 handler 函数
 * (req: IncomingMessage, res: ServerResponse) => void
 *
 * 直接 export default app 在新版 Vercel 上可能不被正确识别，
 * 因此这里显式把请求转发给 Express app 处理。
 *
 * 注意：app 本身已经是 (req, res) => void 的可调用对象，
 * 但为了类型与运行时双保险，这里用显式包装。
 */
export default function handler(req: Request, res: Response) {
  return app(req, res);
}
