import "server-only";
import crypto from "node:crypto";
import { db, now, tx } from "./db";
import type { Contacts, HelpTypeId } from "./taxonomy";

export type Skill = { category: string; subcategory: string; details: string };

export type User = {
  id: string;
  phone: string;
  name: string;
  photo: string | null;
  city: string | null;
  neighborhood: string | null;
  radiusKm: number;
  about: string;
  helpTypes: HelpTypeId[];
  contacts: Contacts;
  availability: string;
  profileCompleted: boolean;
  skills: Skill[];
};

export type Community = {
  id: string;
  name: string;
  description: string;
  inviteCode: string;
  createdBy: string;
  createdAt: number;
};

export type Member = User & { role: "admin" | "member"; bioOverride: string };

type UserRow = {
  id: string;
  phone: string;
  name: string;
  photo: string | null;
  city: string | null;
  neighborhood: string | null;
  radius_km: number;
  about: string;
  help_types: string;
  contacts: string;
  availability: string;
  profile_completed_at: number | null;
};

function skillsFor(userIds: string[]): Map<string, Skill[]> {
  const map = new Map<string, Skill[]>();
  if (userIds.length === 0) return map;
  const rows = db()
    .prepare(
      `SELECT user_id, category, subcategory, details FROM skills WHERE user_id IN (${userIds.map(() => "?").join(",")}) ORDER BY id`,
    )
    .all(...userIds) as { user_id: string; category: string; subcategory: string; details: string }[];
  for (const r of rows) {
    const list = map.get(r.user_id) ?? [];
    list.push({ category: r.category, subcategory: r.subcategory, details: r.details });
    map.set(r.user_id, list);
  }
  return map;
}

function toUser(r: UserRow, skills: Skill[]): User {
  return {
    id: r.id,
    phone: r.phone,
    name: r.name,
    photo: r.photo,
    city: r.city,
    neighborhood: r.neighborhood,
    radiusKm: r.radius_km,
    about: r.about,
    helpTypes: JSON.parse(r.help_types),
    contacts: JSON.parse(r.contacts),
    availability: r.availability,
    profileCompleted: r.profile_completed_at != null,
    skills,
  };
}

export function getUser(id: string): User | null {
  const r = db().prepare("SELECT * FROM users WHERE id = ?").get(id) as UserRow | undefined;
  if (!r) return null;
  return toUser(r, skillsFor([id]).get(id) ?? []);
}

export type ProfileInput = {
  name: string;
  photo: string | null;
  city: string;
  neighborhood: string;
  radiusKm: number;
  about: string;
  helpTypes: HelpTypeId[];
  contacts: Contacts;
  availability: string;
  skills: Skill[];
};

export function saveProfile(userId: string, p: ProfileInput) {
  tx(() => {
    db()
      .prepare(
        `UPDATE users SET name=?, photo=?, city=?, neighborhood=?, radius_km=?, about=?, help_types=?, contacts=?, availability=?,
         profile_completed_at=COALESCE(profile_completed_at, ?), updated_at=? WHERE id=?`,
      )
      .run(
        p.name,
        p.photo,
        p.city,
        p.neighborhood,
        p.radiusKm,
        p.about,
        JSON.stringify(p.helpTypes),
        JSON.stringify(p.contacts),
        p.availability,
        now(),
        now(),
        userId,
      );
    db().prepare("DELETE FROM skills WHERE user_id = ?").run(userId);
    const ins = db().prepare("INSERT INTO skills (user_id, category, subcategory, details) VALUES (?, ?, ?, ?)");
    for (const s of p.skills) ins.run(userId, s.category, s.subcategory, s.details);
  });
}

// ---------- communities ----------

type CommunityRow = { id: string; name: string; description: string; invite_code: string; created_by: string; created_at: number };
const toCommunity = (r: CommunityRow): Community => ({
  id: r.id,
  name: r.name,
  description: r.description,
  inviteCode: r.invite_code,
  createdBy: r.created_by,
  createdAt: r.created_at,
});

export function createCommunity(userId: string, name: string, description: string): Community {
  const id = crypto.randomUUID();
  const invite = crypto.randomBytes(6).toString("base64url");
  tx(() => {
    db()
      .prepare("INSERT INTO communities (id, name, description, invite_code, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?)")
      .run(id, name, description, invite, userId, now());
    db()
      .prepare("INSERT INTO memberships (user_id, community_id, role, joined_at) VALUES (?, ?, 'admin', ?)")
      .run(userId, id, now());
  });
  return getCommunity(id)!;
}

export function regenerateInvite(communityId: string): string {
  const invite = crypto.randomBytes(6).toString("base64url");
  db().prepare("UPDATE communities SET invite_code = ? WHERE id = ?").run(invite, communityId);
  return invite;
}

export function getCommunity(id: string): Community | null {
  const r = db().prepare("SELECT * FROM communities WHERE id = ?").get(id) as CommunityRow | undefined;
  return r ? toCommunity(r) : null;
}

export function getCommunityByInvite(code: string): Community | null {
  const r = db().prepare("SELECT * FROM communities WHERE invite_code = ?").get(code) as CommunityRow | undefined;
  return r ? toCommunity(r) : null;
}

export function userCommunities(userId: string): (Community & { role: string; memberCount: number })[] {
  const rows = db()
    .prepare(
      `SELECT c.*, m.role, (SELECT COUNT(*) FROM memberships mm WHERE mm.community_id = c.id) AS member_count
       FROM communities c JOIN memberships m ON m.community_id = c.id WHERE m.user_id = ? ORDER BY m.joined_at DESC`,
    )
    .all(userId) as (CommunityRow & { role: string; member_count: number })[];
  return rows.map((r) => ({ ...toCommunity(r), role: r.role, memberCount: r.member_count }));
}

export function membership(userId: string, communityId: string): { role: "admin" | "member"; bioOverride: string } | null {
  const r = db()
    .prepare("SELECT role, bio_override FROM memberships WHERE user_id = ? AND community_id = ?")
    .get(userId, communityId) as { role: "admin" | "member"; bio_override: string } | undefined;
  return r ? { role: r.role, bioOverride: r.bio_override } : null;
}

export function joinCommunity(userId: string, communityId: string): boolean {
  const res = db()
    .prepare("INSERT OR IGNORE INTO memberships (user_id, community_id, role, joined_at) VALUES (?, ?, 'member', ?)")
    .run(userId, communityId, now());
  return res.changes > 0;
}

export function leaveCommunity(userId: string, communityId: string) {
  db().prepare("DELETE FROM memberships WHERE user_id = ? AND community_id = ?").run(userId, communityId);
}

export function setBioOverride(userId: string, communityId: string, bio: string) {
  db().prepare("UPDATE memberships SET bio_override = ? WHERE user_id = ? AND community_id = ?").run(bio, userId, communityId);
}

export function listMembers(communityId: string, opts: { onlyCompleted?: boolean } = {}): Member[] {
  const rows = db()
    .prepare(
      `SELECT u.*, m.role, m.bio_override FROM users u JOIN memberships m ON m.user_id = u.id
       WHERE m.community_id = ? ${opts.onlyCompleted ? "AND u.profile_completed_at IS NOT NULL" : ""}
       ORDER BY u.name`,
    )
    .all(communityId) as (UserRow & { role: "admin" | "member"; bio_override: string })[];
  const skills = skillsFor(rows.map((r) => r.id));
  return rows.map((r) => ({ ...toUser(r, skills.get(r.id) ?? []), role: r.role, bioOverride: r.bio_override }));
}

export function getMember(communityId: string, userId: string): Member | null {
  const m = membership(userId, communityId);
  const u = getUser(userId);
  if (!m || !u) return null;
  return { ...u, ...m };
}

// ---------- analytics (PRD §5 KPIs) ----------

export type EventType = "join" | "profile_completed" | "search" | "contact_click" | "visit";

export function logEvent(
  type: EventType,
  p: { communityId?: string | null; userId?: string | null; ref?: string; meta?: unknown },
): number {
  const res = db()
    .prepare("INSERT INTO events (community_id, user_id, type, ref, meta, created_at) VALUES (?, ?, ?, ?, ?, ?)")
    .run(p.communityId ?? null, p.userId ?? null, type, p.ref ?? null, p.meta ? JSON.stringify(p.meta) : null, now());
  return Number(res.lastInsertRowid);
}

export function communityStats(communityId: string) {
  const d = db();
  const one = <T,>(sql: string, ...args: (string | number)[]) => d.prepare(sql).get(...args) as T;
  const members = one<{ n: number }>("SELECT COUNT(*) n FROM memberships WHERE community_id = ?", communityId).n;
  const completed = one<{ n: number }>(
    `SELECT COUNT(*) n FROM memberships m JOIN users u ON u.id = m.user_id
     WHERE m.community_id = ? AND u.profile_completed_at IS NOT NULL`,
    communityId,
  ).n;
  const searches = one<{ n: number }>("SELECT COUNT(*) n FROM events WHERE community_id = ? AND type = 'search'", communityId).n;
  const searchesWithContact = one<{ n: number }>(
    `SELECT COUNT(DISTINCT ref) n FROM events WHERE community_id = ? AND type = 'contact_click' AND ref IS NOT NULL`,
    communityId,
  ).n;
  const monthAgo = now() - 30 * 24 * 60 * 60 * 1000;
  const mau = one<{ n: number }>(
    "SELECT COUNT(DISTINCT user_id) n FROM events WHERE community_id = ? AND created_at >= ? AND user_id IS NOT NULL",
    communityId,
    monthAgo,
  ).n;
  const contacts30d = one<{ n: number }>(
    "SELECT COUNT(*) n FROM events WHERE community_id = ? AND type = 'contact_click' AND created_at >= ?",
    communityId,
    monthAgo,
  ).n;
  return {
    members,
    completed,
    activationRate: members ? completed / members : 0,
    searches,
    searchToContactRate: searches ? searchesWithContact / searches : 0,
    mau,
    contacts30d,
  };
}

/** The view of a member shown to other members of the same community. Phone is shared only if the member enabled WhatsApp/phone contact. */
export function publicMember(m: Member) {
  const sharePhone = m.contacts.whatsapp !== false || m.contacts.phoneCall;
  return {
    id: m.id,
    name: m.name,
    photo: m.photo,
    city: m.city,
    neighborhood: m.neighborhood,
    helpTypes: m.helpTypes,
    availability: m.availability,
    about: m.about,
    bioOverride: m.bioOverride,
    skills: m.skills,
    role: m.role,
    phone: sharePhone ? m.phone : null,
    contacts: m.contacts,
  };
}
export type PublicMember = ReturnType<typeof publicMember>;
