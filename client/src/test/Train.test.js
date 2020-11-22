import React from "react";
import { shallow } from "enzyme";
import { expect } from "chai";

import Train from "../components/layouts/Train";

describe("Train component", () => {
  it("should display the introduction firstly", () => {
    const wrapper = shallow(<Train />);
    expect(wrapper.find("IntroductionView")).to.have.length(1);
  });
});
