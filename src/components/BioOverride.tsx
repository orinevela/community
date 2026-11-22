"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client";

/** Per-community addition to the shared profile (PRD §3.1: adapting the description per community). */
export function BioOverride({ communityId, initial }: { communityId: string; initial: string }) {
  const router = useRouter();
  const [bio, setBio] = useState(initial);
  const [saved, setSaved] = useState(false);
  return (
    <div className="card space-y-2 p-4">
      <label className="label" htmlFor="bio">תוספת לתיאור – רק בקהילה הזו</label>
      <textarea id="bio" className="input min-h-20" value={bio} maxLength={500} onChange={(e) => { setBio(e.target.value); setSaved(false); }} placeholder="למשל: אמא של נועה מגן חצב 🙂" />
      <button
        className="btn-ghost w-full py-2"
        onClick={async () => {
          await api(`/api/communities/${communityId}/bio`, { bio }, "PUT");
          setSaved(true);
          router.refresh();
        }}
      >
        {saved ? "נשמר ✓" : "שמירה"}
      </button>
    </div>
  );
}
