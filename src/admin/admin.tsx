import OBR from "@owlbear-rodeo/sdk";
import { use } from "react";

export function Admin() {
  const isPlayer = use(OBR.player.getRole());
  if (isPlayer) return null;

  return (
    <div>
      <h1>Admin Panel</h1>
    </div>
  );
}
