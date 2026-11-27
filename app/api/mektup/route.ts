import { NextResponse } from "next/server";

const lastSent = new Map<string, number>();

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function POST(req: Request) {
  // basit spam engeli: aynı kişi 30 saniyede bir mektup atabilir
  const ip = req.headers.get("x-forwarded-for") ?? "bilinmiyor";
  const now = Date.now();
  if (now - (lastSent.get(ip) ?? 0) < 30_000) {
    return NextResponse.json({ error: "Biraz bekle." }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const from = String(body.from ?? "").trim().slice(0, 40);
  const title = String(body.title ?? "").trim().slice(0, 60);
  const contact = String(body.contact ?? "").trim().slice(0, 80);
  const message = String(body.message ?? "").trim().slice(0, 1000);

  if (!from || !title || !contact || !message) {
    return NextResponse.json({ error: "Boş alan var." }, { status: 400 });
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Kazan <onboarding@resend.dev>",
      to: [process.env.MEKTUP_EPOSTA],
      subject: `Kazandan mektup: ${title}`,
      html: `
        <p><b>Kimden:</b> ${esc(from)}</p>
        <p><b>İletişim:</b> ${esc(contact)}</p>
        <p><b>Başlık:</b> ${esc(title)}</p>
        <hr />
        <p style="white-space:pre-wrap">${esc(message)}</p>
      `,
    }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Gönderilemedi." }, { status: 502 });
  }

  lastSent.set(ip, now);
  return NextResponse.json({ ok: true });
}