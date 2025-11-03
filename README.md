# Voice Study App

A simple Next.js application for conducting voice conversation studies using ElevenLabs' WebRTC SDK. Participants have a voice conversation with an AI agent and receive a Prolific completion code after completing at least 6 minutes of conversation.

## Features

- **WebRTC Voice Conversations**: Uses ElevenLabs' official React SDK for browser-based voice sessions
- **Mic Permission Gating**: Microphone access is only requested when the user clicks "Start"
- **Live Captions**: Real-time transcription display during the conversation
- **Time Tracking**: Visible timer showing conversation duration
- **6-Minute Minimum**: Participants must complete at least 6 minutes of conversation to receive the completion code
- **Prolific Integration**: Automatic code reveal and redirect link after successful completion

## Prerequisites

- Node.js 18+ installed
- An ElevenLabs account with API access
- An ElevenLabs Conversational AI agent created

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your credentials:

```env
# Get your API key from https://elevenlabs.io/app/settings/api-keys
XI_API_KEY=your_actual_api_key_here

# Your ElevenLabs agent ID
AGENT_ID=agent_6501k8y1x4g8fmmr3prq6gnfhbsb
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How It Works

### User Flow

1. **Landing**: User sees a "Start" button and description
2. **Start**: Clicking Start requests microphone permission and begins the WebRTC voice session
3. **Conversation**: Live captions appear as the conversation progresses; timer shows elapsed time
4. **End**: User clicks "End & Submit" (or can talk as long as they want)
5. **Completion Check**:
   - **If < 6 minutes**: Error message is shown, no code revealed
   - **If ≥ 6 minutes**: Prolific completion code is displayed with a "Redirect to Prolific" button

### Technical Architecture

```
/app/page.tsx              → Main UI (Start button, captions, timer, completion flow)
/app/api/token/route.ts    → Serverless endpoint to mint WebRTC conversation tokens
.env.local                 → Environment variables (API key, agent ID)
```

**API Flow:**
1. Client requests token from `/api/token`
2. Server calls `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=...` with `xi-api-key` header
3. Server returns token to client
4. Client uses token to start WebRTC session via `@elevenlabs/react` SDK

**No Server-Side State**: The app doesn't store any conversation data. ElevenLabs handles all conversation storage, which can be accessed later via their [Conversations API](https://elevenlabs.io/docs/api-reference/get-conversation-by-id) if needed.

## Deployment (Vercel)

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

### 2. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and import your repository
2. Add environment variables in **Project Settings → Environment Variables**:
   - `XI_API_KEY`: Your ElevenLabs API key
   - `AGENT_ID`: Your agent ID
3. Deploy

Your app will be live at `https://your-project.vercel.app`

## Prolific Study Setup

### Completion Code

The hardcoded Prolific completion code is: **CZL12H8O**

Participants will only see this code after completing at least 6 minutes of conversation.

### Study Link

Use your deployed Vercel URL as the study link in Prolific:

```
https://your-project.vercel.app
```

### Redirect URL

After receiving the code, participants can click "Redirect to Prolific" which opens:

```
https://app.prolific.com/submissions/complete?cc=CZL12H8O
```

## Customization

### Change Minimum Duration

Edit `app/page.tsx` and change:

```typescript
const MIN_DURATION_SECONDS = 360; // 6 minutes
```

### Change Prolific Code

Edit `app/page.tsx` and change:

```typescript
const PROLIFIC_CODE = "YOUR_NEW_CODE";
const PROLIFIC_REDIRECT_URL = "https://app.prolific.com/submissions/complete?cc=YOUR_NEW_CODE";
```

### Change Agent

Update `AGENT_ID` in `.env.local` (locally) or in Vercel environment variables (production).

## Browser Compatibility

- **Best**: Chrome, Edge (desktop)
- **Good**: Firefox (desktop)
- **Limited**: Safari (desktop and iOS) - may have autoplay/mic restrictions

WebRTC voice works best on desktop browsers. For mobile, ensure users tap "Start" to satisfy autoplay policies.

## Troubleshooting

### "Failed to get conversation token"

- Check that `XI_API_KEY` is correctly set in `.env.local` or Vercel environment variables
- Verify your ElevenLabs API key is valid at https://elevenlabs.io/app/settings/api-keys

### No audio or microphone not working

- Ensure the user clicks the "Start" button (required for browser autoplay/mic policies)
- Check browser console for permission errors
- Try on Chrome/Edge for best compatibility

### Conversation doesn't show completion code

- Verify the conversation lasted at least 6 minutes (check the timer)
- Look in browser console for any errors

## References

- [ElevenLabs React SDK](https://github.com/elevenlabs/elevenlabs-react)
- [ElevenLabs WebRTC Documentation](https://elevenlabs.io/docs/conversational-ai/webrtc)
- [ElevenLabs Conversation API](https://elevenlabs.io/docs/api-reference/get-conversation-by-id)
- [Next.js Documentation](https://nextjs.org/docs)

## License

MIT
