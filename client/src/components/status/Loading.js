import { React } from "react";

import loadingAnim from "../../images/loading.png";

import AnimationLoop from "../animations/AnimationLoop";

const Loading = () => (
  <div className="loading">
    <AnimationLoop imageLink={loadingAnim} size={300} nbFrames={14} duration={1.0} />
    <span>Chargement</span>
  </div>
);

export default Loading;
