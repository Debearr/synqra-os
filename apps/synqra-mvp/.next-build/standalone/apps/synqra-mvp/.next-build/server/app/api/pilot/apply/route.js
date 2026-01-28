(()=>{var e={};e.id=8809,e.ids=[4291,8809],e.modules={846:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},4870:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},3295:e=>{"use strict";e.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},9294:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-async-storage.external.js")},3033:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},1063:(e,t,a)=>{"use strict";a.r(t),a.d(t,{patchFetch:()=>S,routeModule:()=>y,serverHooks:()=>x,workAsyncStorage:()=>g,workUnitAsyncStorage:()=>h});var r={};a.r(r),a.d(r,{GET:()=>f,POST:()=>v});var i=a(1271),s=a(1232),o=a(8079),n=a(1238),l=a(2892),p=a(4493);let c=p.Ik({fullName:p.Yj().min(2,"Name must be at least 2 characters").max(100,"Name must be less than 100 characters").trim(),email:p.Yj().email("Please enter a valid email address").toLowerCase().trim(),companyName:p.Yj().min(2,"Company name must be at least 2 characters").max(100,"Company name must be less than 100 characters").trim(),role:p.Yj().min(2,"Role must be at least 2 characters").max(100,"Role must be less than 100 characters").trim(),companySize:p.k5(["1-10","11-50","51-200","201-500","500+"],{message:"Please select a company size"}),linkedinProfile:p.Yj().url("Please enter a valid LinkedIn URL").regex(/linkedin\.com/,"Please enter a valid LinkedIn profile URL").optional().or(p.eu("")),whyPilot:p.Yj().min(50,"Please provide at least 50 characters").max(1e3,"Please keep your response under 1000 characters").trim()});function d(){let e={smtpHost:process.env.SMTP_HOST||"",smtpPort:parseInt(process.env.SMTP_PORT||"465",10),smtpSecure:"true"===process.env.SMTP_SECURE,smtpUser:process.env.SMTP_USER||"",smtpPass:process.env.SMTP_PASS||"",fromEmail:process.env.FROM_EMAIL||"noreply@synqra.com",adminEmail:process.env.ADMIN_EMAIL||""};return e.smtpHost&&e.smtpUser&&e.smtpPass?e:null}async function m(e){let t=d();if(!t)return console.warn("[Email] SMTP not configured, skipping applicant email"),{success:!1,error:"Email not configured"};try{let a={to:e.email,from:t.fromEmail,subject:"Application Received — Synqra Founder Pilot",html:`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #0A0A0A; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .header { text-align: center; margin-bottom: 40px; }
    .title { font-size: 28px; font-weight: 600; letter-spacing: 0.075em; color: #0A0A0A; margin: 0; }
    .content { background: #F5F3F0; padding: 32px; border-radius: 8px; margin: 24px 0; }
    .steps { margin: 24px 0; }
    .step { display: flex; gap: 12px; margin: 16px 0; }
    .step-number { background: rgba(45, 212, 191, 0.15); color: #2DD4BF; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; flex-shrink: 0; }
    .footer { text-align: center; margin-top: 40px; color: #666; font-size: 14px; }
    .cta { display: inline-block; background: #C5A572; color: #0A0A0A; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 700; letter-spacing: 0.025em; text-transform: uppercase; font-size: 14px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="title">Application Received</h1>
      <p style="color: #666; margin-top: 8px;">Synqra Founder Pilot</p>
    </div>
    
    <p>Hi ${e.fullName},</p>
    
    <p>Thank you for applying to the Synqra Founder Pilot program. We've received your application and our team will review it within the next 24 hours.</p>
    
    <div class="content">
      <h3 style="margin-top: 0; color: #C5A572; font-size: 14px; letter-spacing: 0.15em; text-transform: uppercase;">What Happens Next</h3>
      <div class="steps">
        <div class="step">
          <div class="step-number">1</div>
          <div>Our team will review your application within 24 hours</div>
        </div>
        <div class="step">
          <div class="step-number">2</div>
          <div>Check your email for approval notification and payment link</div>
        </div>
        <div class="step">
          <div class="step-number">3</div>
          <div>Once approved, complete payment to secure your founder spot</div>
        </div>
        <div class="step">
          <div class="step-number">4</div>
          <div>You'll receive onboarding instructions immediately after payment</div>
        </div>
      </div>
    </div>
    
    <p><strong>Application Details:</strong></p>
    <ul style="color: #666;">
      <li><strong>Company:</strong> ${e.companyName}</li>
      <li><strong>Role:</strong> ${e.role}</li>
      <li><strong>Company Size:</strong> ${e.companySize} employees</li>
    </ul>
    
    <p>Questions? Reply to this email or reach out to <a href="mailto:pilot@synqra.com" style="color: #2DD4BF;">pilot@synqra.com</a></p>
    
    <div class="footer">
      <p style="margin: 0;">N\xd8ID \xd7 Synqra</p>
      <p style="margin: 4px 0; font-style: italic; color: #999;">"Drive Unseen. Earn Smart."</p>
    </div>
  </div>
</body>
</html>
  `.trim()};return console.log("[Email] Applicant confirmation email:",{to:a.to,subject:a.subject}),{success:!0}}catch(e){return console.error("[Email] Failed to send applicant email:",e),{success:!1,error:e.message}}}async function u(e){let t=d();if(!t||!t.adminEmail)return console.warn("[Email] Admin email not configured, skipping notification"),{success:!1,error:"Admin email not configured"};try{let a={to:t.adminEmail,from:t.fromEmail,subject:`🚀 New Pilot Application: ${e.fullName} (${e.companyName})`,html:`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #0A0A0A; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .alert { background: rgba(45, 212, 191, 0.1); border-left: 4px solid #2DD4BF; padding: 20px; margin: 24px 0; }
    .field { margin: 16px 0; padding: 12px; background: #F5F3F0; border-radius: 4px; }
    .label { font-weight: 600; color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; }
    .value { margin-top: 4px; color: #0A0A0A; }
    .cta { display: inline-block; background: #C5A572; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="alert">
      <h2 style="margin: 0 0 8px 0;">🚀 New Pilot Application</h2>
      <p style="margin: 0; color: #666;">Review and approve within 24 hours</p>
    </div>
    
    <div class="field">
      <div class="label">Applicant</div>
      <div class="value">${e.fullName}</div>
    </div>
    
    <div class="field">
      <div class="label">Email</div>
      <div class="value"><a href="mailto:${e.email}">${e.email}</a></div>
    </div>
    
    <div class="field">
      <div class="label">Company</div>
      <div class="value">${e.companyName}</div>
    </div>
    
    <div class="field">
      <div class="label">Role</div>
      <div class="value">${e.role}</div>
    </div>
    
    <div class="field">
      <div class="label">Company Size</div>
      <div class="value">${e.companySize} employees</div>
    </div>
    
    ${e.linkedinProfile?`
    <div class="field">
      <div class="label">LinkedIn</div>
      <div class="value"><a href="${e.linkedinProfile}">${e.linkedinProfile}</a></div>
    </div>
    `:""}
    
    <div class="field">
      <div class="label">Why Pilot?</div>
      <div class="value">${e.whyPilot}</div>
    </div>
    
    <p style="margin-top: 32px;">
      <a href="https://supabase.com/dashboard" class="cta">Review in Dashboard →</a>
    </p>
    
    <p style="color: #666; font-size: 14px; margin-top: 32px;">
      <strong>Next Steps:</strong><br>
      1. Review application in Supabase dashboard<br>
      2. Approve/Reject within 24 hours<br>
      3. If approved, system will send payment link (Phase 4)
    </p>
  </div>
</body>
</html>
  `.trim()};return console.log("[Email] Admin notification email:",{to:a.to,subject:a.subject}),{success:!0}}catch(e){return console.error("[Email] Failed to send admin email:",e),{success:!1,error:e.message}}}async function v(e){try{let t=await e.json(),a=c.safeParse(t);if(!a.success)return n.NextResponse.json({ok:!1,error:"validation_failed",message:"Please check your form inputs",details:a.error.issues},{status:400});let r=a.data,i=(0,l.H)(),{data:s}=await i.from("pilot_applications").select("id, email, status").eq("email",r.email.toLowerCase()).single();if(s)return n.NextResponse.json({ok:!1,error:"duplicate_application",message:"You have already applied to the Founder Pilot program. Check your email for updates."},{status:409});let{data:o,error:p}=await i.from("pilot_applications").insert([{full_name:r.fullName,email:r.email.toLowerCase(),company_name:r.companyName,role:r.role,company_size:r.companySize,linkedin_profile:r.linkedinProfile||null,why_pilot:r.whyPilot,status:"pending",source:"web",user_agent:e.headers.get("user-agent")||"unknown",metadata:{submitted_at:new Date().toISOString(),referrer:e.headers.get("referer")||"direct"}}]).select().single();if(p)return console.error("[Pilot API] Database insert error:",p),n.NextResponse.json({ok:!1,error:"database_error",message:"Failed to submit application. Please try again."},{status:500});return Promise.all([m({fullName:r.fullName,email:r.email,companyName:r.companyName,role:r.role,companySize:r.companySize,linkedinProfile:r.linkedinProfile,whyPilot:r.whyPilot}),u({fullName:r.fullName,email:r.email,companyName:r.companyName,role:r.role,companySize:r.companySize,linkedinProfile:r.linkedinProfile,whyPilot:r.whyPilot})]).then(([e,t])=>{console.log("[Pilot API] Email notifications sent:",{applicant:e.success,admin:t.success})}).catch(e=>{console.error("[Pilot API] Email notification error:",e)}),console.log("[Pilot API] Application submitted successfully:",{id:o.id,email:r.email,company:r.companyName}),n.NextResponse.json({ok:!0,message:"Application submitted successfully",data:{id:o.id,status:o.status}})}catch(e){return console.error("[Pilot API] Unexpected error:",e),n.NextResponse.json({ok:!1,error:"server_error",message:"An unexpected error occurred. Please try again."},{status:500})}}async function f(e){try{let{searchParams:t}=new URL(e.url),a=t.get("email");if(!a)return n.NextResponse.json({ok:!1,error:"Email parameter required"},{status:400});let r=(0,l.H)(),{data:i,error:s}=await r.from("pilot_applications").select("id, status, applied_at").eq("email",a.toLowerCase()).single();if(s||!i)return n.NextResponse.json({ok:!1,error:"Application not found"},{status:404});return n.NextResponse.json({ok:!0,data:{id:i.id,status:i.status,appliedAt:i.applied_at}})}catch(e){return console.error("[Pilot API] GET error:",e),n.NextResponse.json({ok:!1,error:"Server error"},{status:500})}}let y=new i.AppRouteRouteModule({definition:{kind:s.RouteKind.APP_ROUTE,page:"/api/pilot/apply/route",pathname:"/api/pilot/apply",filename:"route",bundlePath:"app/api/pilot/apply/route"},resolvedPagePath:"C:\\Projects\\Synqra\\apps\\synqra-mvp\\app\\api\\pilot\\apply\\route.ts",nextConfigOutput:"standalone",userland:r}),{workAsyncStorage:g,workUnitAsyncStorage:h,serverHooks:x}=y;function S(){return(0,o.patchFetch)({workAsyncStorage:g,workUnitAsyncStorage:h})}},7032:()=>{},408:()=>{},2892:(e,t,a)=>{"use strict";a.d(t,{H:()=>n});var r=a(1525),i=a(4291);let s=null,o=null;try{let e=(0,i.getSupabaseUrl)(),t=(0,i.F)();s=(0,r.createClient)(e,t,{auth:{persistSession:!1,autoRefreshToken:!1},db:{schema:"public"}})}catch(e){o=e instanceof Error?e:Error("Unknown Supabase admin init error"),s=null}function n(){if(!s)throw Error("❌ Supabase Admin client not available. Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in Railway Variables and restart."+(o?` Details: ${o.message}`:""));return s}},4291:(e,t,a)=>{"use strict";a.d(t,{F:()=>n,getSupabaseAnonKey:()=>o,getSupabaseUrl:()=>s});let r=["SUPABASE_SERVICE_KEY","SUPABASE_SERVICE_ROLE"];function i(e,t){if(!e||""===e.trim())throw Error(`[Supabase Env] ${t} is missing or empty`);return e}function s(){let e=i(process.env.SUPABASE_URL,"SUPABASE_URL");return function(e,t){try{let a=new URL(e);if("http:"!==a.protocol&&"https:"!==a.protocol)throw Error(`[Supabase Env] ${t} must start with http:// or https://`)}catch(e){throw Error(`[Supabase Env] ${t} is invalid: ${e instanceof Error?e.message:"Unknown URL error"}`)}}(e,"SUPABASE_URL"),e}function o(){return i(process.env.SUPABASE_ANON_KEY,"SUPABASE_ANON_KEY")}function n(){let e=process.env.SUPABASE_SERVICE_ROLE_KEY;if(e&&""!==e.trim())return e;for(let e of r){let t=process.env[e];if(t&&""!==t.trim())return console.warn(`[Supabase Env] Falling back to ${e}. Set SUPABASE_SERVICE_ROLE_KEY and restart.`),t}throw Error("[Supabase Env] SUPABASE_SERVICE_ROLE_KEY is missing or empty")}}};var t=require("../../../../webpack-runtime.js");t.C(e);var a=e=>t(t.s=e),r=t.X(0,[6207,8048,1525,4493],()=>a(1063));module.exports=r})();