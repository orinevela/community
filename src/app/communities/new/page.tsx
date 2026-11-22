import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { NewCommunityForm } from "./NewCommunityForm";

export default async function NewCommunityPage() {
  if (!(await currentUser())) redirect("/login?next=/communities/new");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">הקמת קהילה</h1>
        <p className="mt-1 text-ink-2">תקבלו קישור הזמנה לשיתוף בקבוצת הוואטסאפ שלכם.</p>
      </div>
      <NewCommunityForm />
    </div>
  );
}
