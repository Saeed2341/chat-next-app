import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "secret123";

export interface AuthUser {
  username: string;
  userId: string;
}

export async function getAuthUser(req: NextRequest): Promise<AuthUser | null> {
  try {
    const cookieHeader = req.headers.get("cookie") || "";
    const tokenMatch = cookieHeader.match(/token=([^;]+)/);
    let token = tokenMatch ? decodeURIComponent(tokenMatch[1]) : null;

    if (!token) {
      const authHeader = req.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, SECRET) as { username: string; userId: string };
    return { username: decoded.username, userId: decoded.userId };
  } catch {
    return null;
  }
}