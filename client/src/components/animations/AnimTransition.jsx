import PropTypes from "prop-types";
import React, { useCallback, useEffect, useRef, useState } from "react";

// Update the play prop when you want the animation to launch
const AnimTransition = ({ imageLink, nbFrames, size, duration, initialState, play }) => {
  const timerIdRef = useRef(0);
  const [direction, setDirection] = useState(initialState === "end" ? 1 : -1);
  const [currentFrame, setCurrentFrame] = useState(initialState === "end" ? nbFrames - 1 : 0);

  const updateFrame = useCallback(
    (oldFrame, direction) => {
      clearTimeout(timerIdRef.current);

      const newFrame = oldFrame + direction;
      setCurrentFrame(newFrame);

      if (newFrame <= 0 || newFrame >= nbFrames - 1) {
        return;
      }

      timerIdRef.current = setTimeout(() => {
        updateFrame(newFrame, direction);
      }, (1000 * duration) / nbFrames);
    },
    [nbFrames, duration]
  );

  // At mount
  useEffect(() => {
    // Delete timeout when umounting
    return function cleanup() {
      clearTimeout(timerIdRef.current);
    };
  }, []);

  // Launch timer when play prop changes
  useEffect(
    () => {
      clearTimeout(timerIdRef.current);
      updateFrame(currentFrame, direction * -1);
      setDirection((d) => d * -1);
    },
    [play, updateFrame] // eslint-disable-line react-hooks/exhaustive-deps
    // because we only need to run the hook when play is changed
  );

  return (
    <div
      className="animation"
      style={{
        height: size,
        width: size,
        backgroundImage: `url(${imageLink})`,
        backgroundSize: `${size * nbFrames}px ${size}px`,
        backgroundPositionX: `${-size * currentFrame}px`,
      }}
    ></div>
  );
};

AnimTransition.propTypes = {
  imageLink: PropTypes.string.isRequired,
  nbFrames: PropTypes.number.isRequired,
  size: PropTypes.number.isRequired,
  duration: PropTypes.number.isRequired,
  initialState: PropTypes.oneOf(["start", "end"]).isRequired,
  play: PropTypes.any.isRequired,
};

export default AnimTransition;
