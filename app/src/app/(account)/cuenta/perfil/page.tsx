"use client";

import { Suspense } from "react";
import ProfilePage from "./perfil-content";

export default function Page() {
  return (
    <Suspense>
      <ProfilePage />
    </Suspense>
  );
}
