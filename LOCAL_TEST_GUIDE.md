# 🧪 LOCAL TESTING GUIDE — SYNQRA BRAND THEME

## Quick Start

### **Option 1: Standalone HTML Test** (Fastest)
```bash
# Open the test file in your browser
open apps/synqra-mvp/THEME_TEST.html

# OR on Linux
xdg-open apps/synqra-mvp/THEME_TEST.html

# OR on Windows
start apps/synqra-mvp/THEME_TEST.html
```

This standalone file demonstrates the exact CSS from `globals.css` with:
- ✅ Interactive theme toggle button
- ✅ Side-by-side dark/light comparison
- ✅ Live gradient color values
- ✅ Testing checklist
- ✅ Console logging of computed styles

---

### **Option 2: Full Next.js Dev Server**
```bash
# Start the dev server
npm run dev

# Open browser to:
http://localhost:3000

# To test light mode:
# 1. Open browser DevTools (F12)
# 2. In Console, run:
document.body.setAttribute('data-theme', 'light');

# To switch back to dark:
document.body.removeAttribute('data-theme');
```

---

## 📸 Screenshot Checklist

### **Before/After Comparison**

#### **BEFORE** (Previous Version)
Should show:
- [ ] Smaller text size
- [ ] Less letter spacing
- [ ] White/gray color (no gradient)
- [ ] Minimal visual presence

#### **AFTER** (Current Version)

**Dark Mode:**
- [ ] Large responsive text (clamp 2.8rem → 4rem)
- [ ] Wide letter spacing (0.15em)
- [ ] Champagne gold → cream gradient (#D4AF37 → #F5E6D3)
- [ ] Warm gold glow shadow (rgba 255,215,170,0.25)
- [ ] Text unmissable but elegant

**Light Mode:**
- [ ] Same size and spacing as dark mode
- [ ] Copper → champagne gold gradient (#B87333 → #D4AF37)
- [ ] Copper glow shadow (rgba 184,115,51,0.2)
- [ ] Maintains luxury aesthetic on light background

---

## ✅ Verification Tests

### **1. Visual Readability**
- [ ] "SYNQRA" text is immediately visible
- [ ] Gradient is smooth (no banding)
- [ ] Text shadow is subtle, not overpowering
- [ ] Letter spacing creates architectural feel
- [ ] "Perfect Draft Engine" remains clearly visible

### **2. Responsive Sizing**
Test on these viewport widths:
- [ ] 375px (mobile)
- [ ] 768px (tablet)
- [ ] 1024px (laptop)
- [ ] 1440px (desktop)
- [ ] 1920px (large desktop)

Font should scale smoothly via `clamp(2.8rem, 6vw, 4rem)`

### **3. Theme Switching**
```javascript
// In browser DevTools Console:

// Test light mode
document.body.setAttribute('data-theme', 'light');

// Check gradient changed
const brand = document.querySelector('.synqra-brand-text');
console.log(getComputedStyle(brand).background);
// Should show: linear-gradient(135deg, rgb(184, 115, 51) 0%, rgb(212, 175, 55) 80%)

// Test dark mode
document.body.removeAttribute('data-theme');
console.log(getComputedStyle(brand).background);
// Should show: linear-gradient(135deg, rgb(212, 175, 55) 0%, rgb(245, 230, 211) 70%)
```

### **4. Browser Compatibility**
Test in:
- [ ] Chrome/Edge (Chromium)
- [ ] Safari
- [ ] Firefox
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

### **5. Performance**
- [ ] No layout shift when page loads
- [ ] Smooth gradient rendering (GPU-accelerated)
- [ ] No visible flash of unstyled text (FOUT)
- [ ] Console shows zero errors
- [ ] Theme switch is instant (< 50ms)

---

## 📸 Screenshot Capture Instructions

### **Dark Mode Screenshots**
1. Open http://localhost:3000
2. Wait for full page load
3. Open DevTools (F12) → Console
4. Run: `document.body.removeAttribute('data-theme');`
5. Zoom to 100%
6. Capture full viewport
7. Capture close-up of "SYNQRA" text
8. Save as: `synqra-brand-dark-mode.png`

### **Light Mode Screenshots**
1. Same page (http://localhost:3000)
2. In Console, run: `document.body.setAttribute('data-theme', 'light');`
3. Wait 1 second for gradient to render
4. Capture full viewport
5. Capture close-up of "SYNQRA" text
6. Save as: `synqra-brand-light-mode.png`

### **Comparison Screenshot**
1. Use the standalone test file: `THEME_TEST.html`
2. This shows side-by-side dark/light comparison
3. Capture entire comparison section
4. Save as: `synqra-brand-comparison.png`

---

## 🎨 Expected Visual Results

### **Dark Mode Gradient**
```
Start: #D4AF37 (Champagne Gold)  ■■■■■■
                                   ↓
End:   #F5E6D3 (Luxury Cream)    ░░░░░░
Direction: 135° diagonal
Shadow: Warm gold halo
```

### **Light Mode Gradient**
```
Start: #B87333 (Copper)          ▓▓▓▓▓▓
                                   ↓
End:   #D4AF37 (Champagne Gold)  ■■■■■■
Direction: 135° diagonal
Shadow: Copper glow (more subtle)
```

---

## 🔍 DevTools Inspection

### **Check Computed Styles**
1. Right-click "SYNQRA" text → Inspect
2. In Styles panel, look for `.synqra-brand-text`
3. Verify these properties:

**Dark Mode:**
```css
background: linear-gradient(135deg, rgb(212, 175, 55) 0%, rgb(245, 230, 211) 70%)
-webkit-background-clip: text
-webkit-text-fill-color: transparent
text-shadow: rgba(255, 215, 170, 0.25) 0px 0px 25px
font-size: [value between 2.8rem and 4rem based on viewport]
letter-spacing: 0.15em
```

**Light Mode (with `data-theme="light"` on parent):**
```css
background: linear-gradient(135deg, rgb(184, 115, 51) 0%, rgb(212, 175, 55) 80%)
text-shadow: rgba(184, 115, 51, 0.2) 0px 0px 25px
```

---

## 🐛 Troubleshooting

### **Gradient Not Visible**
- Check if `-webkit-background-clip` is supported
- Look for conflicting CSS rules
- Verify browser supports CSS gradients
- Check for `color` overrides

### **Theme Not Switching**
- Verify `data-theme="light"` is on parent element
- Check CSS specificity (light rules should come after dark)
- Clear browser cache (Cmd+Shift+R / Ctrl+Shift+R)
- Inspect element in DevTools to see applied rules

### **Text Not Readable**
- Check background color contrast
- Verify text-shadow is present
- Test on different screen brightness levels
- Compare to fallback color (#D4AF37 / #B87333)

### **Layout Shifts**
- Ensure margin/padding values match design
- Check `clamp()` function is working
- Verify no conflicting global styles
- Test on different viewport sizes

---

## 📊 Performance Metrics

Expected results:
- **First Paint**: < 1s
- **Layout Shift (CLS)**: < 0.1
- **Gradient Render**: GPU-accelerated
- **Theme Switch**: < 50ms
- **Memory Impact**: Negligible (pure CSS)

---

## ✅ Success Criteria

All of these should be TRUE:

- [ ] "SYNQRA" text is 3-4x more visible than before
- [ ] Gradient is smooth and luxurious
- [ ] Text remains readable in both themes
- [ ] No console errors
- [ ] No layout shifts
- [ ] Works on mobile and desktop
- [ ] Theme switching is instant
- [ ] "Perfect Draft Engine" functionality unaffected
- [ ] Browser fallback works (solid colors)
- [ ] Passes WCAG AAA contrast ratio

---

## 📁 File Locations

```
/workspace/
├── apps/synqra-mvp/
│   ├── styles/
│   │   └── globals.css          ← Theme CSS
│   ├── app/
│   │   └── page.tsx              ← Uses .synqra-brand-text class
│   ├── THEME_TEST.html           ← Standalone test file
│   └── THEME_GUIDE.md            ← Full documentation
└── LOCAL_TEST_GUIDE.md           ← This file
```

---

## 🚀 Next Steps After Testing

1. **If tests pass:**
   - Merge PR to `main`
   - Deploy to production (Railway/Vercel)
   - Test on live URL
   - Share screenshots with team

2. **If issues found:**
   - Document specific problems
   - Check browser/device details
   - Review computed styles in DevTools
   - Adjust CSS if needed
   - Re-test

---

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Verify `globals.css` contains theme rules
3. Confirm `page.tsx` uses `className="synqra-brand-text"`
4. Test in different browser
5. Clear cache and rebuild: `npm run build && npm run dev`

---

**Last Updated**: 2025-11-12  
**Test File**: `apps/synqra-mvp/THEME_TEST.html`  
**Status**: Ready for local testing ✓
