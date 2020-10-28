import React, { useState, useEffect } from "react";
import PropTypes from "proptypes";

const Timer = ({ duration, stopTimer }) => {
  const [time, setTime] = useState(duration);

  useEffect(() => {
    if (time === 0) {
      stopTimer();
      return;
    }

    setTimeout(() => {
      setTime(time - 1);
    }, 1000);
  }, [time, stopTimer]);

  return <p>{time} s</p>;
};

Timer.propTypes = {
  duration: PropTypes.number.isRequired,
  stopTimer: PropTypes.func.isRequired
};

export default Timer;