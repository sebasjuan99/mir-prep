export async function verifyTurnstile(token: string): Promise<boolean> {
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: new URLSearchParams({
      secret: process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY!,
      response: token,
    }),
  })
  const data = await res.json()
  return data.success === true
}
