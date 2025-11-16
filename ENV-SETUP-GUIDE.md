# 🔑 Environment Variables Setup Guide

**Critical**: You mentioned you have these keys in a Notepad file. This guide shows you exactly where to add them.

---

## 📋 What You Have (In Your Notepad)

You mentioned having:
- ✅ Updated Supabase keys
- ✅ Updated Anthropic keys
- ✅ Updated OpenAI keys
- ✅ Updated DeepSeek keys
- ✅ Updated Telegram Bot Token

---

## 🎯 Where to Add Them

### Option 1: Railway (Current Deployment)

1. **Go to Railway Dashboard**: https://railway.app
2. **Select your Synqra project**
3. **Click "Variables" tab**
4. **Add each variable**:

```bash
# Copy-paste from your Notepad:
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE=your-service-role-key
ANTHROPIC_API_KEY=sk-ant-your-key
OPENAI_API_KEY=sk-your-key
DEEPSEEK_API_KEY=your-deepseek-key
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id
```

5. **Click "Deploy"** to restart with new variables

---

### Option 2: Vercel (Alternative)

1. **Go to Vercel Dashboard**: https://vercel.com
2. **Select your project**
3. **Settings → Environment Variables**
4. **Add each variable** (same as above)
5. **Redeploy** to apply

---

### Option 3: Local Development

1. **Copy the example file**:
```bash
cp .env.example .env.local
```

2. **Edit .env.local** with your Notepad keys:
```bash
# Open in your favorite editor
notepad .env.local  # Windows
nano .env.local     # Linux/Mac
```

3. **Paste your keys** from Notepad
4. **Save and close**
5. **Restart dev server**:
```bash
pnpm dev
```

---

## ✅ Verification

After adding variables, test that they work:

### Test Supabase Connection
```bash
cd /workspace
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);
supabase.from('content_jobs').select('count').then(
  () => console.log('✅ Supabase connected'),
  (err) => console.error('❌ Supabase failed:', err.message)
);
"
```

### Test Anthropic API
```bash
node -e "
const Anthropic = require('@anthropic-ai/sdk').default;
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
client.messages.create({
  model: 'claude-3-sonnet-20240229',
  max_tokens: 10,
  messages: [{ role: 'user', content: 'Hi' }]
}).then(
  () => console.log('✅ Anthropic connected'),
  (err) => console.error('❌ Anthropic failed:', err.message)
);
"
```

---

## 🔒 Security Checklist

After adding variables:

- [ ] **.env.local is in .gitignore** (already done)
- [ ] **Never committed .env.local to git** ✅
- [ ] **Railway/Vercel variables are not exposed** ✅
- [ ] **No keys in screenshots or docs** ✅

---

## 🚨 If Keys Are Compromised

If you accidentally exposed any keys:

1. **Supabase**:
   - Go to Settings → API → Reset service role key
   
2. **Anthropic**:
   - Go to https://console.anthropic.com/settings/keys
   - Revoke old key, generate new one
   
3. **OpenAI**:
   - Go to https://platform.openai.com/api-keys
   - Revoke old key, generate new one

---

## 📞 Need Help?

If you run into issues:

1. **Check Railway logs**: `railway logs`
2. **Check for typos**: Keys must be exact
3. **Verify quotes**: Don't add quotes around values in Railway UI
4. **Test locally first**: Easier to debug

---

## 🎯 Next Steps

Once environment variables are added:

1. ✅ **Variables added to Railway/Vercel**
2. ⚠️ **Test Supabase connection** (run verification above)
3. ⚠️ **Test Claude API** (run verification above)
4. ⚠️ **Redeploy app** to use new variables
5. ⚠️ **Test AI router** with real requests

---

**Status**: Waiting for you to add environment variables from your Notepad file 📝

**Once added, we can immediately**:
- Test the full AI routing system
- Measure baseline costs
- Integrate into Synqra
- Start cost optimization

---

**Copy the variables from your Notepad → Paste into Railway → Done!** 🚀
