# Synthient.dev Domain Setup Guide

Complete guide to purchasing and setting up your .dev domain.

---

## Quick Facts

- **Cost:** $9.77 - $15/year depending on registrar
- **Renewal:** Same price (avoid GoDaddy's renewal markup)
- **SSL Required:** Yes (automatic with Vercel/Netlify)
- **Setup Time:** 15-20 minutes total
- **DNS Propagation:** 5-60 minutes

---

## Step-by-Step Setup

### Phase 1: Purchase Domain (5 minutes)

#### Option A: Cloudflare (Recommended - $9.77/year)

1. **Sign up for Cloudflare:**
   - Visit: https://dash.cloudflare.com/sign-up
   - Create free account

2. **Purchase domain:**
   - Go to: https://dash.cloudflare.com/domain-registration
   - Search: `getsynthient.com`
   - Click "Purchase" ($9.77/year)
   - Complete payment

3. **Done!** DNS is automatically configured

#### Option B: Google Domains ($12/year)

1. **Visit:** https://domains.google.com
2. **Search:** `getsynthient.com`
3. **Purchase:** $12/year
4. **Complete checkout**

---

### Phase 2: Deploy Website (5 minutes)

We'll use **Vercel** (free tier includes custom domain + SSL).

#### Install Vercel CLI
```bash
npm install -g vercel
```

#### Deploy
```bash
cd /Users/mayankgupta/Github/Work/agent-builder/website
vercel --prod
```

**Follow prompts:**
```
? Set up and deploy? Yes
? Which scope? [Your account]
? Link to existing project? No
? What's your project's name? synthient
? In which directory is your code? ./
? Want to modify settings? No
```

**Output:**
```
✅ Production: https://synthient-xyz.vercel.app
```

---

### Phase 3: Connect Custom Domain (5 minutes)

#### Add Domain to Vercel

**Method 1: CLI (easiest)**
```bash
vercel domains add getsynthient.com
vercel domains add www.getsynthient.com
```

**Method 2: Dashboard**
1. Visit: https://vercel.com/dashboard
2. Select your project → Settings → Domains
3. Add domain: `getsynthient.com`
4. Add domain: `www.getsynthient.com`

**Vercel will show DNS records to add:**
```
Type: CNAME
Name: @
Value: cname.vercel-dns.com
```

---

#### Configure DNS Records

**If using Cloudflare:**

1. Go to: https://dash.cloudflare.com
2. Select domain → DNS → Records
3. Add records:

```
Type    Name    Target                  Proxy
────────────────────────────────────────────────
CNAME   @       cname.vercel-dns.com    🟠 OFF
CNAME   www     cname.vercel-dns.com    🟠 OFF
```

**⚠️ Important:** Turn OFF Cloudflare proxy (orange cloud) for Vercel to manage SSL

**If using Google Domains:**

1. Go to: https://domains.google.com/registrar
2. Select domain → DNS → Custom records
3. Add records:

```
Type    Host    Data
────────────────────────────────────
CNAME   @       cname.vercel-dns.com
CNAME   www     cname.vercel-dns.com
```

---

### Phase 4: Verify Setup (5-60 minutes)

DNS propagation takes time. Check progress:

```bash
# Check if DNS is propagated
dig getsynthient.com

# Should show:
# getsynthient.com.  300  IN  CNAME  cname.vercel-dns.com.
```

**Or use online tools:**
- https://dnschecker.org
- https://www.whatsmydns.net

**When ready:**
```
✅ https://getsynthient.com (works)
✅ https://www.getsynthient.com (works)
✅ http://getsynthient.com (redirects to HTTPS)
✅ SSL certificate (automatic)
```

---

## Troubleshooting

### DNS Not Propagating

**Problem:** Domain still shows old/no records after 10 minutes

**Solution:**
```bash
# Clear local DNS cache

# macOS
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder

# Windows
ipconfig /flushdns

# Linux
sudo systemd-resolve --flush-caches
```

### SSL Certificate Not Working

**Problem:** "Your connection is not private" error

**Cause:** DNS not fully propagated to Vercel

**Solution:**
1. Wait 10-30 more minutes
2. Check Vercel dashboard for SSL status
3. Force SSL renewal: Vercel Dashboard → Settings → Domains → Refresh

### Cloudflare Proxy Issues

**Problem:** Site not loading with Cloudflare

**Solution:**
- Turn OFF proxy (orange cloud icon) in Cloudflare DNS
- Vercel needs direct DNS access for SSL

### "Domain is already in use"

**Problem:** Vercel says domain is taken

**Solution:**
```bash
# Remove domain
vercel domains rm getsynthient.com

# Add again
vercel domains add getsynthient.com
```

---

## Cost Comparison

| Registrar | Year 1 | Renewal | Total 3 Years |
|-----------|--------|---------|---------------|
| **Cloudflare** | $9.77 | $9.77 | $29.31 |
| **Porkbun** | $10.39 | $10.39 | $31.17 |
| **Google Domains** | $12 | $12 | $36 |
| **Namecheap** | $11.98 | $14.98 | $41.94 |
| **GoDaddy** | $2.99* | $19.99 | $42.97 |

*GoDaddy uses predatory pricing - cheap first year, expensive renewal

**Winner:** Cloudflare ($9.77/year, no markup)

---

## Alternative Hosting Options

### Option 1: Netlify (Also Free)

```bash
npm i -g netlify-cli
cd website
netlify deploy --prod

# Add custom domain:
# Dashboard → Domain settings → Add domain
```

**DNS for Netlify:**
```
Type    Host    Data
────────────────────────────────────
A       @       75.2.60.5
CNAME   www     synthient.netlify.app
```

### Option 2: GitHub Pages (Free)

```bash
# Create gh-pages branch
git checkout -b gh-pages
git push origin gh-pages

# Settings → Pages → Custom domain
# Add: getsynthient.com
```

**DNS for GitHub Pages:**
```
Type    Host    Data
────────────────────────────────────────
A       @       185.199.108.153
A       @       185.199.109.153
A       @       185.199.110.153
A       @       185.199.111.153
CNAME   www     yourusername.github.io
```

### Option 3: Self-Hosted

**DNS:**
```
Type    Host    Data
────────────────────────────────────
A       @       Your.Server.IP.Address
CNAME   www     getsynthient.com
```

**SSL Setup:**
```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d getsynthient.com -d www.getsynthient.com

# Auto-renewal (cron)
sudo certbot renew --dry-run
```

---

## Email Setup (Optional)

**If you want email@getsynthient.com:**

### Option 1: Forward to Gmail (Free)

**Cloudflare Email Routing:**
1. Cloudflare Dashboard → Email → Email Routing
2. Enable
3. Add destination: your@gmail.com
4. Create address: hello@getsynthient.com → your@gmail.com

**Google Workspace:**
- Cost: $6/user/month
- Professional email
- Google Docs, Drive, Meet

### Option 2: Zoho Mail (Free tier)

1. Sign up: https://www.zoho.com/mail/
2. Add domain: getsynthient.com
3. Verify ownership
4. Add MX records:

```
Priority  Host    Value
──────────────────────────────────
10        @       mx.zoho.com
20        @       mx2.zoho.com
```

---

## Automation Script

Run the setup script automatically:

```bash
cd website
chmod +x DOMAIN_SETUP.sh
./DOMAIN_SETUP.sh
```

This will:
- Install Vercel CLI if needed
- Deploy your site
- Add custom domain
- Provide DNS instructions

---

## Environment Variables

After deployment, set environment variables in Vercel:

```bash
# Via CLI
vercel env add ANTHROPIC_API_KEY
vercel env add DATABASE_URL
vercel env add FRONTEND_URL

# Or in Dashboard:
# Settings → Environment Variables
```

Example `.env.production`:
```bash
ANTHROPIC_API_KEY=sk-ant-...
DATABASE_URL=postgresql://...
FRONTEND_URL=https://getsynthient.com
```

---

## Post-Deployment Checklist

After domain is live:

- [ ] Test https://getsynthient.com
- [ ] Test https://www.getsynthient.com
- [ ] Verify SSL certificate
- [ ] Test email capture form
- [ ] Test demo modal
- [ ] Update analytics domain (line 8 in index.html)
- [ ] Update all GitHub links (YOUR_USERNAME → actual username)
- [ ] Set up email forwarding
- [ ] Add domain to Plausible analytics
- [ ] Test on mobile
- [ ] Test on different browsers
- [ ] Share on social media

---

## Useful Commands

```bash
# Check DNS propagation
dig getsynthient.com
nslookup getsynthient.com

# Check SSL certificate
openssl s_client -connect getsynthient.com:443 -servername getsynthient.com

# Test HTTPS redirect
curl -I http://getsynthient.com

# Deploy new version
vercel --prod

# View deployment logs
vercel logs

# List domains
vercel domains ls

# Remove domain
vercel domains rm getsynthient.com
```

---

## Support Resources

**Vercel:**
- Docs: https://vercel.com/docs
- Support: https://vercel.com/support

**Cloudflare:**
- Docs: https://developers.cloudflare.com
- Community: https://community.cloudflare.com

**DNS Tools:**
- https://dnschecker.org - Check propagation
- https://www.whatsmydns.net - Global DNS check
- https://mxtoolbox.com - Email/DNS diagnostics

---

## FAQ

**Q: How long until my domain works?**
A: 5-60 minutes for DNS propagation. Usually 10-15 minutes.

**Q: Can I use a different domain extension?**
A: Yes! The process is identical for .com, .io, .ai, etc.

**Q: Do I need to renew every year?**
A: Yes, but Cloudflare/Vercel will auto-renew if you enable it.

**Q: What if getsynthient.com is taken?**
A: Try alternatives:
- getgetsynthient.com
- synthient.io
- synthient.ai
- usesynthient.com

**Q: Can I transfer my domain later?**
A: Yes, domains can be transferred between registrars after 60 days.

**Q: Is HTTPS really required for .dev?**
A: Yes! It's enforced at the browser level. Vercel handles this automatically.

---

**Need Help?**

Open an issue or check:
- Vercel Discord: https://vercel.com/discord
- Cloudflare Community: https://community.cloudflare.com

---

**Estimated Total Cost:**
- Domain: $9.77/year (Cloudflare)
- Hosting: $0 (Vercel free tier)
- SSL: $0 (included)
- **Total: $9.77/year**

---

**Last Updated:** 2026-02-16
