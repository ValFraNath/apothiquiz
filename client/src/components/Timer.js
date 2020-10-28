import React, { useState, useEffect } from "react";
import PropTypes from "proptypes";

const Timer = ({ duration, updateParent }) => {
  const [time, setTime] = useState(duration);

  useEffect(() => {
    updateParent(time);

    if (time === 0) {
      return;
    }

    setTimeout(() => {
      setTime(time - 1);
    }, 1000);
  }, [time, updateParent]);

  return <p>{time} s</p>;
};

Timer.propTypes = {
  duration: PropTypes.number.isRequired,
  updateParent: PropTypes.func.isRequired
};

export default Timer;