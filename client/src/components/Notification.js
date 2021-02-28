import { PropTypes } from "prop-types";
import React from "react";

const Notification = ({ title, text }) => {
  return (
    <div className="notification">
      <h2>{title}</h2>
      <p>{text}</p>
    </div>
  );
};

Notification.propTypes = {
  title: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
};

export default Notification;
