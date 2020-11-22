import React, { useState, useEffect } from "react";
import PropTypes from "proptypes";

const Timer = ({ inProgress, duration, updateParent }) => {
  const [seconds, setSeconds] = useState(duration);
  const [animationState, setAnimationState] = useState(true);

  useEffect(() => {
    if (!inProgress) {
      setAnimationState(false);
      return;
    }

    if (seconds === 0) {
      updateParent();
    }
    let interval = setTimeout(() => {
      setSeconds(seconds - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [inProgress, seconds, updateParent]);

  const timerStyle = {
    animationDuration: `${duration}s`,
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
