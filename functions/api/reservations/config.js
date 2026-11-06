export function onRequestGet({env}) {
  const ready=Boolean(env.TURNSTILE_SITE_KEY&&env.TURNSTILE_SECRET_KEY&&env.RESERVATION_SUBMIT_SECRET);
  return Response.json({ready,siteKey:ready?env.TURNSTILE_SITE_KEY:null},{headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}
