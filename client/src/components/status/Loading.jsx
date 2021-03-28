import PropTypes from "prop-types";
import { React } from "react";

import loadingAnim from "../../images/sprites/loading-loop-300.png";
import AnimationLoop from "../animations/AnimLoop";

const Loading = ({ message = "Chargement..." }) => (
  <div className="loading">
    <AnimationLoop imageLink={loadingAnim} size={300} nbFrames={14} duration={1.0} />
    <span>{message}</span>
  </div>
);

Loading.propTypes = {
  message: PropTypes.string,
};

export default Loading;
