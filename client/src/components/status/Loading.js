import { React } from "react";

import loadingAnim from "../../images/loading.png";

import AnimationInfinite from "../animations/AnimationInfinite";

const Loading = () => (
  <div className="loading">
    <AnimationInfinite imageLink={loadingAnim} size={300} nbFrames={14} duration={1.0} />
    <span>Chargement</span>
  </div>
);

export default Loading;
