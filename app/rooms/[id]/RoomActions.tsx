"use client";

import { useState } from "react";
import { Heart, Share } from "lucide-react";

export default function RoomActions({ title }: { title: string }) {
  const [saved, setSaved] = useState(false);

  function shareRoom() {
    if (navigator.share) {
      void navigator.share({ title, url: window.location.href }).catch(() => {});
    } else {
      void navigator.clipboard?.writeText(window.location.href);
    }
  }

  return <div className="room-actions">
    <button type="button" onClick={shareRoom}><Share size={16} />Compartir</button>
    <button type="button" aria-pressed={saved} className={saved ? "is-saved" : ""} onClick={() => setSaved(!saved)}><Heart size={16} />Guardar</button>
  </div>;
}