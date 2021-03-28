import { PropTypes } from "prop-types";
import { React } from "react";

import errorImg from "../../images/error.png";

const FloatingError = ({ message }) => (
  <div className="floating-error">
    <img src={errorImg} alt="Pilette abimée par l'erreur" />
    <p>{message}</p>
  </div>
);

FloatingError.propTypes = {
  message: PropTypes.string.isRequired,
};

export default FloatingError;
