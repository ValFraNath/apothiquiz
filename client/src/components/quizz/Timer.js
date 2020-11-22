import React, { useState, useEffect } from "react";
import PropTypes from "proptypes";

const Timer = ({ inProgress, duration, updateParent }) => {
  const [initialDuration] = useState(duration);

  useEffect(() => {
    if (!inProgress || duration === 0) {
      return;
    }

    setTimeout(() => {
      updateParent();
    }, 1000);
  }, [inProgress, duration, updateParent]);

  const timerStyle = {
    animationDuration: `${initialDuration}s`,
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
