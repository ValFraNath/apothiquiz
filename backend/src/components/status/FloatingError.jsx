import { PropTypes } from "prop-types";
import { React } from "react";

const FloatingError = ({ message }) => (
  <div className="floating-error">
    <p>{message}</p>
  </div>
);

FloatingError.propTypes = {
  message: PropTypes.string.isRequired,
};

export default FloatingError;
