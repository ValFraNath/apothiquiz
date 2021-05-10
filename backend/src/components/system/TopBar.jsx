import PropTypes from "prop-types";
import React, { useState, useEffect, useMemo } from "react";

import connectionAnim from "../../images/sprites/network-status-60.png";
import Auth from "../../utils/authentication";
import AnimTransition from "../animations/AnimTransition";


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
      {Auth.getCurrentUser() &&
      <button
        className="btn"
        onClick={async () => {
          await Auth.logout();
          document.location.replace("/");
        }}
      >
        Déconnexion
      </button>
    }
    </div>
  );
};

const TopBar = () => (
  <nav>
    <h1>
      Apothiquiz
    </h1>
    <h2>
    Espace Administrateur
    </h2>
    <OfflineBanner />
  </nav>
);

TopBar.propTypes = {
  username: PropTypes.string,
};

export default TopBar;
