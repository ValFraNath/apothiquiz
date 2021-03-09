import { Cross1Icon } from "@modulz/radix-icons";
import { PropTypes } from "prop-types";
import React, { useState, useEffect } from "react";

const NotificationForeground = ({ title, text, closeNotification }) => {
  const [timer, setTimer] = useState(10);

  useEffect(() => {
    let interval = setTimeout(() => {
      setTimer(timer - 0.05);
    }, 50);

    if (timer <= 0) {
      closeNotification();
    }

    return () => clearInterval(interval);
  });

  return (
    <div className="notification">
      <div id="indicator" style={{ width: `${timer * 10}%` }}></div>

      <div id="close" onClick={closeNotification}>
        <Cross1Icon />
      </div>

      <h2>{title}</h2>
      <p>{text}</p>
    </div>
  );
};

NotificationForeground.propTypes = {
  title: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
  closeNotification: PropTypes.func.isRequired,
};

export default NotificationForeground;
