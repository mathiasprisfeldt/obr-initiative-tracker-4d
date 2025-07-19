import OBR from "@owlbear-rodeo/sdk";
import "./tracker.css";
import { useEffect, useState } from "react";

export function Tracker() {
  const [data, setData] = useState<unknown>();

  useEffect(() => {
    OBR.onReady(async () => {
      OBR.broadcast.onMessage("state", ({ data }) => {
        setData(data);
      });
    });
  }, []);

  return (
    <div>
      <h1>Tracker</h1>
      {JSON.stringify(data)}
    </div>
  );
}
