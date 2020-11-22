import React, { useState, useEffect } from "react";
import PropTypes from "proptypes";

const Timer = ({ inProgress, duration, updateParent }) => {
  const [initialTime] = useState(duration);
  const [animationState, setAnimationState] = useState(true);

  useEffect(() => {
    if (!inProgress) {
      setAnimationState(false);
      return;
    }

    let interval = setTimeout(() => {
      updateParent(duration - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [inProgress, duration, updateParent]);

  const timerStyle = {
    animationDuration: `${initialTime}s`,
    animationPlayState: animationState ? "running" : "paused",
  };

  return (
    <div id="timer">
      <div id="timer-color" style={timerStyle}></div>
      <div id="timer-stroke"></div>
    </div>
  );
};

Timer.propTypes = {
  inProgress: PropTypes.bool.isRequired,
  duration: PropTypes.number.isRequired,
  updateParent: PropTypes.func.isRequired,
};

export default Timer;
