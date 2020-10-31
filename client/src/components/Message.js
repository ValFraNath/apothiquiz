import React from "react";
import PropTypes from "proptypes";

const Message = ({ type, content }) => {
  let title;
  switch (type) {
    case "success":
      title = "Super";
      break;
    case "info":
      title = "À propos";
      break;
    case "warning":
      title = "Attention";
      break;
    case "error":
      title = "Erreur";
      break;
    default:
      title = "Message";
  }

  return (
    <section className={"message message-" + type}>
      <h1>{title}</h1>
      <p>{content}</p>
    </section>
  );
};

Message.propTypes = {
  type: PropTypes.oneOf(["success", "info", "warning", "error"]).isRequired,
  content: PropTypes.string.isRequired,
};

export default Message;
