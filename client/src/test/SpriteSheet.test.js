import React from "react";
import { shallow } from "enzyme";
import { expect } from "chai";
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

  it("setDirection", function (done) {
    sp.setDirection("reverse");
    expect(sp.state.direction).to.be.equal(-1);
    sp.setDirection("normal");
    expect(sp.state.direction).to.be.equal(1);
    try {
      sp.setDirection("aa");
    } catch (e) {
      expect(e.message).to.be.equal("Invalid direction");
    }
    expect(sp.state.direction).to.be.equal(1);
    done();
  });

  it("setCurrentFrame", function (done) {
    sp.setCurrentFrame(6);
    expect(sp.state.currentFrame).to.be.equal(6);
    sp.setCurrentFrame(0);
    expect(sp.state.currentFrame).to.be.equal(0);
    sp.setCurrentFrame(-1);
    expect(sp.state.currentFrame).to.be.equal(36);
    done();
  });

  it("play", function (done) {
    sp.setCurrentFrame(7);
    sp.setDirection("reverse");
    sp.play();

    setTimeout(function () {
      expect(sp.state.currentFrame).to.be.equal(0);

      sp.setCurrentFrame(20);
      sp.setDirection("normal");
      sp.play();

      setTimeout(function () {
        expect(sp.state.currentFrame).to.be.equal(36);
        done();
      }, 1500);
    }, 1500);
  });
});
