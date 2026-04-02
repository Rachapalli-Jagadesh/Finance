const {
  createRecord,
  getRecordById,
  listRecords,
  updateRecord,
  deleteRecord,
} = require("../services/recordService");
const { success, created } = require("../utils/response");

async function createRecordHandler(req, res, next) {
  try {
    const { amount, type, category, date, notes } = req.body;
    const record = createRecord({
      userId: req.user.id,
      amount: parseFloat(amount),
      type,
      category,
      date,
      notes,
    });
    return created(res, record, "Financial record created");
  } catch (err) {
    next(err);
  }
}

async function listRecordsHandler(req, res, next) {
  try {
    const {
      type, category, startDate, endDate, search,
      page, limit, sortBy, sortDir,
    } = req.query;

    const result = listRecords({
      type,
      category,
      startDate,
      endDate,
      search,
      page: parseInt(page) || 1,
      limit: Math.min(parseInt(limit) || 20, 100),
      sortBy,
      sortDir,
    });

    return success(res, result.records, "Records retrieved", 200, result.pagination);
  } catch (err) {
    next(err);
  }
}

async function getRecordHandler(req, res, next) {
  try {
    const record = getRecordById(req.params.id);
    return success(res, record);
  } catch (err) {
    next(err);
  }
}

async function updateRecordHandler(req, res, next) {
  try {
    const { amount, type, category, date, notes } = req.body;
    const record = updateRecord(req.params.id, {
      amount: amount !== undefined ? parseFloat(amount) : undefined,
      type,
      category,
      date,
      notes,
    });
    return success(res, record, "Record updated successfully");
  } catch (err) {
    next(err);
  }
}

async function deleteRecordHandler(req, res, next) {
  try {
    const result = deleteRecord(req.params.id);
    return success(res, result, "Record deleted successfully");
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createRecordHandler,
  listRecordsHandler,
  getRecordHandler,
  updateRecordHandler,
  deleteRecordHandler,
};
