import PropTypes from "prop-types";
import React, { useState, useEffect } from "react";

const Timer = ({ duration, updateParent }) => {
  const [initialTime] = useState(duration);

  useEffect(() => {
    let interval = setTimeout(() => {
      updateParent(duration - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [duration, updateParent]);

  const timerStyle = {
    animationDuration: `${initialTime}s`,
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
