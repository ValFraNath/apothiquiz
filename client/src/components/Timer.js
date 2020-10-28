import React, {useEffect, useState} from "react";

const Timer = ({ duration }) => {
  const [time, setTime] = useState(duration);

  useEffect(() => {
    setInterval(() => {
        setTime(time - 1);
      },
      1000);
  }, [])

  return <p>{time} s</p>
};

export default Timer;