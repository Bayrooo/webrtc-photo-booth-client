
# WebRTC Vintage Photo Booth — Client (Next.js)
- Two-person online photo booth with PeerJS (WebRTC).
- Create/Join a Room using a Peer server.
- Take a combined snapshot with filters & vintage frames.

## Quick Start
```bash
cp .env.local.example .env.local
# set NEXT_PUBLIC_PEER_SERVER to your deployed peer server URL, e.g.
# NEXT_PUBLIC_PEER_SERVER=https://<your-domain>/peerjs
npm install
npm run dev
```

Open http://localhost:3000, Start Camera → Create Room → share your ID → the other person Join Room with that ID → Take Photo.
