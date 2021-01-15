import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
// import { CaretLeftIcon } from "@modulz/radix-icons";

import SpriteSheet from "../SpriteSheet";

import connection_anim from "../../images/connection_status.png";

const UserBadge = ({ pseudo }) => {
  return <div id={"userBadge"}>{pseudo}</div>;
};

const OfflineBanner = () => {
  const [isOnline, setOnline] = useState(navigator.onLine);
  const [spriteSheet, setSpriteSheet] = useState(null);

  /**
   * This function is executed when the online state is changed
   */
  useEffect(() => {
    if (spriteSheet === null) {
      return;
    }
    if (isOnline) {
      spriteSheet.setCurrentFrame(-1);
      spriteSheet.setDirection("reverse");
    } else {
      spriteSheet.setCurrentFrame(0);
      spriteSheet.setDirection("normal");
    }
    spriteSheet.play();
  }, [isOnline, spriteSheet]);

  /**
   * This function is executed when the spritesheet is changed ( normally only once )
   */
  useEffect(() => {
    if (spriteSheet === null) {
      return;
    }
    if (navigator.onLine) {
      spriteSheet.setCurrentFrame(0);
    } else {
      spriteSheet.setCurrentFrame(36);
    }

    function updateOnlineStatus() {
      setOnline(navigator.onLine);
    }

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, [spriteSheet]);

  return (
    <div id={"offlineBanner"} className={isOnline ? "online" : "offline"}>
      <SpriteSheet
        image={connection_anim}
        frameHeight={60}
        frameWidth={65}
        steps={37}
        timing={1.5}
        get={(sp) => {
          setSpriteSheet(sp);
        }}
      />
    </div>
  );
};

const TopBar = ({ user }) => {
  return (
    <nav>
      {/* <CaretLeftIcon id="return" /> */}
      {user && <UserBadge pseudo={user} />}
      <h1>
        <Link to="/">Guacamole</Link>
      </h1>
      <OfflineBanner />
    </nav>
  );
};

export default TopBar;
