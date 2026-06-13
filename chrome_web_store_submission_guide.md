# Chrome Web Store Submission Guide: Custom YT Volume Slider

This document contains all the necessary text, copy, justifications, and settings required to submit the **Custom YT Volume Slider** extension to the Chrome Web Store and ensure a quick approval.

---

## 1. Store Metadata

| Field | Value / Description | Character Limit (Used) |
| :--- | :--- | :--- |
| **Title** | `Custom YT Volume Slider` | 23 / 45 chars |
| **Short Description** | `Tired of the volume bar being too small on YouTube? Scale it up or down to whatever width you want (50px to 300px) instantly!` | 124 / 132 chars |
| **Category** | `Productivity` OR `Accessibility` *(Accessibility is recommended as it helps users with fine motor skills who find the tiny 52px slider hard to control)* | N/A |
| **Search Keywords** | `youtube volume, volume slider, youtube width, volume bar, customize youtube` | 5 keywords max |

### Detailed Description (Up to 16,000 characters)
Paste the following text into the **Description** box:
```text
Tired of the volume bar being too small on YouTube?? Use this extension to scale it up or down to whatever width you want!

YouTube's default volume slider is tiny (only 52px wide) and hidden behind a hover state. This makes it difficult to adjust the volume precisely, especially for users on high-resolution monitors or those who find the default controls too small.

Custom YT Volume Slider replaces the native volume slider with a fully customizable, premium interface that matches YouTube's sleek dark aesthetic. 

🚀 KEY FEATURES:
• Expand the Width: Choose any width from 50px up to 300px for your volume bar.
• Always Expanded: Toggle the slider to stay open permanently, removing the need to hover over the speaker icon first.
• Real-time Adjustment: Adjust settings in the popup and see the results instantly on YouTube without reloading the page.
• Premium Design: Dark mode layout using the Outfit font and subtle red glowing animations, matching modern YouTube branding.
• Logarithmic Scale: Audio curves match YouTube's natural logarithmic scaling for smooth, linear-sounding volume changes.
• Lightweight & Safe: No third-party bundlers, minimal CPU usage, and zero data tracking.

🔒 PRIVACY FIRST:
We believe in absolute privacy. Custom YT Volume Slider works entirely on your local machine:
• No tracking code.
• No external network requests.
• Settings are stored locally using chrome.storage.local.
• No personal data is ever collected or transmitted.
```

---

## 2. Privacy & Data Disclosures

During the submission process under the **Privacy** tab, you will be asked questions about data collection and usage. Use the following answers:

### Data Collection Declaration
- **Question**: Do you collect or use user data?
- **Answer**: **No**. Declare that this extension does not collect, store, or transmit any user data.

### Single Purpose Justification
- **Question**: Explain the single purpose of your extension.
- **Answer**: 
  `This extension has a single purpose: to allow users to customize the width and expansion behavior of the YouTube volume slider, improving accessibility and usability.`

### Permissions Justifications
You must explain why the extension requires its requested permissions:

1. **`storage` Permission**
   - **Justification**: 
     `Used to save the user's preferred volume slider width and 'Always Expanded' configuration locally. This allows the user's preferences to persist across page loads and browser sessions.`
2. **Host Permissions (`*://*.youtube.com/*`)**
   - **Justification**: 
     `Required to inject the custom volume slider style overrides and logic directly into YouTube pages. The extension must interact with YouTube's player interface in order to customize the volume controls.`

---

## 3. Reviewer Instructions (Important for Quick Approval)

Providing clear instructions to the Chrome Web Store testers prevents rejections due to "inability to test" and speeds up the review process. 

Paste this into the **Instructions for Reviewers** text field:
```text
Custom YT Volume Slider replaces the default YouTube volume slider with a custom-width version. 

To test the extension:
1. Open any video on YouTube (e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ).
2. Hover over the player controls. You will notice the volume slider is rendered.
3. Click the extension icon in the Chrome toolbar to open the options popup.
4. Drag the "Slider Width" range control (e.g., from 120px to 250px). Observe that the volume slider on the YouTube page resizes immediately in real-time.
5. Toggle the "Always Expanded" switch. Observe that the volume slider remains open and visible next to the speaker icon, even when you move your mouse cursor away from the control panel.
6. Slide the custom volume handle to verify that volume adjustments change the audio level correctly.

Technical notes:
- The extension runs entirely in the local sandbox using vanilla JavaScript.
- No network connections or external resources are requested.
- Local configurations are saved and loaded using chrome.storage.local.
```

---

## 4. Visual Store Assets

You will need to upload the following graphic assets to the developer console:

### A. Extension Icons (Already Prepared)
The following files are located in your extension folder:
- **16x16 px**: `icons/icon16.png` (Used as the favicon and in extension lists)
- **48x48 px**: `icons/icon48.png` (Used in the extensions management page)
- **128x128 px**: `icons/icon128.png` (Used in the Chrome Web Store listing page)

### B. Screenshots (Required)
- **Requirements**: You must upload **at least 1 screenshot** (up to 5).
- **Dimensions**: Must be **1280x800** or **640x400** pixels.
- **How to create them**:
  1. Open a YouTube video on your screen and open the extension's popup dashboard.
  2. Take a screenshot showing the expanded slider on YouTube alongside the extension popup showing your custom settings.
  3. Crop/resize the screenshot to exactly **1280x800** pixels (using Paint, Canva, or Photoshop).
  4. Save as a PNG file and upload it under the "Store Listing" tab.

### C. Promotional Tile (Highly Recommended)
- **Dimensions**: **440x280** pixels.
- **Design**: Keep it simple and focused. Show the glowing red logo icon and the name "Custom YT Volume Slider" on a dark background. This is displayed when your extension is featured in the store.
