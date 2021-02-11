import { PropTypes } from "prop-types";
import React from "react";

const FullScreenMessage = ({ id, children }) => {
  return (
    <section className="fullscreen-message" id={id}>
      {children}
    </section>
  );
};

FullScreenMessage.propTypes = {
  id: PropTypes.string.isRequired,
  children: PropTypes.object.isRequired,
};

export default FullScreenMessage;
