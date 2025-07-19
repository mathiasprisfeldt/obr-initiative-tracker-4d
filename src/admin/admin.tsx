import OBR from "@owlbear-rodeo/sdk";
import { useEffect, useState } from "react";

export function Admin() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    OBR.broadcast.sendMessage("state", {
      count,
    });
  }, [count]);

  return (
    <div>
      <h1>Admin Panel</h1>
      <button onClick={() => setCount((previousCount) => previousCount + 1)}>
        {count}
      </button>
    </div>
  );
}
