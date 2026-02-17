# Synthient Marketing Website

Modern SaaS landing page for Synthient - the AI agent builder platform with ultra-concise skills, knowledge base generation, and pattern learning.

## 🎨 Design Features

- **Modern SaaS Design**: Inspired by Vercel, Linear, and modern SaaS products
- **Responsive**: Works perfectly on desktop, tablet, and mobile
- **Animated**: Smooth scroll animations and hover effects
- **Fast**: Pure HTML/CSS/JS with Tailwind CDN - loads instantly
- **SEO Ready**: Proper meta tags and semantic HTML

## ✨ New Features Highlighted

- **200-Token Ultra-Skills**: Generate ultra-concise skills optimized for token efficiency
- **Knowledge Base Generation**: Automatically crawl and structure documentation
- **Pattern Learning**: Learn from existing codebases to match your style

## 🚀 Quick Start

### Option 1: Open Directly
Simply open `index.html` in your browser:
```bash
open index.html  # macOS
xdg-open index.html  # Linux
start index.html  # Windows
```

### Option 2: Local Server (Recommended)
Use any local server. Here are some options:

**Python:**
```bash
python3 -m http.server 8000
# Visit http://localhost:8000
```

**Node.js (http-server):**
```bash
npx http-server -p 8000
# Visit http://localhost:8000
```

**PHP:**
```bash
php -S localhost:8000
# Visit http://localhost:8000
```

## 📝 Customization

### Update GitHub Links
Replace `YOUR_USERNAME` in the HTML with your actual GitHub username:
```html
<!-- Find and replace all instances of: -->
https://github.com/YOUR_USERNAME/synthient
```

### Update Social Links
Update Twitter, Discord, and other social links in the footer:
```html
<a href="https://twitter.com/YOUR_HANDLE">Twitter</a>
<a href="https://discord.gg/YOUR_INVITE">Discord</a>
```

### Change Colors
The color scheme uses Tailwind's purple/blue gradient. To change:

1. **Primary Gradient**: Look for `.gradient-bg` and `animated-gradient` classes
2. **Accent Colors**: Modify the Tailwind config in the `<script>` tag
3. **Text Gradient**: Update `.gradient-text` class

### Update Content
All content is in `index.html`:
- **Hero Section**: Lines 165-270
- **Features**: Lines 310-450
- **How It Works**: Lines 455-575
- **Pricing**: Lines 580-710
- **Get Started**: Lines 715-800

## 🎯 Sections

1. **Hero**: Compelling headline, CTA buttons, demo terminal
2. **Stats**: Key metrics (20-35 min build time, 30% savings, etc.)
3. **Features**: 6 key features with icons
4. **How It Works**: 5-phase workflow explanation
5. **Pricing**: Open source (free) vs LLM API costs
6. **Get Started**: Installation instructions with code block
7. **Footer**: Links, resources, social

## 🌐 Domain Suggestions

### Primary Options
- `synthient.ai` - Perfect for AI product
- `synthient.dev` - Great for developer tool
- `synthient.io` - Tech-focused alternative
- `synthient.com` - Traditional option

### Alternatives
- `getsynthient.com`
- `synthient.co`
- `usesynthient.com`

Check availability at:
- [Namecheap](https://www.namecheap.com)
- [Google Domains](https://domains.google)
- [Cloudflare Registrar](https://www.cloudflare.com/products/registrar/)

## 🚀 Deployment Options

### Free Hosting (Recommended for Static Sites)

**Vercel** (Best choice for this site):
```bash
npm i -g vercel
cd website
vercel
```
- Free SSL
- Global CDN
- Automatic deployments from Git

**Netlify**:
```bash
npm i -g netlify-cli
cd website
netlify deploy
```
- Free SSL
- Continuous deployment
- Form handling

**GitHub Pages**:
```bash
# Push to gh-pages branch
git subtree push --prefix website origin gh-pages
```
- Free hosting
- Custom domain support
- Simple setup

**Cloudflare Pages**:
- Connect GitHub repo
- Automatic deployments
- Free SSL & CDN

### Custom Server
If deploying to your own server:
```bash
# Copy files
scp -r website/* user@server:/var/www/synthient/

# Nginx config
server {
    listen 80;
    server_name synthient.ai;
    root /var/www/synthient;
    index index.html;
}
```

## 📱 Testing

### Responsive Testing
Test on different screen sizes:
- Desktop: 1920x1080, 1440x900
- Tablet: 768x1024, 834x1112
- Mobile: 375x667, 414x896

### Browser Testing
- Chrome/Edge (Chromium)
- Firefox
- Safari (important for gradients)
- Mobile browsers

### Performance
- Lighthouse score: Aim for 90+
- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s

## 🎨 Assets

### Logo
The animated gradient logo is CSS-based. For a custom logo:
1. Export SVG or PNG (recommend 512x512 for retina)
2. Replace the gradient div in navigation
3. Update favicon (see below)

### Favicon
Create a favicon:
```bash
# Add to <head>
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="icon" type="image/png" href="/favicon.png">
```

### Images
Currently using placeholder for demo GIF. Replace with actual:
```html
<!-- Line ~47 -->
<img src="/assets/demo.gif" alt="Synthient Demo">
```

## 📊 Analytics (Optional)

Add analytics tracking:

**Google Analytics:**
```html
<!-- Add before </head> -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_ID');
</script>
```

**Plausible (Privacy-friendly):**
```html
<script defer data-domain="synthient.ai" src="https://plausible.io/js/script.js"></script>
```

## 🔧 Build Process (Optional)

For production optimization:

```bash
# Install dependencies
npm install -D tailwindcss postcss autoprefixer

# Generate optimized CSS
npx tailwindcss -o dist/styles.css --minify

# Minify HTML
npm install -g html-minifier
html-minifier --collapse-whitespace --remove-comments index.html -o dist/index.html
```

## 📝 SEO Checklist

- [x] Title tag (< 60 characters)
- [x] Meta description (< 160 characters)
- [ ] Open Graph tags for social sharing
- [ ] Twitter Card tags
- [ ] Structured data (JSON-LD)
- [ ] Sitemap.xml
- [ ] Robots.txt
- [ ] SSL certificate (when deployed)

## 🎯 Next Steps

1. **Choose a domain** from suggestions above
2. **Update all GitHub links** with your username
3. **Test locally** to ensure everything works
4. **Create demo GIF/video** showing the product
5. **Deploy to Vercel/Netlify** for free hosting
6. **Set up analytics** to track visitors
7. **Add email capture** for early access (optional)

## 📧 Support

For questions about the website:
- Open an issue on GitHub
- Check the main project docs
- Join our Discord community

---

Built with ❤️ using Tailwind CSS and modern web standards.
