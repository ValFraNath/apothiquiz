import React from "react";
import PropTypes from "prop-types";

import ImageEyes from "../images/avatar/eyes.png";
import ImageHands from "../images/avatar/hands.png";
import ImageHats from "../images/avatar/hats.png";
import ImageMouthes from "../images/avatar/mouthes.png";
import ImageBodyTop from "../images/avatar/bodyTop.png";
import { ReactComponent as BodyBottom } from "../images/avatar/bodyBottom.svg";

const Avatar = function ({
  size,
  eyes = 0,
  hands = 0,
  hat = 0,
  mouth = 0,
  colorBG = "#d3d3d3",
  colorBody = "#0c04fc",
}) {
  return (
    <div
      className="avatar"
      style={{
        width: size,
        height: size,
      }}
    >
      <div className="avatar-inside" style={{ backgroundColor: colorBG }}>
        <img className="avatar-eyes" src={ImageEyes} data-choice={eyes} alt="Avatar eyes" />
        <img className="avatar-hands" src={ImageHands} data-choice={hands} alt="Avatar hands" />
        <img className="avatar-hat" src={ImageHats} data-choice={hat} alt="Avatar hat" />
        <img className="avatar-mouth" src={ImageMouthes} data-choice={mouth} alt="Avatar mouth" />
        <img className="avatar-body-top" src={ImageBodyTop} alt="Avatar body" />
        <BodyBottom className="avatar-body-bottom" fill={colorBody} alt="Avatar body" />
      </div>
    </div>
  );
};

Avatar.propTypes = {
  size: PropTypes.string.isRequired,
  eyes: PropTypes.number,
  hands: PropTypes.number,
  hat: PropTypes.number,
  mouth: PropTypes.number,
  colorBody: PropTypes.string,
  colorBG: PropTypes.string,
};

export default Avatar;
