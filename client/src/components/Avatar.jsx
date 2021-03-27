import PropTypes from "prop-types";
import React from "react";

import { ReactComponent as BodyBottomImage } from "../images/avatar/bodyBottom.svg";
import ImageBodyTop from "../images/avatar/bodyTop.png";
import ImageEyes from "../images/avatar/eyes.png";
import ImageHands from "../images/avatar/hands.png";
import ImageHats from "../images/avatar/hats.png";
import ImageMouthes from "../images/avatar/mouthes.png";

const Avatar = ({ size, infos: { eyes, hands, hat, mouth, colorBG, colorBody }, reversed }) => (
  <div className="avatar" style={{ width: size, height: size }}>
    <div
      className="avatar-inside"
      style={{ backgroundColor: colorBG, transform: reversed ? "rotateY(180deg)" : "" }}
    >
      <img className="avatar-eyes" src={ImageEyes} data-choice={eyes} alt="Avatar eyes" />
      <img className="avatar-hands" src={ImageHands} data-choice={hands} alt="Avatar hands" />
      <img className="avatar-hat" src={ImageHats} data-choice={hat} alt="Avatar hat" />
      <img className="avatar-mouth" src={ImageMouthes} data-choice={mouth} alt="Avatar mouth" />
      <img className="avatar-body-top" src={ImageBodyTop} alt="Avatar body" />
      <BodyBottomImage className="avatar-body-bottom" fill={colorBody} alt="Avatar body" />
    </div>
  </div>
);

Avatar.defaultProps = {
  infos: {
    eyes: 0,
    hands: 0,
    hat: 0,
    mouth: 0,
    colorBody: "#000000", // black
    colorBG: "#D3D3D3", // lightgray
  },
  reversed: false,
};

Avatar.propTypes = {
  size: PropTypes.string.isRequired,
  infos: PropTypes.shape({
    eyes: PropTypes.number,
    hands: PropTypes.number,
    hat: PropTypes.number,
    mouth: PropTypes.number,
    colorBody: PropTypes.string,
    colorBG: PropTypes.string,
  }),
  reversed: PropTypes.bool,
};

export default Avatar;
