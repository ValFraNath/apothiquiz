import { expect } from "chai";
import { shallow, mount } from "enzyme";
import React from "react";

import App from "../App";
te;

/* eslint-disable */
describe("Good display", () => {
  // Jest test
  it("renders without crashing", async () => {
    const wrapper = shallow(<App />);
    await wrapper.instance().componentDidMount();
  });

  // Chai test
  it("contains the good link", () => {
    const wrapper = mount(<App />);
    expect(wrapper.text()).to.match(/À Propos/i);
  });
});
