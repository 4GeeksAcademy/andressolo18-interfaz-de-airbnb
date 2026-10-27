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

  return <div className="mt-0.5 flex w-full gap-2 min-[900px]:my-0 min-[900px]:ml-auto min-[900px]:w-auto">
    <button className="inline-flex items-center gap-[7px] rounded-[7px] px-[10px] py-2 text-[13px] font-semibold underline hover:bg-[#f7f7f7]" type="button" onClick={shareRoom}><Share size={16} />Compartir</button>
    <button className={`inline-flex items-center gap-[7px] rounded-[7px] px-[10px] py-2 text-[13px] font-semibold underline hover:bg-[#f7f7f7] ${saved ? "text-[#ff385c]" : ""}`} type="button" aria-pressed={saved} onClick={() => setSaved(!saved)}><Heart size={16} />Guardar</button>
  </div>;
}