import React, { useState, useEffect } from "react";

const OfflineBanner = () => {
  const [isOnline, setOnline] = useState(true);

  useEffect(() => {
    function updateOnlineStatus() {
      setOnline(navigator.onLine);
    }
    updateOnlineStatus();
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  return (
    <aside id={"offlineBanner"} className={isOnline ? "online" : "offline"}>
      <div id="connection_anim"> </div>
      {isOnline ? "ONLINE" : "OFFLINE"}
    </aside>
  );
};

export default OfflineBanner;
