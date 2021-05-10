import { PropTypes } from "prop-types";
import { React } from "react";

import errorImg from "../../images/error.png";

const PageError = ({ message }) => (
  <div className="page-error">
    <img src={errorImg} alt="Pilette abimée par l'erreur" />
    <span>{message}</span>
  </div>
);

PageError.propTypes = {
  message: PropTypes.string.isRequired,
};

export default PageError;
