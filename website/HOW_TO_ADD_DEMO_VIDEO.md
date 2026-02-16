# How to Add a Demo Video

## Quick Overview
The "Watch Demo" button opens a modal that can play a video from YouTube, Vimeo, Loom, or any video hosting service.

---

## Option 1: YouTube (Recommended)

### Step 1: Upload Video to YouTube
1. Record your demo (2-5 minutes ideal)
2. Upload to YouTube
3. Get the video ID from URL: `https://www.youtube.com/watch?v=VIDEO_ID`

### Step 2: Update index.html
Find line ~933 in `website/index.html` and update:

```javascript
function openDemoModal() {
    document.getElementById('demo-modal').classList.remove('hidden');
    plausible('Open Demo Modal');

    // Add this - replace YOUR_VIDEO_ID with actual YouTube ID
    const videoFrame = document.getElementById('demo-video');
    videoFrame.src = 'https://www.youtube.com/embed/YOUR_VIDEO_ID?autoplay=1';
    document.getElementById('video-placeholder').classList.add('hidden');
}
```

**Example:**
If your YouTube URL is: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`

Update to:
```javascript
videoFrame.src = 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1';
```

---

## Option 2: Loom

### Step 1: Record with Loom
1. Install Loom browser extension
2. Record your screen demo
3. Get shareable link: `https://www.loom.com/share/VIDEO_ID`

### Step 2: Update index.html
```javascript
function openDemoModal() {
    document.getElementById('demo-modal').classList.remove('hidden');
    plausible('Open Demo Modal');

    const videoFrame = document.getElementById('demo-video');
    videoFrame.src = 'https://www.loom.com/embed/YOUR_LOOM_ID?autoplay=1';
    document.getElementById('video-placeholder').classList.add('hidden');
}
```

---

## Option 3: Vimeo

### Step 1: Upload to Vimeo
1. Upload video to Vimeo
2. Get video URL: `https://vimeo.com/VIDEO_ID`

### Step 2: Update index.html
```javascript
function openDemoModal() {
    document.getElementById('demo-modal').classList.remove('hidden');
    plausible('Open Demo Modal');

    const videoFrame = document.getElementById('demo-video');
    videoFrame.src = 'https://player.vimeo.com/video/YOUR_VIDEO_ID?autoplay=1';
    document.getElementById('video-placeholder').classList.add('hidden');
}
```

---

## Option 4: Self-Hosted Video

### Step 1: Upload to Your Server
```bash
# Upload video file
scp demo.mp4 user@server:/var/www/synthient/assets/

# Or commit to repo
git add website/public/demo.mp4
```

### Step 2: Replace iframe with HTML5 video
In `website/index.html`, find the demo modal (around line 342) and replace the iframe:

```html
<!-- Replace the entire iframe with: -->
<video id="demo-video" width="100%" height="100%" controls autoplay class="w-full h-full">
    <source src="/assets/demo.mp4" type="video/mp4">
    Your browser does not support the video tag.
</video>
```

Then update the JavaScript:
```javascript
function openDemoModal() {
    document.getElementById('demo-modal').classList.remove('hidden');
    plausible('Open Demo Modal');
    document.getElementById('video-placeholder').classList.add('hidden');

    const video = document.getElementById('demo-video');
    video.play();
}

function closeDemoModal(event) {
    if (!event || event.target.id === 'demo-modal' || event.type === 'click') {
        document.getElementById('demo-modal').classList.add('hidden');
        const video = document.getElementById('demo-video');
        video.pause();
        video.currentTime = 0;
    }
}
```

---

## Demo Video Best Practices

### Content Recommendations
1. **Keep it short:** 2-5 minutes maximum
2. **Show results first:** Start with the end result, then explain how
3. **Use real examples:** Show actual agent building, not slides
4. **Add captions:** Many viewers watch without sound

### Structure
```
0:00 - 0:15  Hook: "Watch me build a production agent in 3 minutes"
0:15 - 1:00  Show the final result working
1:00 - 2:30  Walk through the building process
2:30 - 3:00  Highlight key features (token efficiency, learning, etc.)
3:00 - 3:30  Call to action: "Try it free"
```

### Recording Tips
- **Resolution:** 1920x1080 (1080p) minimum
- **Frame rate:** 30fps minimum
- **Screen recording tool:** Loom, OBS Studio, or ScreenFlow
- **Audio:** Clear microphone, minimal background noise
- **Editing:** Cut out pauses, speed up slow parts (1.5x)

### What to Show
1. **Open terminal/CLI**
2. **Run command:** `synthient create "customer support bot"`
3. **Show progress:** Pattern learning, knowledge base generation
4. **Show output:** Generated files, tests passing
5. **Run the agent:** Demonstrate it actually working
6. **Show the code:** Brief look at generated code quality

### Recording Script Example
```
"Hi, I'm going to show you how Synthient builds a production-ready
AI agent in under 5 minutes.

[Type command]

Watch as it analyzes my codebase, learns my patterns, and generates
an ultra-concise 200-token skill with a complete knowledge base.

[Show progress bar]

In just 3 minutes, we have a fully functional customer support bot
with tests, documentation, and deployment config.

[Show the running agent]

Let me show you the code it generated...

[Scroll through code briefly]

Notice how it matches my coding style and includes error handling.

Want to try it? Get early access at getsynthient.com"
```

---

## Testing Your Video

After adding the video URL:

1. **Refresh page:** http://localhost:8080
2. **Click "Watch Demo"**
3. **Verify:**
   - ✅ Modal opens
   - ✅ Video loads and plays
   - ✅ Sound works (if audio included)
   - ✅ Pressing ESC closes modal
   - ✅ Video stops when closed
   - ✅ Mobile-responsive (test on phone)

---

## Troubleshooting

### Video doesn't load
- **Check video ID** is correct
- **Check privacy settings** on YouTube/Vimeo (must be public or unlisted)
- **Check CORS** if self-hosted (add headers)
- **Check browser console** for errors

### Video is tiny/cropped
- Verify `aspect-video` class is on container
- Check iframe width/height are "100%"
- Test on different screen sizes

### Autoplay doesn't work
- Modern browsers block autoplay with sound
- Add `muted` parameter: `?autoplay=1&muted=1`
- Or remove autoplay and let users click play

### Slow loading
- **Compress video:** Use HandBrake or similar
- **Target bitrate:** 2-5 Mbps for 1080p
- **Use CDN:** If self-hosted
- **Consider thumbnail:** Load poster image first

---

## Alternative: GIF Animation

If you want a quick preview without video:

1. **Create animated GIF** (max 5MB)
2. **Replace iframe with image:**

```html
<img
    src="/assets/demo.gif"
    alt="Synthient Demo"
    class="w-full h-full object-contain"
>
```

**Tools to create GIF:**
- ScreenToGif (Windows)
- LICEcap (Mac/Windows)
- Kap (Mac)
- CloudConvert (convert video to GIF)

---

## Need Help?

- **Video too large?** Compress with HandBrake
- **Need screen recording?** Try Loom (free tier available)
- **Editing help?** DaVinci Resolve is free
- **Thumbnail creation?** Canva has free video thumbnail templates

---

## Quick Reference

**YouTube embed:**
```
https://www.youtube.com/embed/VIDEO_ID?autoplay=1
```

**Loom embed:**
```
https://www.loom.com/embed/VIDEO_ID?autoplay=1
```

**Vimeo embed:**
```
https://player.vimeo.com/video/VIDEO_ID?autoplay=1
```

**Self-hosted:**
```html
<video controls autoplay>
    <source src="/path/to/video.mp4" type="video/mp4">
</video>
```

---

**Last Updated:** 2026-02-16
**Estimated Setup Time:** 15 minutes (after video is recorded)
