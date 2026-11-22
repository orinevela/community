import "server-only";
import { NextResponse } from "next/server";
import { currentUser } from "./auth";
import { membership } from "./repo";

export const json = (data: unknown, status = 200) => NextResponse.json(data, { status });
export const error = (message: string, status = 400) => NextResponse.json({ error: message }, { status });

export async function requireUser() {
  const user = await currentUser();
  if (!user) throw error("נדרשת התחברות", 401);
  return user;
}

export async function requireMember(communityId: string, opts: { admin?: boolean } = {}) {
  const user = await requireUser();
  const m = membership(user.id, communityId);
  if (!m) throw error("אינך חבר/ה בקהילה זו", 403);
  if (opts.admin && m.role !== "admin") throw error("פעולה זו זמינה למנהלי הקהילה בלבד", 403);
  return { user, role: m.role };
}

/** Wrap a route handler so thrown NextResponses are returned and other errors become 500s. */
export function handler<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A) => {
    try {
      return await fn(...args);
    } catch (e) {
      if (e instanceof Response) return e;
      console.error(e);
      return error("שגיאה בשרת, נסו שוב", 500);
    }
  };
}
