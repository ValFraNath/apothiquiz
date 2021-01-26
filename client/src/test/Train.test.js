import React from "react";
import { mount } from "enzyme";
import { expect } from "chai";

import Train from "../pages/Train";

describe("Train component", () => {
  let wrapper;
  beforeEach(() => {
    wrapper = mount(<Train />);
  });

  it("should display the introduction correctly", () => {
    expect(wrapper.state("gameState")).to.be.equal(Train.STATE_INTRO);

    expect(wrapper.find("img")).to.have.lengthOf(1);
    expect(wrapper.find("h1")).to.have.lengthOf(1);
    expect(wrapper.find("button")).to.have.lengthOf(1);
  });

  it("should display the game correctly", () => {
    wrapper.setState({ gameState: Train.STATE_PLAY });

    expect(wrapper.find("#quiz-topbar")).to.have.lengthOf(1);
    expect(wrapper.find("#quiz-question")).to.have.lengthOf(1);
    expect(wrapper.find("#timer")).to.have.lengthOf(1);
    expect(wrapper.find("#quiz-answers")).to.have.lengthOf(1);
  });

  it("should display the summary correctly", () => {
    wrapper.setState({ gameState: Train.STATE_SUMMARY });

    expect(wrapper.find("h1")).to.have.lengthOf(1);
    expect(wrapper.find("p")).to.have.lengthOf(1);
    expect(wrapper.find("details")).to.have.lengthOf(1);
    expect(wrapper.find("ul")).to.have.lengthOf(2);
  });
});
