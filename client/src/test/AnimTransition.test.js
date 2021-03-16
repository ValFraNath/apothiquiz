import { expect, assert } from "chai";
import { shallow } from "enzyme";
import React from "react";

import AnimTransition from "../components/animations/AnimTransition";
import sprite from "../images/sprites/network-status.png";

describe("sprite sheet component have a good behavior", () => {
  let sp = null;
  beforeEach((done) => {
    shallow(
      <AnimTransition
        image={sprite}
        frameHeight={54}
        frameWidth={64}
        steps={37}
        timing={1}
        get={(s) => {
          sp = s;
        }}
      />
    );
    done();
  });

  it("constructor", (done) => {
    expect(sp.state.currentFrame).to.be.equal(0);
    expect(sp.state.direction).to.be.equal(1);
    done();
  });

  it("setDirection - valid direction", (done) => {
    sp.setDirection("reverse");
    expect(sp.state.direction).to.be.equal(-1);
    sp.setDirection("normal");
    expect(sp.state.direction).to.be.equal(1);
    done();
  });

  it("setDirection - invalid direction", (done) => {
    assert.throws(() => sp.setDirection("aa"), Error);
    expect(sp.state.direction).to.be.equal(1);

    sp.setDirection("reverse");

    assert.throws(() => sp.setDirection(null), Error);
    expect(sp.state.direction).to.be.equal(-1);

    done();
  });

  it("setCurrentFrame - valid frame number", (done) => {
    sp.setCurrentFrame(6);
    expect(sp.state.currentFrame).to.be.equal(6);
    sp.setCurrentFrame(36);
    expect(sp.state.currentFrame).to.be.equal(36);
    sp.setCurrentFrame(0);
    expect(sp.state.currentFrame).to.be.equal(0);
    sp.setCurrentFrame(-1);
    expect(sp.state.currentFrame).to.be.equal(36);

    done();
  });

  it("setCurrentFrame - invalid frame number", (done) => {
    assert.throws(() => sp.setCurrentFrame(40), Error);
    assert.throws(() => sp.setCurrentFrame(-5), Error);
    expect(sp.state.currentFrame).to.be.equal(0);
    sp.setCurrentFrame(15);
    assert.throws(() => sp.setCurrentFrame("17"), Error);
    assert.throws(() => sp.setCurrentFrame(null), Error);
    assert.throws(() => sp.setCurrentFrame(), Error);
    expect(sp.state.currentFrame).to.be.equal(15);
    done();
  });

  it("play reverse", (done) => {
    let i = 7;
    sp.setCurrentFrame(i);
    sp.setDirection("reverse");

    sp.play(
      (currentFrame, currentDirection) => {
        expect(currentFrame).to.be.equal(--i);
        expect(currentDirection).to.be.equal(-1);
      },
      (finalFrame, finalDirection) => {
        expect(finalDirection).to.be.equal(-1);
        expect(finalFrame).to.be.equal(0);
        done();
      }
    );
  });

  it("play reverse", (done) => {
    let i = 3;
    sp.setCurrentFrame(i);
    sp.setDirection("normal");

    sp.play(
      (currentFrame, currentDirection) => {
        expect(currentFrame).to.be.equal(++i);
        expect(currentDirection).to.be.equal(1);
      },
      (finalFrame, finalDirection) => {
        expect(finalDirection).to.be.equal(1);
        expect(finalFrame).to.be.equal(36);
        done();
      }
    );
  });
});
