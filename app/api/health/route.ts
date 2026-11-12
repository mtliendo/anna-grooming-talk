import { isAuth0Configured, isDatabaseConfigured } from "@/lib/config";

export function GET() {
  return Response.json({
    ok: true,
    auth0: isAuth0Configured(),
    database: isDatabaseConfigured(),
  });
}
