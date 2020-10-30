import React from "react";
import { shallow } from "enzyme";
import { expect } from "chai";

import Train from "../components/Train";

describe("Train component", () => {
  it("should display the introduction firstly", () => {
    const wrapper = shallow(<Train />);
    expect(wrapper.containsMatchingElement(<h1>Mode entraînement</h1>)).to.equal(true);
  });
});