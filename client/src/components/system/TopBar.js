import axios from "axios";
import PropTypes from "prop-types";
import React, { Component, useState, useEffect } from "react";
import { Link } from "react-router-dom";
// import { CaretLeftIcon } from "@modulz/radix-icons";

import connectionAnim from "../../images/connection_status.png";
import Avatar from "../Avatar";
import SpriteSheet from "../SpriteSheet";

class UserBadge extends Component {
  constructor(props) {
    super(props);

    this.state = {
      eyes: 0,
      hands: 0,
      hat: 0,
      mouth: 0,
      colorBody: "#0c04fc", // blue
      colorBG: "#D3D3D3", // lightgray
    };
  }

  componentDidMount() {
    // TODO? Use global state?
    axios
      .get(`/api/v1/users/me`)
      .then((res) => {
        const avatar = res.data.avatar;
        this.setState({
          eyes: avatar.eyes,
          hands: avatar.hands,
          hat: avatar.hat,
          mouth: avatar.mouth,
          colorBody: avatar.colorBody,
          colorBG: avatar.colorBG,
        });
      })
      .catch((error) => {
        // TODO show message
        console.error(error);
        return;
      });
  }

  render() {
    return (
      <Link to="/profile" id={"userBadge"}>
        <Avatar
          size="32px"
          eyes={this.state.eyes}
          hands={this.state.hands}
          hat={this.state.hat}
          mouth={this.state.mouth}
          colorBody={this.state.colorBody}
          colorBG={this.state.colorBG}
        />
        <span>{this.props.pseudo}</span>
      </Link>
    );
  }
}

UserBadge.propTypes = {
  pseudo: PropTypes.string.isRequired,
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

const TopBar = ({ user }) => {
  return (
    <nav>
      {user ? <UserBadge pseudo={user} /> : <span></span>}
      <h1>
        <Link to={user ? "/homepage" : "/"}>Guacamole</Link>
      </h1>
      <OfflineBanner />
    </nav>
  );
};

TopBar.propTypes = {
  user: PropTypes.string,
};

export default TopBar;
