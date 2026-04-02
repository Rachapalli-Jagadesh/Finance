const ROLES = {
  VIEWER: "viewer",
  ANALYST: "analyst",
  ADMIN: "admin",
};

/**
 * Permission matrix — maps each action to the minimum role(s) allowed.
 * Listed from most-permissive to least.
 */
const PERMISSIONS = {
  // Records
  READ_RECORDS:    [ROLES.VIEWER, ROLES.ANALYST, ROLES.ADMIN],
  CREATE_RECORD:   [ROLES.ADMIN],
  UPDATE_RECORD:   [ROLES.ADMIN],
  DELETE_RECORD:   [ROLES.ADMIN],

  // Dashboard
  READ_DASHBOARD:  [ROLES.VIEWER, ROLES.ANALYST, ROLES.ADMIN],
  READ_INSIGHTS:   [ROLES.ANALYST, ROLES.ADMIN],

  // Users
  READ_USERS:      [ROLES.ADMIN],
  CREATE_USER:     [ROLES.ADMIN],
  UPDATE_USER:     [ROLES.ADMIN],
  DELETE_USER:     [ROLES.ADMIN],
};

const CATEGORIES = [
  "salary", "freelance", "investment", "rent", "utilities",
  "food", "transport", "healthcare", "entertainment", "shopping",
  "education", "insurance", "tax", "other",
];

module.exports = { ROLES, PERMISSIONS, CATEGORIES };
