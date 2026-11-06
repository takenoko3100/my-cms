const SUPABASE_URL='https://cshieomhxpuaclggicle.supabase.co';
const PUBLIC_KEY='sb_publishable_6mt_8wZcBX9aKPR04NzNBQ_StAq2Qbe';
const reply=(status,code,extra={})=>Response.json({code,...extra},{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
async function limitedBody(request){
 const reader=request.body?.getReader();if(!reader)throw new Error('body');let size=0,parts=[];
 try{while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>12000)throw new Error('body');parts.push(value);}}finally{await reader.cancel().catch(()=>{});}
 const joined=new Uint8Array(size);let at=0;for(const part of parts){joined.set(part,at);at+=part.length;}return JSON.parse(new TextDecoder().decode(joined));
}
export async function onRequestPost({request,env}) {
 try{
  const url=new URL(request.url);
  if(request.headers.get('Origin')!==url.origin||!request.headers.get('Content-Type')?.startsWith('application/json'))return reply(403,'invalid_request');
  if(!env.RESERVATION_SUBMIT_SECRET||!env.TURNSTILE_SITE_KEY||!env.TURNSTILE_SECRET_KEY)return reply(503,'not_configured');
  let body;try{body=await limitedBody(request);}catch{return reply(400,'invalid_request');}
  if(!body||typeof body!=='object'||Array.isArray(body)||typeof body.slug!=='string'||!(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).test(body.slug)||body.slug.length>160||typeof body.requestId!=='string'||!(/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i).test(body.requestId)||typeof body.date!=='string'||!/^20\d{2}-\d{2}-\d{2}$/.test(body.date)||typeof body.time!=='string'||!/^([01]\d|2[0-3]):[0-5]\d$/.test(body.time)||!Number.isInteger(body.party)||body.party<1||body.party>30||typeof body.name!=='string'||!body.name.trim()||body.name.length>80||typeof body.email!=='string'||body.email.length>254||!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(body.email)||typeof body.note!=='string'||body.note.length>1000||body.consent!==true||typeof body.turnstileToken!=='string'||body.turnstileToken.length<1||body.turnstileToken.length>2048||body.website)return reply(400,'invalid_request');
  const ip=request.headers.get('CF-Connecting-IP');if(!ip)return reply(503,'unavailable');
  const verification=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body:new URLSearchParams({secret:env.TURNSTILE_SECRET_KEY,response:body.turnstileToken,remoteip:ip}),signal:AbortSignal.timeout(10000)});
  if(!verification.ok)return reply(503,'unavailable');
  const verified=await verification.json();if(verified.success!==true||verified.hostname!==url.hostname||verified.action!=='reservation_request')return reply(400,'verification_failed');
  const hashed=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(env.RESERVATION_SUBMIT_SECRET+'|'+ip));
  const ipHash=Array.from(new Uint8Array(hashed),b=>b.toString(16).padStart(2,'0')).join('');
  const response=await fetch(SUPABASE_URL+'/rest/v1/rpc/cms_submit_booking_request',{method:'POST',headers:{apikey:PUBLIC_KEY,'Content-Type':'application/json'},body:JSON.stringify({p_server_secret:env.RESERVATION_SUBMIT_SECRET,p_slug:body.slug,p_request_id:body.requestId,p_date:body.date,p_time:body.time,p_party:body.party,p_name:body.name.trim(),p_email:body.email.trim(),p_note:body.note.trim(),p_ip_hash:ipHash}),signal:AbortSignal.timeout(12000)});
  const result=await response.json();
  if(!response.ok){
   if(result.message==='booking_rate_limit')return reply(429,'rate_limited');
   if(['booking_date_unavailable','booking_unavailable','booking_idempotency_conflict'].includes(result.message))return reply(409,'availability_changed');
   return reply(503,'unavailable');
  }
  if(result.accepted!==true||result.reference!==body.requestId)return reply(503,'unavailable');
  return reply(200,'received',{reference:result.reference});
 }catch{return reply(503,'unavailable');} // Never log customer data, IPs, tokens or secrets.
}
export function onRequestOptions(){return new Response(null,{status:403});}
