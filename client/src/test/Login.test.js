import { expect } from "chai";
import { shallow } from "enzyme";
import React from "react";

import Login from "../pages/Login";

describe("Well displayed Login component", () => {
  it("Should contains 2 text inputs and 1 button", (done) => {
    const wrapper = shallow(<Login />);

    expect(wrapper.find('input[type="text"]')).to.have.length(1);
    expect(wrapper.find('input[type="password"]')).to.have.length(1);
    expect(wrapper.find('input[type="submit"]')).to.have.length(1);
    done();
  });
});
