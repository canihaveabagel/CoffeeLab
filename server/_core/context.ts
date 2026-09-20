import type { User } from "../../drizzle/schema";
import { getUserByOpenId, upsertUser } from "../db";

export type TrpcContext = {
  req: Request;
  user: User | null;
};

function decodeFullName(request: Request): string | null {
  const value = request.headers.get("oai-authenticated-user-full-name");
  const encoding = request.headers.get(
    "oai-authenticated-user-full-name-encoding",
  );
  if (!value || encoding !== "percent-encoded-utf-8") return null;
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

export async function createContext({
  req,
}: {
  req: Request;
}): Promise<TrpcContext> {
  const requestUrl = new URL(req.url);
  const isLocal =
    requestUrl.hostname === "localhost" || requestUrl.hostname === "127.0.0.1";
  const openId =
    req.headers.get("oai-authenticated-user-id") ??
    (isLocal ? "local-preview-user" : null);
  const email =
    req.headers.get("oai-authenticated-user-email") ??
    (isLocal ? "preview@coffeelab.local" : null);

  if (!openId || !email) return { req, user: null };

  const name = decodeFullName(req) ?? (isLocal ? "CoffeeLab Preview" : email);
  await upsertUser({
    openId,
    email,
    name,
    loginMethod: isLocal ? "local" : "chatgpt",
    lastSignedIn: new Date(),
  });

  return {
    req,
    user: (await getUserByOpenId(openId)) ?? null,
  };
}
