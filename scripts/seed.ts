/**
 * Seeds a demo community with sample members so you can try search right away.
 *   npm run seed
 * Log in as the demo admin with phone 050-0000001 (in dev mode the OTP is shown on screen).
 */
import { db } from "../src/lib/db";
import { findOrCreateUserByPhone } from "../src/lib/auth";
import { createCommunity, getCommunityByInvite, joinCommunity, saveProfile, type ProfileInput } from "../src/lib/repo";

type Seed = { phone: string; p: Omit<ProfileInput, "photo" | "contacts" | "radiusKm"> & { radiusKm?: number; contacts?: ProfileInput["contacts"] } };

const people: Seed[] = [
  { phone: "+972500000001", p: { name: "מאיה לוי", city: "תל אביב-יפו", neighborhood: "הצפון הישן", about: "מנהלת את הקבוצה 🙂 עובדת בשיווק דיגיטלי.", helpTypes: ["networking", "volunteer"], availability: "זמינה בוואטסאפ בשעות הערב", skills: [{ category: "career", subcategory: "שיווק, בדיקת קורות חיים", details: "סמנכ\"לית שיווק בסטארטאפ, שמחה לעבור על קו\"ח ולתת טיפים לראיונות בשיווק" }] } },
  { phone: "+972500000002", p: { name: "דני כהן", city: "תל אביב-יפו", neighborhood: "הצפון הישן", about: "", helpTypes: ["networking"], availability: "בערבים", skills: [{ category: "career", subcategory: "דאטה, הייטק, הכנה לראיונות", details: "Data Scientist בחברת סייבר. ראיינתי עשרות מועמדים, אשמח לעזור בהכנה לראיונות דאטה ו-SQL" }] } },
  { phone: "+972500000003", p: { name: "יוסי אברהם", city: "רמת גן", neighborhood: "", about: "אינסטלטור מוסמך 20 שנה", helpTypes: ["paid"], availability: "א'-ה' 8:00-18:00, מקרים דחופים גם בערב", skills: [{ category: "home", subcategory: "אינסטלציה", details: "תיקון נזילות, החלפת ברזים, פתיחת סתימות, דודי שמש. מחיר הוגן לחברי הקהילה" }] } },
  { phone: "+972500000004", p: { name: "נועה שפירא", city: "תל אביב-יפו", neighborhood: "לב העיר", about: "אמא לשלושה, אוהבת לעזור", helpTypes: ["volunteer"], availability: "בסופי שבוע", skills: [{ category: "lending", subcategory: "כלי עבודה, סולם, ציוד לתינוקות", details: "יש לי מקדחה, סולם 3 מטר ועגלת תאומים להשאלה בכיף" }, { category: "family", subcategory: "ייעוץ הורי", details: "" }] } },
  { phone: "+972500000005", p: { name: "אבי מזרחי", city: "גבעתיים", neighborhood: "", about: "", helpTypes: ["paid", "networking"], availability: "בשעות העבודה", skills: [{ category: "legal_finance", subcategory: "רואה חשבון, מיסים והחזרי מס", details: "רו\"ח עצמאי. החזרי מס לשכירים, דוחות לעצמאים, ייעוץ ראשוני חינם לחברי הקהילה" }] } },
  { phone: "+972500000006", p: { name: "שירה גולן", city: "תל אביב-יפו", neighborhood: "הצפון הישן", about: "סטודנטית למדעי המחשב", helpTypes: ["volunteer", "paid"], availability: "גמישה", skills: [{ category: "tech", subcategory: "תיקון מחשבים, רשתות ו-WiFi, עזרה טכנית לגיל השלישי", details: "מתקינה ראוטרים, מנקה וירוסים ועוזרת להורים עם הסמארטפון" }, { category: "education", subcategory: "מתמטיקה, בגרויות", details: "שיעורים פרטיים במתמטיקה 5 יח\"ל" }] } },
  { phone: "+972500000007", p: { name: "רון ביטון", city: "תל אביב-יפו", neighborhood: "יד אליהו", about: "", helpTypes: ["paid"], availability: "", skills: [{ category: "home", subcategory: "חשמל, תיקונים קלים", details: "חשמלאי מוסמך, התקנת גופי תאורה, שקעים, לוחות חשמל" }] } },
  { phone: "+972500000008", p: { name: "טל אורן", city: "הרצליה", neighborhood: "", about: "מנהל מוצר", helpTypes: ["networking"], availability: "זמין בוואטסאפ בשעות הערב", skills: [{ category: "career", subcategory: "ניהול מוצר, העברת קורות חיים (רפרל), הייטק", details: "PM בחברת X, יכול להעביר קו\"ח למשרות מוצר ופיתוח אצלנו" }] } },
  { phone: "+972500000009", p: { name: "מיכל דהן", city: "תל אביב-יפו", neighborhood: "הצפון הישן", about: "וטרינרית", helpTypes: ["volunteer", "paid"], availability: "", skills: [{ category: "pets", subcategory: "וטרינריה", details: "ייעוץ טלפוני ראשוני בחינם לבעלי חיים של השכנים" }] } },
  { phone: "+972500000010", p: { name: "עומר פרץ", city: "רמת גן", neighborhood: "", about: "", helpTypes: ["volunteer"], availability: "בסופי שבוע", skills: [{ category: "transport", subcategory: "הובלות קטנות", details: "יש לי טנדר, אשמח לעזור בהובלה של רהיט או שניים" }, { category: "lending", subcategory: "ציוד קמפינג", details: "אוהל ל-6, כיסאות מתקפלים, צידנית" }] } },
];

const conn = db();
let community = getCommunityByInvite("demo-community");
const adminId = findOrCreateUserByPhone(people[0].phone);
if (!community) {
  const c = createCommunity(adminId, "שכונת הצפון הישן", "קבוצת השכנים של הצפון הישן – עוזרים אחד לשני");
  conn.prepare("UPDATE communities SET invite_code = 'demo-community' WHERE id = ?").run(c.id);
  community = getCommunityByInvite("demo-community")!;
}
for (const { phone, p } of people) {
  const id = findOrCreateUserByPhone(phone);
  saveProfile(id, { photo: null, radiusKm: 5, contacts: { whatsapp: true }, ...p });
  joinCommunity(id, community.id);
}
console.log(`Seeded "${community.name}" with ${people.length} members.`);
console.log(`Invite link: /join/demo-community   ·   demo admin phone: 050-0000001`);
