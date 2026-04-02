const { createUser } = require("../services/authService");
const { listUsers, getUserById, updateUser, deactivateUser } = require("../services/userService");
const { success, created, error } = require("../utils/response");

async function createUserHandler(req, res, next) {
  try {
    const user = await createUser(req.body);
    return created(res, user, "User created successfully");
  } catch (err) {
    next(err);
  }
}

async function listUsersHandler(req, res, next) {
  try {
    const { role, status, page, limit } = req.query;
    const result = listUsers({
      role,
      status,
      page: parseInt(page) || 1,
      limit: Math.min(parseInt(limit) || 20, 100),
    });
    return success(res, result.users, "Users retrieved", 200, result.pagination);
  } catch (err) {
    next(err);
  }
}

async function getUserHandler(req, res, next) {
  try {
    const user = getUserById(req.params.id);
    return success(res, user);
  } catch (err) {
    next(err);
  }
}

async function updateUserHandler(req, res, next) {
  try {
    const user = await updateUser(req.params.id, req.body);
    return success(res, user, "User updated successfully");
  } catch (err) {
    next(err);
  }
}

async function deactivateUserHandler(req, res, next) {
  try {
    const user = deactivateUser(req.params.id);
    return success(res, user, "User deactivated successfully");
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createUserHandler,
  listUsersHandler,
  getUserHandler,
  updateUserHandler,
  deactivateUserHandler,
};
