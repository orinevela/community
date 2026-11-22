// Shared (client + server) reference data.

export type Category = { id: string; label: string; emoji: string; subs: string[]; keywords: string[] };

export const CATEGORIES: Category[] = [
  {
    id: "home",
    label: "תחזוקת הבית",
    emoji: "🔧",
    subs: ["אינסטלציה", "חשמל", "תיקונים קלים", "צבע ושיפוצים", "מיזוג אוויר", "גינון", "הרכבת רהיטים"],
    keywords: ["ברז", "נזילה", "סתימה", "אינסטלטור", "חשמלאי", "קצר", "שקע", "מזגן", "שיפוץ", "תיקון", "הנדימן", "דוד", "צנרת", "מנעולן", "איקאה"],
  },
  {
    id: "career",
    label: "קריירה וחיפוש עבודה",
    emoji: "💼",
    subs: ["הייטק", "דאטה", "שיווק", "כספים", "בדיקת קורות חיים", "הכנה לראיונות", "העברת קורות חיים (רפרל)", "ניהול מוצר"],
    keywords: ["עבודה", "ראיון", "קורות חיים", "קו\"ח", "משרה", "רפרל", "הייטק", "מתכנת", "פיתוח", "דאטה", "סטארטאפ", "לינקדאין", "גיוס"],
  },
  {
    id: "family",
    label: "הורות ומשפחה",
    emoji: "👨‍👩‍👧",
    subs: ["בייביסיטר", "ייעוץ הורי", "חוגים ופעילויות", "שיעורים פרטיים", "הנקה ותינוקות", "חינוך מיוחד"],
    keywords: ["ילד", "ילדים", "תינוק", "גן", "בית ספר", "שמרטף", "בייביסיטר", "שיעורי בית", "מורה", "הורות"],
  },
  {
    id: "legal_finance",
    label: "ייעוץ משפטי / פיננסי",
    emoji: "⚖️",
    subs: ["עורך דין", "רואה חשבון", "מיסים והחזרי מס", "משכנתאות", "ביטוח", "השקעות", "זכויות עובדים"],
    keywords: ["עורך דין", "עו\"ד", "חוזה", "רו\"ח", "מס", "משכנתא", "ביטוח", "השקעה", "פנסיה", "זכויות", "תביעה"],
  },
  {
    id: "health",
    label: "בריאות ורווחה",
    emoji: "🩺",
    subs: ["רפואה", "פסיכולוגיה וטיפול", "תזונה", "כושר ואימון", "פיזיותרפיה"],
    keywords: ["רופא", "טיפול", "פסיכולוג", "דיאטה", "תזונאי", "כושר", "אימון", "גב", "פיזיו"],
  },
  {
    id: "tech",
    label: "מחשבים וטכנולוגיה",
    emoji: "💻",
    subs: ["תיקון מחשבים", "רשתות ו-WiFi", "סמארטפונים", "בניית אתרים", "עזרה טכנית לגיל השלישי"],
    keywords: ["מחשב", "לפטופ", "וויפי", "ראוטר", "אינטרנט", "טלפון", "אייפון", "אתר", "וירוס", "מדפסת"],
  },
  {
    id: "lending",
    label: "השאלת ציוד",
    emoji: "🧰",
    subs: ["כלי עבודה", "ציוד קמפינג", "ציוד לתינוקות", "ציוד ספורט", "ציוד לאירועים", "סולם"],
    keywords: ["להשאיל", "השאלה", "מקדחה", "סולם", "אוהל", "עגלה", "כיסא תינוק", "שולחן", "כלים"],
  },
  {
    id: "transport",
    label: "הסעות ושליחויות",
    emoji: "🚗",
    subs: ["טרמפים", "הובלות קטנות", "איסוף מהגן", "שליחויות"],
    keywords: ["טרמפ", "הסעה", "הובלה", "רכב", "נסיעה", "איסוף"],
  },
  {
    id: "creative",
    label: "יצירה, אירועים ופנאי",
    emoji: "🎨",
    subs: ["צילום", "עיצוב גרפי", "מוזיקה", "בישול ואפייה", "תכנון אירועים"],
    keywords: ["צלם", "צילום", "עיצוב", "לוגו", "גיטרה", "פסנתר", "עוגה", "אירוע", "יום הולדת", "קייטרינג"],
  },
  {
    id: "education",
    label: "לימודים ושפות",
    emoji: "📚",
    subs: ["מתמטיקה", "אנגלית", "בגרויות", "פסיכומטרי", "שפות זרות", "אקדמיה"],
    keywords: ["שיעור", "מורה", "בגרות", "פסיכומטרי", "אנגלית", "מתמטיקה", "תואר", "סמינריון", "לימודים"],
  },
  {
    id: "pets",
    label: "בעלי חיים",
    emoji: "🐾",
    subs: ["דוגווקר", "פנסיון", "אילוף", "וטרינריה"],
    keywords: ["כלב", "חתול", "טיול כלבים", "וטרינר", "אילוף"],
  },
];

export const HELP_TYPES = [
  { id: "volunteer", label: "התנדבות / עזרה הדדית" },
  { id: "paid", label: "בתשלום (עסק)" },
  { id: "networking", label: "נטוורקינג / ייעוץ ראשוני" },
] as const;

export type HelpTypeId = (typeof HELP_TYPES)[number]["id"];

export const CONTACT_FIELDS = [
  { id: "phoneCall", label: "שיחת טלפון", placeholder: "" },
  { id: "linkedin", label: "לינקדאין", placeholder: "https://linkedin.com/in/..." },
  { id: "email", label: "אימייל", placeholder: "name@example.com" },
  { id: "instagram", label: "אינסטגרם", placeholder: "@username" },
] as const;

export type Contacts = {
  whatsapp?: boolean;
  phoneCall?: boolean;
  linkedin?: string;
  email?: string;
  instagram?: string;
};

// City list with coordinates, used for the "relevance radius" distance calculation.
export const CITIES: { name: string; lat: number; lng: number }[] = [
  { name: "תל אביב-יפו", lat: 32.0853, lng: 34.7818 },
  { name: "ירושלים", lat: 31.7683, lng: 35.2137 },
  { name: "חיפה", lat: 32.794, lng: 34.9896 },
  { name: "ראשון לציון", lat: 31.973, lng: 34.7925 },
  { name: "פתח תקווה", lat: 32.0871, lng: 34.8875 },
  { name: "אשדוד", lat: 31.8044, lng: 34.6553 },
  { name: "נתניה", lat: 32.3215, lng: 34.8532 },
  { name: "באר שבע", lat: 31.2518, lng: 34.7913 },
  { name: "בני ברק", lat: 32.0807, lng: 34.8338 },
  { name: "חולון", lat: 32.0158, lng: 34.7874 },
  { name: "רמת גן", lat: 32.0684, lng: 34.8248 },
  { name: "גבעתיים", lat: 32.0722, lng: 34.8125 },
  { name: "אשקלון", lat: 31.6688, lng: 34.5743 },
  { name: "רחובות", lat: 31.8928, lng: 34.8113 },
  { name: "בת ים", lat: 32.0171, lng: 34.7454 },
  { name: "הרצליה", lat: 32.1624, lng: 34.8447 },
  { name: "כפר סבא", lat: 32.175, lng: 34.9069 },
  { name: "רעננה", lat: 32.1848, lng: 34.8713 },
  { name: "הוד השרון", lat: 32.1593, lng: 34.8932 },
  { name: "רמת השרון", lat: 32.1461, lng: 34.8394 },
  { name: "מודיעין-מכבים-רעות", lat: 31.8969, lng: 35.0104 },
  { name: "לוד", lat: 31.9516, lng: 34.8953 },
  { name: "רמלה", lat: 31.9293, lng: 34.8744 },
  { name: "נס ציונה", lat: 31.9293, lng: 34.7987 },
  { name: "יבנה", lat: 31.8781, lng: 34.7398 },
  { name: "ראש העין", lat: 32.0956, lng: 34.9566 },
  { name: "שוהם", lat: 31.9987, lng: 34.9461 },
  { name: "אור יהודה", lat: 32.0298, lng: 34.8549 },
  { name: "קריית אונו", lat: 32.0636, lng: 34.8553 },
  { name: "יהוד-מונוסון", lat: 32.0333, lng: 34.8833 },
  { name: "כפר יונה", lat: 32.3171, lng: 34.9356 },
  { name: "חדרה", lat: 32.434, lng: 34.9196 },
  { name: "זכרון יעקב", lat: 32.5707, lng: 34.9527 },
  { name: "קיסריה", lat: 32.5009, lng: 34.9035 },
  { name: "עפולה", lat: 32.6078, lng: 35.2897 },
  { name: "נצרת", lat: 32.6996, lng: 35.3035 },
  { name: "כרמיאל", lat: 32.9171, lng: 35.305 },
  { name: "עכו", lat: 32.9281, lng: 35.0764 },
  { name: "נהריה", lat: 33.0089, lng: 35.0981 },
  { name: "קריית שמונה", lat: 33.2079, lng: 35.5702 },
  { name: "טבריה", lat: 32.7959, lng: 35.531 },
  { name: "צפת", lat: 32.9646, lng: 35.496 },
  { name: "קריית ביאליק", lat: 32.8275, lng: 35.0856 },
  { name: "קריית מוצקין", lat: 32.8379, lng: 35.0774 },
  { name: "קריית אתא", lat: 32.8097, lng: 35.1061 },
  { name: "יקנעם עילית", lat: 32.6594, lng: 35.1053 },
  { name: "בית שמש", lat: 31.7514, lng: 34.9886 },
  { name: "מבשרת ציון", lat: 31.8017, lng: 35.1503 },
  { name: "מעלה אדומים", lat: 31.7774, lng: 35.2981 },
  { name: "קריית גת", lat: 31.61, lng: 34.7642 },
  { name: "דימונה", lat: 31.0684, lng: 35.0333 },
  { name: "אילת", lat: 29.5577, lng: 34.9519 },
  { name: "גדרה", lat: 31.8146, lng: 34.7797 },
  { name: "אבן יהודה", lat: 32.27, lng: 34.8875 },
  { name: "פרדס חנה-כרכור", lat: 32.4747, lng: 34.9744 },
];

export const RADIUS_OPTIONS = [1, 3, 5, 10, 25, 50];

export function distanceKm(a?: string | null, b?: string | null): number | null {
  const ca = CITIES.find((c) => c.name === a);
  const cb = CITIES.find((c) => c.name === b);
  if (!ca || !cb) return null;
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(cb.lat - ca.lat);
  const dLng = toRad(cb.lng - ca.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(ca.lat)) * Math.cos(toRad(cb.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function categoryLabel(id: string) {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

/** Normalize an Israeli phone number to E.164 (+972...). Returns null if invalid. */
export function normalizePhone(input: string): string | null {
  const digits = input.replace(/[^\d+]/g, "");
  let d = digits.startsWith("+") ? digits.slice(1) : digits;
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("0")) d = "972" + d.slice(1);
  if (!/^\d{10,15}$/.test(d)) return null;
  return "+" + d;
}

export function whatsappLink(phoneE164: string, text?: string) {
  const n = phoneE164.replace(/\D/g, "");
  return `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}
