import React from "react";
import { shallow } from "enzyme";
import { expect } from "chai";

import Train from "../components/layouts/Train";

describe("Train component", () => {
  it("should display the introduction firstly", () => {
    const wrapper = shallow(<Train />);

    expect(wrapper.find("h1")).to.have.length(1);
    expect(wrapper.find("#about")).to.have.length(1);
    expect(wrapper.find("button")).to.have.length(1);
  });
});
