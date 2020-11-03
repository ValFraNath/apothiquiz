import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { CaretLeftIcon } from "@modulz/radix-icons";

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
    <div id={"offlineBanner"} className={isOnline ? "online" : "offline"}>
      {isOnline ? "ONLINE" : "OFFLINE"}
    </div>
  );
};

const TopBar = () => {
  return (
    <nav>
      <CaretLeftIcon id="return" />

      <h1>
        <Link to="/">Guacamole</Link>
      </h1>

      <OfflineBanner />
    </nav>
  );
};

export default TopBar;
