import { React } from "react";

import loadingAnim from "../../images/loading.png";

import AnimationSimple from "../animations/AnimationInfinite";

const Loading = () => (
  <div className="loading">
    <AnimationSimple imageLink={loadingAnim} size={300} nbFrames={14} duration={1.0} />
    <span>Chargement</span>
  </div>
);

export default Loading;
