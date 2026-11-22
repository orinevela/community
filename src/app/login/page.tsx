import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

function safeNext(next?: string) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next);
  if (await currentUser()) redirect(next);
  return (
    <div className="mx-auto max-w-sm space-y-6 pt-6">
      <div>
        <h1 className="text-2xl font-bold">כניסה מהירה</h1>
        <p className="mt-1 text-ink-2">נשלח לכם קוד אימות לטלפון. המספר משמש גם לכפתור הוואטסאפ בפרופיל.</p>
      </div>
      <LoginForm next={next} />
    </div>
  );
}
