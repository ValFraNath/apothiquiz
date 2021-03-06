import PropTypes from "prop-types";
import React, { useState, useEffect } from "react";
import { useQuery } from "react-query";
import { Link } from "react-router-dom";

import connectionAnim from "../../images/connection_status.png";
import Avatar from "../Avatar";
import SpriteSheet from "../SpriteSheet";

const UserBadge = ({ username }) => {
  const { data: user } = useQuery(["user", "me"]);

  return (
    <Link to="/profile" id={"userBadge"}>
      <Avatar size="32px" infos={user?.avatar} />
      <span>dpager</span>
    </Link>
  );
};

UserBadge.propTypes = {
  username: PropTypes.string.isRequired,
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
        image={connectionAnim}
        frameHeight={35}
        frameWidth={35}
        steps={37}
        timing={1.5}
        get={(sp) => {
          setSpriteSheet(sp);
        }}
      />
    </div>
  );
};

const TopBar = ({ username }) => (
  <nav>
    {username ? <UserBadge username={username} /> : <span></span>}
    <h1>
      <Link to={username ? "/homepage" : "/"}>Guacamaire</Link>
    </h1>
    {/* <OfflineBanner /> */}
  </nav>
);

TopBar.propTypes = {
  username: PropTypes.string,
};

export default TopBar;
