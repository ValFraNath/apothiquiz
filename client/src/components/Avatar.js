import React from "react";
import PropTypes from "proptypes";

import ImageEyes from "../images/avatar/eyes.png";
import ImageHands from "../images/avatar/hands.png";
import ImageHats from "../images/avatar/hats.png";
import ImageMouthes from "../images/avatar/mouthes.png";
import ImageBodyTop from "../images/avatar/bodyTop.png";
import { ReactComponent as BodyBottom } from "../images/avatar/bodyBottom.svg";

const Avatar = function (props) {
  return (
    <div
      className="avatar"
      style={{
        width: props.size,
        height: props.size,
      }}
    >
      <div className="avatar-inside" style={{ backgroundColor: props.colorBG }}>
        <img className="avatar-eyes" src={ImageEyes} data-choice={props.eyes} alt="Avatar eyes" />
        <img className="avatar-hands" src={ImageHands} data-choice={props.hands} alt="Avatar hands" />
        <img className="avatar-hat" src={ImageHats} data-choice={props.hat} alt="Avatar hat" />
        <img className="avatar-mouth" src={ImageMouthes} data-choice={props.mouth} alt="Avatar mouth" />
        <img className="avatar-body-top" src={ImageBodyTop} alt="Avatar body" />
        <BodyBottom className="avatar-body-bottom" fill={props.colorBody} alt="Avatar body" />
      </div>
    </div>
  );
};

Avatar.propTypes = {
  size: PropTypes.string,
  eyes: PropTypes.number.isRequired,
  hands: PropTypes.number.isRequired,
  hat: PropTypes.number.isRequired,
  mouth: PropTypes.number.isRequired,
  colorBody: PropTypes.string.isRequired,
  colorBG: PropTypes.string.isRequired,
};

export default Avatar;
