import PropTypes from "prop-types";
import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "react-query";
import { Link } from "react-router-dom";

import connectionAnim from "../../images/sprites/network-status-60.png";
import AnimTransition from "../animations/AnimTransition";
import Avatar from "../Avatar";

const UserBadge = ({ username }) => {
  const { data: user } = useQuery(["user", "me"]);

  return (
    <Link to="/profile" id={"userBadge"}>
      <Avatar size="32px" infos={user?.avatar} />
      <span>{username}</span>
    </Link>
  );
};

UserBadge.propTypes = {
  username: PropTypes.string.isRequired,
};

const OfflineBanner = () => {
  const initialState = useMemo(() => navigator.onLine, []);

  const [playAnimation, setPlayAnimation] = useState(0);

  // Set the event listener for online and offline at mouting
  useEffect(() => {
    function updateOnlineStatus() {
      setPlayAnimation((c) => c + 1);
    }

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    return function cleanup() {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  return (
    <div id={"offlineBanner"}>
      <AnimTransition
        imageLink={connectionAnim}
        nbFrames={37}
        size={35}
        duration={1.5}
        initialState={initialState ? "end" : "start"}
        play={playAnimation}
      />
    </div>
  );
};

const TopBar = ({ username }) => (
  <nav>
    {username ? <UserBadge username={username} /> : <span></span>}
    <h1>
      <Link to={username ? "/homepage" : "/"}>Guacamole</Link>
    </h1>
    <OfflineBanner />
  </nav>
);

TopBar.propTypes = {
  username: PropTypes.string,
};

export default TopBar;
