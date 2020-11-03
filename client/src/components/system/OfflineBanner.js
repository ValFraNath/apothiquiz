import React, { useState, useEffect } from "react";

const OfflineBanner = () => {
  const [onlineStatus, setOnlineStatus] = useState("online");

  useEffect(() => {
    function updateOnlineStatus() {
      if (navigator.onLine) {
        setOnlineStatus("offline-tmp");
        setTimeout(function () {
          setOnlineStatus("online");
        }, 10);
      } else {
        setOnlineStatus("");
        setTimeout(function () {
          setOnlineStatus("offline");
        }, 10);
      }
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
    <aside id={"offlineBanner"} className={onlineStatus}>
      <div id="connection_anim"> </div>
      {onlineStatus === "online" ? "ONLINE" : "OFFLINE"}
    </aside>
  );
};

export default OfflineBanner;
