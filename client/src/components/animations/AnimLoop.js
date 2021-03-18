import { PropTypes } from "prop-types";
import React, { useEffect, useState } from "react";

const AnimationLoop = ({ imageLink, nbFrames, size, duration }) => {
  const [currentFrame, setCurrentFrame] = useState(0);

  // Launch the animation interval at mount
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFrame((c) => (c + 1) % nbFrames);
    }, (1000 * duration) / nbFrames);

    // Delete timeout when umounting
    return function cleanup() {
      clearTimeout(interval);
    };
  }, [duration, nbFrames]);

  return (
    <div className="animation" style={{ height: size, width: size }}>
      <div
        className="animation-inside"
        style={{
          backgroundImage: `url(${imageLink})`,
          backgroundSize: `${size * nbFrames}px ${size}px`,
          backgroundPositionX: `${-size * currentFrame}px`,
        }}
      />
    </div>
  );
};

AnimationLoop.propTypes = {
  imageLink: PropTypes.string.isRequired,
  nbFrames: PropTypes.number.isRequired,
  size: PropTypes.number.isRequired,
  duration: PropTypes.number.isRequired,
};

export default AnimationLoop;
