export const expectations = {
  students: {
    users: ["fpoguet", "nhoun", "vperigno", "pwater", "fdadeau", "alclairet", "mpudlo"],
    admins: ["fdadeau", "mpudlo"],
  },
  duplicates: {
    users: ["fpoguet", "nhoun", "vperigno", "pwater", "fdadeau", "alclairet", "mpudlo"],
    admins: ["fdadeau", "mpudlo", "fpoguet"],
  },
  invalidLogins: {
    users: [
      "fpoguet",
      "n-houn",
      "vperignooooooooooooooooooooooooo",
      "pwater",
      "fdad0",
      "alclairet",
      "mpudlo",
    ],
    admins: ["fdad0", "mpudlo"],
  },
  invalidAdmins: {
    users: ["fpoguet", "nhoun", "vperigno", "pwater", "fdadeau", "alclairet", "mpudlo"],
    admins: ["mpudlo"],
  },
  worst: {
    users: [
      "fpoguet",
      "nhoun",
      "mpudlo",
      "vperignooooooooooooooo00000000oo",
      "pwater",
      "fdadeau",
      "a-l-clairet",
      "fdadau",
    ],
    admins: [],
  },
};
