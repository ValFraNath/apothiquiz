import { PropTypes } from "prop-types";
import React from "react";

const AnimationSimple = ({ imageLink, nbFrames, size, duration }) => {
  const animationName = `animation-${imageLink.replaceAll(".", "").split("/").pop()}-${duration}`;

  return (
    <div className="animation" style={{ height: size, width: size }}>
      <style>
        {`
           @keyframes ${animationName} {
            from {
              background-position-x: 0;
            }
            to {
              background-position-x: ${-size * nbFrames}px;
            }
          }
        `}
      </style>
      <div
        className="animation-inside"
        style={{
          animation: `${animationName} ${duration}s infinite`,
          backgroundImage: `url(${imageLink})`,
          animationTimingFunction: `steps(${nbFrames})`,
        }}
      />
    </div>
  );
};

AnimationSimple.propTypes = {
  imageLink: PropTypes.string.isRequired,
  nbFrames: PropTypes.number.isRequired,
  size: PropTypes.number.isRequired,
  duration: PropTypes.number.isRequired,
};

export default AnimationSimple;
