
"use client";
import { useEffect, useRef, useState } from "react";
import Peer, { MediaConnection } from "peerjs";

const PEER_SERVER = process.env.NEXT_PUBLIC_PEER_SERVER || "http://localhost:9000/peerjs";

export default function Booth() {
  const [myId, setMyId] = useState<string>("");
  const [targetId, setTargetId] = useState<string>("");
  const [peer, setPeer] = useState<Peer | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("none");
  const [frame, setFrame] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");
  const localRef = useRef<HTMLVideoElement | null>(null);
  const remoteRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentCall = useRef<MediaConnection | null>(null);

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      setLocalStream(stream);
      if (localRef.current) localRef.current.srcObject = stream;
      setStatus("Camera ready.");
    } catch (e) {
      setStatus("Failed to access camera. Allow permission.");
    }
  };

  // Create room (init Peer)
  const createRoom = () => {
    if (!localStream) { setStatus("Start camera first."); return; }
    const p = new Peer(undefined, { host: undefined, port: undefined, path: "/peerjs", secure: PEER_SERVER.startsWith("https"), config: { iceServers: [{ urls: "stun:stun1.l.google.com:19302" }] }, debug: 1 });
    // override peer server from full URL
    (p as any)._options.host = new URL(PEER_SERVER).hostname;
    const u = new URL(PEER_SERVER);
    (p as any)._options.port = u.port ? parseInt(u.port) : (u.protocol === "https:" ? 443 : 80);
    (p as any)._options.path = u.pathname;

    p.on("open", (id) => { setMyId(id); setStatus("Room created. Share your ID."); });
    p.on("call", (call) => {
      call.answer(localStream!);
      currentCall.current = call;
      call.on("stream", (remote) => {
        setRemoteStream(remote);
        if (remoteRef.current) remoteRef.current.srcObject = remote;
        setStatus("Connected.");
      });
      call.on("close", () => setStatus("Call closed."));
    });
    setPeer(p);
  };

  // Join room (call targetId)
  const joinRoom = () => {
    if (!localStream) { setStatus("Start camera first."); return; }
    if (!targetId) { setStatus("Enter Room ID to join."); return; }
    const p = new Peer(undefined, { host: undefined, port: undefined, path: "/peerjs", secure: PEER_SERVER.startsWith("https"), config: { iceServers: [{ urls: "stun:stun1.l.google.com:19302" }] }, debug: 1 });
    (p as any)._options.host = new URL(PEER_SERVER).hostname;
    const u = new URL(PEER_SERVER);
    (p as any)._options.port = u.port ? parseInt(u.port) : (u.protocol === "https:" ? 443 : 80);
    (p as any)._options.path = u.pathname;

    p.on("open", (id) => { setMyId(id); setStatus("Calling host..."); 
      const call = p.call(targetId, localStream!);
      currentCall.current = call;
      call.on("stream", (remote) => {
        setRemoteStream(remote);
        if (remoteRef.current) remoteRef.current.srcObject = remote;
        setStatus("Connected.");
      });
      call.on("close", () => setStatus("Call closed."));
    });
    setPeer(p);
  };

  const hangUp = () => {
    currentCall.current?.close();
    peer?.disconnect();
    peer?.destroy();
    setPeer(null);
    setRemoteStream(null);
    setStatus("Disconnected.");
  };

  const takePhoto = () => {
    const canvas = canvasRef.current;
    const v1 = localRef.current;
    const v2 = remoteRef.current;
    if (!canvas || !v1) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = 800, H = 400;
    canvas.width = W; canvas.height = H;
    ctx.fillStyle = "#f4e1f4"; ctx.fillRect(0,0,W,H);
    const eachW = v2 && v2.srcObject ? W/2 : W*0.7;
    const eachH = H*0.9;
    const y = (H-eachH)/2;
    if (v2 && v2.srcObject) { ctx.drawImage(v1, 0, y, eachW, eachH); ctx.drawImage(v2, eachW, y, eachW, eachH); }
    else { const x = (W-eachW)/2; ctx.drawImage(v1, x, y, eachW, eachH); }
    // filter overlay
    const imgData = ctx.getImageData(0,0,W,H);
    const off = document.createElement("canvas"); off.width=W; off.height=H;
    off.getContext("2d")!.putImageData(imgData,0,0);
    ctx.clearRect(0,0,W,H); ctx.filter = filter; ctx.drawImage(off,0,0);
    if (frame) {
      const f = new Image(); f.src = frame;
      f.onload = () => { ctx.filter="none"; ctx.drawImage(f,0,0,W,H); setPhoto(canvas.toDataURL("image/png")); };
    } else { setPhoto(canvas.toDataURL("image/png")); }
  };

  useEffect(() => {
    return () => {
      localStream?.getTracks().forEach(t=>t.stop());
      remoteStream?.getTracks().forEach(t=>t.stop());
      peer?.destroy();
    };
  }, [peer, localStream, remoteStream]);

  return (
    <div className="w-full max-w-5xl bg-white/50 rounded-2xl shadow-lg p-4">
      <div className="grid md:grid-cols-2 gap-4">
        <video ref={localRef} autoPlay playsInline className="rounded-2xl shadow w-full h-64 object-cover bg-black" />
        <video ref={remoteRef} autoPlay playsInline className="rounded-2xl shadow w-full h-64 object-cover bg-black" />
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <div className="flex flex-wrap items-center gap-2 mt-4">
        <button onClick={startCamera} className="px-4 py-2 rounded-2xl bg-gray-800 text-white">Start Camera</button>
        <button onClick={createRoom} className="px-4 py-2 rounded-2xl bg-pink-500 text-white">Create Room</button>
        <input value={targetId} onChange={(e)=>setTargetId(e.target.value)} placeholder="Enter Room ID" className="px-3 py-2 rounded-xl bg-white/80 border" />
        <button onClick={joinRoom} className="px-4 py-2 rounded-2xl bg-purple-600 text-white">Join Room</button>
        <button onClick={hangUp} className="px-4 py-2 rounded-2xl bg-red-500 text-white">Hang Up</button>
        <button onClick={takePhoto} className="ml-auto px-4 py-2 rounded-2xl bg-pink-400 text-white">📸 Take Photo</button>
      </div>

      <div className="flex gap-2 mt-3">
        <button onClick={()=>setFilter("grayscale(1)")} className="px-3 py-2 rounded-xl bg-gray-200">Gray</button>
        <button onClick={()=>setFilter("sepia(1)")} className="px-3 py-2 rounded-xl bg-gray-200">Sepia</button>
        <button onClick={()=>setFilter("none")} className="px-3 py-2 rounded-xl bg-gray-200">Normal</button>
        <button onClick={()=>setFrame("/frames/frame1.png")} className="px-3 py-2 rounded-xl bg-gray-200">Frame 1</button>
        <button onClick={()=>setFrame("/frames/frame2.png")} className="px-3 py-2 rounded-xl bg-gray-200">Frame 2</button>
        <button onClick={()=>setFrame(null)} className="px-3 py-2 rounded-xl bg-gray-200">No Frame</button>
      </div>

      <div className="mt-2 text-sm text-gray-700">
        <div>Status: {status}{myId ? ` | My ID: ${myId}` : ""}</div>
      </div>

      {photo && (
        <div className="mt-6 flex flex-col items-center">
          <img src={photo} alt="Captured" className="rounded-2xl shadow mb-3 max-w-full" />
          <a href={photo} download="vintage_photo.png">
            <button className="px-4 py-2 rounded-2xl bg-purple-600 text-white">Download Photo</button>
          </a>
        </div>
      )}
    </div>
  );
}
