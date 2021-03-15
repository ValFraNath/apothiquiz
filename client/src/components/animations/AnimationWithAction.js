import { PropTypes } from "prop-types";
import React, { useState, useEffect, useCallback, useRef } from "react";

import AnimationInfinite from "./AnimationInfinite";

/**
 * AnimationWithAction renders an infinite animation from a looped sprite,
 * and sometimes (random generated within timeBetweenAction[0] and timeBetweenAction[1])
 * if shows the action sprite just once
 */
const AnimationWithAction = ({ size, loopImage, actionImage, timeBetweenAction }) => {
  const [isAction, setIsAction] = useState(false);
  const timerIdRef = useRef(0);

  const randomTime = useCallback(() => {
    return (
      1000 * (timeBetweenAction[0] + (timeBetweenAction[1] - timeBetweenAction[0]) * Math.random())
    );
  }, [timeBetweenAction]);

  const launchActionAnim = useCallback(() => {
    setIsAction(true);

    timerIdRef.current = setTimeout(() => {
      setIsAction(false);

      // Setup the next action animation
      timerIdRef.current = setTimeout(() => {
        launchActionAnim();
      }, randomTime());
    }, 1000 * actionImage.duration);
  }, [actionImage.duration, randomTime]);

  useEffect(() => {
    // When component mounts
    timerIdRef.current = setTimeout(() => {
      launchActionAnim();
    }, 1000 * (2 + 8 * Math.random()));

    return function cleanup() {
      clearTimeout(timerIdRef.current);
    };
  }, [launchActionAnim, size]);

  if (isAction) {
    return <AnimationInfinite size={size} {...actionImage} />;
  }

  return <AnimationInfinite size={size} {...loopImage} />;
};

AnimationWithAction.propTypes = {
  size: PropTypes.number.isRequired,
  timeBetweenAction: PropTypes.array.isRequired,
  loopImage: PropTypes.exact({
    imageLink: PropTypes.string.isRequired,
    nbFrames: PropTypes.number.isRequired,
    duration: PropTypes.number.isRequired,
  }).isRequired,
  actionImage: PropTypes.exact({
    imageLink: PropTypes.string.isRequired,
    nbFrames: PropTypes.number.isRequired,
    duration: PropTypes.number.isRequired,
  }).isRequired,
};

export default AnimationWithAction;
