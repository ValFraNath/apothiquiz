import React, { useState, useEffect } from "react";

const OfflineBanner = () => {
  const [isOnline, setOnline] = useState(true);

  useEffect(() => {
    function updateOnlineStatus() {
      setOnline(navigator.onLine);
    }

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);
    document.addEventListener("DOMContentLoaded", updateOnlineStatus);

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
      document.removeEventListener("DOMContentLoaded", updateOnlineStatus);
    };
  });

  return (
    <aside id={"offlineBanner"} className={isOnline ? "online" : "offline"}>
      {isOnline ? "ONLINE" : "OFFLINE"}
    </aside>
  );
};

export default OfflineBanner;
