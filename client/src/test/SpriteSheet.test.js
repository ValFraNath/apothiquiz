import React from "react";
import { shallow } from "enzyme";
import { expect, assert } from "chai";
import SpriteSheet from "../components/SpriteSheet";
import spritesheet from "../images/connection_status.png";

describe("sprite sheet component have a good behavior", function () {
  let sp = null;
  beforeEach(function (done) {
    shallow(
      <SpriteSheet
        image={spritesheet}
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

  it("constructor", function (done) {
    expect(sp.state.currentFrame).to.be.equal(0);
    expect(sp.state.direction).to.be.equal(1);
    done();
  });

  it("setDirection - valid direction", function (done) {
    sp.setDirection("reverse");
    expect(sp.state.direction).to.be.equal(-1);
    sp.setDirection("normal");
    expect(sp.state.direction).to.be.equal(1);
    done();
  });

  it("setDirection - invalid direction", function (done) {
    assert.throws(() => sp.setDirection("aa"), Error);
    expect(sp.state.direction).to.be.equal(1);

    sp.setDirection("reverse");

    assert.throws(() => sp.setDirection(null), Error);
    expect(sp.state.direction).to.be.equal(-1);

    done();
  });

  it("setCurrentFrame - valid frame number", function (done) {
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

  it("setCurrentFrame - invalid frame number", function (done) {
    assert.throws(() => sp.setCurrentFrame(40), Error);
    assert.throws(() => sp.setCurrentFrame(-5), Error);
    expect(sp.state.currentFrame).to.be.equal(0);
    sp.setCurrentFrame(15);
    assert.throws(() => sp.setCurrentFrame(null), Error);
    assert.throws(() => sp.setCurrentFrame(), Error);
    expect(sp.state.currentFrame).to.be.equal(15);
    done();
  });

  it("play reverse", function (done) {
    let i = 7;
    sp.setCurrentFrame(i);
    sp.setDirection("reverse");

    sp.play(
      function (currentFrame, currentDirection) {
        expect(currentFrame).to.be.equal(--i);
        expect(currentDirection).to.be.equal(-1);
      },
      function (finalFrame, finalDirection) {
        expect(finalDirection).to.be.equal(-1);
        expect(finalFrame).to.be.equal(0);
        done();
      }
    );
  });

  it("play reverse", function (done) {
    let i = 3;
    sp.setCurrentFrame(i);
    sp.setDirection("normal");

    sp.play(
      function (currentFrame, currentDirection) {
        expect(currentFrame).to.be.equal(++i);
        expect(currentDirection).to.be.equal(1);
      },
      function (finalFrame, finalDirection) {
        expect(finalDirection).to.be.equal(1);
        expect(finalFrame).to.be.equal(36);
        done();
      }
    );
  });
});
