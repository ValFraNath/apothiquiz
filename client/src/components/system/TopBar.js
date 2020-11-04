import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
// import { CaretLeftIcon } from "@modulz/radix-icons";

import AuthService from "../../services/auth.service";
import SpriteSheet from "../SpriteSheet";

import connection_anim from "../../images/connection_status.png";

function handleLogoutClick() {
  AuthService.logout();
  document.location.replace("/");
}

const UserBadge = ({ pseudo }) => {
  return (
    <div id={"userBadge"}>
      {pseudo}
      <button onClick={handleLogoutClick}>Déconnexion</button>
    </div>
  );
};

const OfflineBanner = () => {
  const [isOnline, setOnline] = useState(true);
  const [spriteSheet, setSpriteSheet] = useState(null);

  useEffect(() => {
    if (spriteSheet === null) {
      return;
    }
    function updateOnlineStatus() {
      if (isOnline === navigator.onLine) {
        return;
      }
      setOnline(navigator.onLine);

      if (navigator.onLine) {
        console.log("on");
        spriteSheet.setCurrentFrame(-1);
        spriteSheet.setDirection("reverse");
        spriteSheet.play();
      } else {
        console.log("off");
        spriteSheet.setCurrentFrame(0);
        spriteSheet.setDirection("normal");
        spriteSheet.play();
      }
    }

    if (navigator.onLine) {
      spriteSheet.setCurrentFrame(0);
    } else {
      spriteSheet.setCurrentFrame(36);
    }

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, [spriteSheet, isOnline]);

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
