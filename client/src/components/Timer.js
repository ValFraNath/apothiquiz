import React, {useState, useEffect} from "react";

const Timer = ({ duration }) => {
  const [time, setTime] = useState(duration);

  useEffect(() => {
    if (time === 0) {
      return;
    }
    setTimeout(() => {
      setTime(time - 1);
    }, 1000);
  });

  return <p>{time} s</p>;
};

export default Timer;