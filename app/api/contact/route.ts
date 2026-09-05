import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  const { name, email, msg } = await req.json()

  if (!name?.trim() || !email?.trim() || !msg?.trim()) {
    return NextResponse.json({ ok: false, error: 'Todos los campos son requeridos.' }, { status: 400 })
  }

  try {
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: process.env.RESEND_TO!,
      subject: 'Nuevo mensaje de Arcade Vault',
      text: `Nombre: ${name}\nEmail: ${email}\n\nMensaje:\n${msg}`,
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
