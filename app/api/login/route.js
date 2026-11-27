import { POST as authLoginPOST } from "@/app/api/auth/login/route";

export async function POST(request) {
  return authLoginPOST(request);
}
