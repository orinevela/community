import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { ProfileForm } from "./ProfileForm";
import { LogoutButton } from "./LogoutButton";

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const user = await currentUser();
  const { next } = await searchParams;
  if (!user) redirect("/login?next=/profile");
  const dest = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{user.profileCompleted ? "הפרופיל שלי" : "בואו נכיר 🙂"}</h1>
        <p className="mt-1 text-ink-2">
          {user.profileCompleted ? "הפרופיל משותף לכל הקהילות שלך." : "פחות מ-2 דקות, והקהילה תדע במה תוכלו לעזור."}
        </p>
      </div>
      <ProfileForm
        next={dest}
        initial={{
          name: user.name,
          photo: user.photo,
          city: user.city ?? "",
          neighborhood: user.neighborhood ?? "",
          radiusKm: user.radiusKm,
          about: user.about,
          helpTypes: user.helpTypes,
          contacts: { whatsapp: true, ...user.contacts },
          availability: user.availability,
          skills: user.skills,
        }}
        isNew={!user.profileCompleted}
      />
      {user.profileCompleted && <LogoutButton />}
    </div>
  );
}
