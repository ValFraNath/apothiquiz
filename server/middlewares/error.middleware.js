import HttpResponseWrapper from "../global/HttpResponseWrapper.js";

/**
 * Catch the thrown error and return a 400 error if
 * the reason is a user syntax error
 */
function handleSyntaxError(err, req, _res, next) {
  const res = new HttpResponseWrapper(_res);
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    res.sendUsageError(400, err.message);
    return;
  }
  next();
}

export default handleSyntaxError;
