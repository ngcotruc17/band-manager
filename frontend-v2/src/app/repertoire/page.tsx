"use client";

import React, { Suspense } from "react";
import SongLibraryAndRepertoire from "../library/page";

export default function RepertoirePage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs font-bold text-slate-500">Đang nạp Kho Repertoire...</div>}>
      <SongLibraryAndRepertoire defaultSubTab="repertoire" />
    </Suspense>
  );
}
