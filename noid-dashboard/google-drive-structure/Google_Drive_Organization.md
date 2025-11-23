# NØID LABS — Google Drive Organization Guide
**Complete backup and organization structure**

---

## FOLDER HIERARCHY

```
NØID Labs/
├── 1. Pitch Deck/
│   ├── Synqra_Pitch_Deck.md
│   ├── Synqra_Pitch_Deck.pdf (export from Figma/Pitch)
│   ├── Slide_Images/
│   │   ├── 01_Cover.png
│   │   ├── 02_Problem.png
│   │   ├── 03_Why_Now.png
│   │   ├── 04_Insight.png
│   │   ├── 05_Solution.png
│   │   ├── 06_How_It_Works.png
│   │   ├── 07_Economics.png
│   │   ├── 08_Traction.png
│   │   ├── 09_Market.png
│   │   ├── 10_Business_Model.png
│   │   ├── 11_Competitive.png
│   │   ├── 12_Moat.png
│   │   ├── 13_Roadmap.png
│   │   ├── 14_Founder_Story.png
│   │   ├── 15_The_Ask.png
│   │   └── 16_Closing.png
│   ├── Interactive_Link.txt (link to v0.dev or Figma interactive deck)
│   └── Investor_Email_Template.md
│
├── 2. Kickstarter/
│   ├── Campaign_Copy.md
│   ├── Video_Script.md
│   ├── Visual_Assets_List.md
│   ├── Video/
│   │   ├── Kickstarter_Video_60s.mp4
│   │   ├── Social_Cut_30s.mp4
│   │   └── Thumbnail.png
│   ├── Graphics/
│   │   ├── Hero_Image.png
│   │   ├── Product_Screenshots/ (5 images)
│   │   ├── Founder_Photo.jpg
│   │   ├── Comparison_Graphic.png
│   │   ├── Roadmap_Visual.png
│   │   └── Stretch_Goals.png
│   └── Social_Promo/
│       ├── Instagram_Carousel/ (10 slides)
│       ├── Twitter_Thread/ (5 graphics)
│       └── LinkedIn_Announcement.png
│
├── 3. Brand Assets/
│   ├── Logos/
│   │   ├── synqra-wordmark-light.svg
│   │   ├── synqra-wordmark-light.png (export at 2x, 4x)
│   │   ├── synqra-wordmark-dark.svg
│   │   ├── synqra-wordmark-dark.png (export at 2x, 4x)
│   │   ├── synqra-icon.svg
│   │   └── synqra-icon.png (export at 512×512, 1024×1024)
│   ├── Color_Palette.md
│   ├── Typography.md
│   ├── Brand_Guidelines.pdf
│   └── Usage_Examples/
│       ├── Social_Media_Templates/
│       ├── Email_Signatures/
│       └── Presentation_Templates/
│
├── 4. Product/
│   ├── Roadmap.md
│   ├── Feature_Specs/
│   │   ├── Multi_AI_Orchestration.md
│   │   ├── Quality_Audit_Layer.md
│   │   ├── Brand_Voice_Training.md
│   │   └── API_Platform.md
│   ├── Technical_Docs/
│   │   ├── Architecture_Overview.md
│   │   ├── Database_Schema.md
│   │   └── API_Documentation.md
│   └── User_Research/
│       ├── Pilot_Customer_Feedback.md
│       └── Creator_Interviews.md
│
├── 5. Business/
│   ├── Financial_Model.xlsx
│   ├── Revenue_Projections.pdf
│   ├── Unit_Economics.md
│   ├── Pricing_Strategy.md
│   └── Investor_Updates/
│       └── (Monthly updates once fundraising starts)
│
├── 6. Marketing/
│   ├── Go_To_Market_Strategy.md
│   ├── Content_Calendar.xlsx
│   ├── SEO_Keywords.md
│   ├── Social_Media_Plan.md
│   └── Case_Studies/
│       └── (Customer success stories)
│
├── 7. Legal/
│   ├── Terms_of_Service.pdf
│   ├── Privacy_Policy.pdf
│   ├── SAFE_Agreement.pdf (if applicable)
│   ├── Incorporation_Docs/
│   └── Contracts/
│
└── 8. Contact/
    ├── Founder_Info.txt
    ├── Press_Kit.zip
    └── Media_Contacts.xlsx
```

---

## DETAILED FILE CONTENTS

### 1. Pitch Deck/

#### Synqra_Pitch_Deck.md
- Full markdown version (already created)
- Location: `/pitch-deck/Synqra_Pitch_Deck.md`

#### Synqra_Pitch_Deck.pdf
- Export from Figma, Pitch, or Google Slides
- 16 slides total
- Use brand colors (matte black, gold, teal, off-white)

#### Interactive_Link.txt
```
Interactive Pitch Deck:
https://v0.dev/[your-link-here]

or

https://www.figma.com/proto/[your-link-here]

Password (if needed): [password]
```

---

### 2. Kickstarter/

#### Campaign_Copy.md
- Full campaign text (already created)
- Location: `/kickstarter/Campaign_Copy.md`

#### Video_Script.md
- 45-60 second script (already created)
- Location: `/kickstarter/Video_Script.md`

#### Visual_Assets_List.md
- Complete checklist (already created)
- Location: `/kickstarter/Visual_Assets_List.md`

---

### 3. Brand Assets/

#### Color_Palette.md
```markdown
# SYNQRA — Color Palette

## Primary Colors

**Matte Black**
- Hex: #0A0A0A
- RGB: 10, 10, 10
- Usage: Backgrounds, primary text on light backgrounds

**Off-White**
- Hex: #F5F5F0
- RGB: 245, 245, 240
- Usage: Text on dark backgrounds, light accents

**Gold**
- Hex: #D4AF37
- RGB: 212, 175, 55
- Usage: Accents, underlines, CTAs, luxury highlights

## Secondary Colors

**Teal**
- Hex: #008B8B
- RGB: 0, 139, 139
- Usage: Interactive elements, focus states, secondary accents

**Charcoal**
- Hex: #2B2B2B
- RGB: 43, 43, 43
- Usage: Secondary backgrounds, borders, subtle text

## Usage Guidelines

- **Never use pure black (#000000)** — always use Matte Black (#0A0A0A)
- **Never use pure white (#FFFFFF)** — always use Off-White (#F5F5F0)
- Gold should be used sparingly (5-10% of design)
- Teal for interactive states only (hover, focus, active)
```

#### Typography.md
```markdown
# SYNQRA — Typography

## Primary Typeface

**Inter** (Google Fonts)
- Weights: 400 (Regular), 700 (Bold)
- Usage: All UI text, body copy, headings
- Link: https://fonts.google.com/specimen/Inter

## Fallback Fonts

```css
font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
```

## Type Scale

| Element | Size | Weight | Line Height | Letter Spacing |
|---------|------|--------|-------------|----------------|
| H1 (Display) | 72px | 700 | 1.1 | -0.02em |
| H2 (Heading) | 48px | 700 | 1.2 | -0.01em |
| H3 (Subheading) | 32px | 700 | 1.3 | 0 |
| H4 (Section) | 24px | 700 | 1.4 | 0 |
| Body Large | 18px | 400 | 1.6 | 0 |
| Body | 16px | 400 | 1.6 | 0 |
| Small | 14px | 400 | 1.5 | 0 |
| Caption | 12px | 400 | 1.4 | 0.01em |

## Usage Guidelines

- All headings should be bold (700 weight)
- Body text always regular (400 weight)
- Never use italic unless quoting
- Never use all-caps for body text
- SYNQRA wordmark always uppercase
```

---

### 8. Contact/

#### Founder_Info.txt
```
DE BEAR FORTE
Founder & CEO, NØID Labs

Email: debear@noidlux.com
Website: synqra.co
LinkedIn: [your LinkedIn URL]
Twitter/X: @noidlabs

Location: [Your City, State]
Time Zone: [Your Time Zone]

Best Contact Method: Email (response within 24 hours)
Available for Calls: [Your availability, e.g., "Tue/Thu 2-5pm PST"]

---

ABOUT NØID LABS

NØID Labs builds luxury AI tools for creators and brands:
- SYNQRA: Luxury content automation (current focus)
- NØID: Personal AI assistant with luxury interface
- AuraFX: Voice cloning for creators

Founded: 2023
Team: 3 (founder + 2 engineers)
Funding: Bootstrapped (raising pre-seed)

---

PRESS INQUIRIES

For media requests, product demos, or interview opportunities:
Email: debear@noidlux.com
Subject Line: "PRESS: [Your Publication]"

Press kit available: [link to press kit ZIP]
```

---

## UPLOAD INSTRUCTIONS

### Step 1: Create Main Folder
1. Open Google Drive
2. Create new folder: "NØID Labs"
3. Right-click → "Add shortcut to Drive" (for quick access)

### Step 2: Create Subfolders
Use the hierarchy above. Create all 8 main folders:
1. Pitch Deck
2. Kickstarter
3. Brand Assets
4. Product
5. Business
6. Marketing
7. Legal
8. Contact

### Step 3: Upload Files
- Upload markdown files from local project
- Export logos from `/public/logos/` directory
- Create placeholder .txt files for future content

### Step 4: Share Settings
- **Private by default** (only you can access)
- Share individual folders with collaborators as needed
- For investors: share "Pitch Deck" folder only

### Step 5: Version Control
- Enable version history for all documents
- Google Drive auto-saves versions
- For critical files (financials, legal), manually create versions (File → Make a copy → append date)

---

## BACKUP SCHEDULE

### Daily (Automatic)
- Google Drive auto-syncs all changes
- No action required

### Weekly (Manual)
- Review folder structure
- Archive old versions (move to "/Archive" subfolder)
- Update README files in each folder

### Monthly (Manual)
- Export pitch deck as PDF (latest version)
- Export financial model as Excel
- Create ZIP backup of entire "NØID Labs" folder
- Store ZIP in external location (Dropbox, local hard drive)

---

## SHARING WITH INVESTORS

When sharing with potential investors:

1. **Create View-Only Link** for "Pitch Deck" folder
2. **Add Password Protection** (if sensitive)
3. **Track Access** (Google Drive shows who viewed)
4. **Disable Download** (Force view-only mode)

**Example Email:**
```
Subject: SYNQRA — Pitch Deck for Review

Hi [Investor Name],

Attached is our pitch deck for SYNQRA. You can view it here:
[Google Drive link]

Password: [if applicable]

The deck covers:
- Problem, solution, market
- Traction, unit economics, roadmap
- $2.5M pre-seed ask

Happy to discuss on a call. My calendar:
[Calendly link or availability]

Best,
De Bear Forte
Founder, NØID Labs
debear@noidlux.com
```

---

## SECURITY BEST PRACTICES

### For Sensitive Files (Legal, Financial)
- **Enable 2-Factor Authentication** on Google account
- **Use Strong Password** (16+ characters, mix of symbols)
- **Limit Sharing** (only share with verified email addresses)
- **Audit Access** monthly (revoke old shares)

### For Public Files (Marketing, Brand)
- Safe to share publicly
- Use watermarks on unreleased visuals
- Embed "© NØID Labs" in all brand assets

---

**END OF GOOGLE DRIVE ORGANIZATION GUIDE**
