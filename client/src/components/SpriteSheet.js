import React, { Component } from "react";
import PropTypes from "proptypes";

class SpriteSheet extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentFrame: 0,
      direction: 1,
    };
  }

  /**
   * Set the animation direction
   * @param {string} direction normal | reverse
   */
  setDirection = (direction) => {
    if (direction === "normal") {
      this.setState({ direction: 1 });
    } else if (direction === "reverse") {
      this.setState({ direction: -1 });
    } else {
      throw new Error("Invalid direction");
    }
  };

  /**
   * Set the spritesheet current frame
   * @param {number} newCurrentFrame The new current frame
   */
  setCurrentFrame = (newCurrentFrame) => {
    if (
      newCurrentFrame == null ||
      !Number.isInteger(newCurrentFrame) ||
      newCurrentFrame < -1 ||
      newCurrentFrame >= this.props.steps
    ) {
      throw new Error("Invalid frame number");
    }
    this.setState({
      currentFrame:
        newCurrentFrame === -1 ? this.props.steps - 1 : newCurrentFrame,
    });
  };

  /**
   * Run the animation
   * @param {function|null} onEachStep Function to call every time a new frame is displayed
   * @param {function|null} onAnimationEnd Function to call when the animation is finished
   */
  play = (onEachStep = null, onAnimationEnd) => {
    let int = setInterval(() => {
      const { currentFrame: frame, direction } = this.state;
      if (
        (frame === this.props.steps - 1 && direction === 1) ||
        (frame === 0 && direction === -1)
      ) {
        clearInterval(int);
        this.setState({
          interval: null,
        });
        if (onAnimationEnd) {
          onAnimationEnd(this.state.currentFrame, this.state.direction);
        }
        return;
      }

      this.setState({
        currentFrame: this.state.currentFrame + this.state.direction,
      });
      if (onEachStep) {
        onEachStep(this.state.currentFrame, this.state.direction);
      }
    }, (1000 * this.props.timing) / this.props.steps);
  };

  componentDidMount() {
    if (this.props.get) {
      this.props.get(this);
    }
  }

  render() {
    return (
      <div
        className="spritesheet"
        style={{
          height: `${this.props.frameHeight}px`,
          width: `${this.props.frameWidth}px`,
          backgroundImage: `url(${this.props.image})`,
          backgroundSize: `${this.props.frameWidth * this.props.steps}px ${
            this.props.frameHeight
          }px`,
          backgroundPositionX: `${
            -this.state.currentFrame * this.props.frameWidth
          }px`,
        }}
      />
    );
  }
}

SpriteSheet.propTypes = {
  image: PropTypes.string.isRequired,
  frameHeight: PropTypes.number.isRequired,
  frameWidth: PropTypes.number.isRequired,
  steps: PropTypes.number.isRequired,
  timing: PropTypes.number.isRequired,
  get: PropTypes.func,
};

export default SpriteSheet;
