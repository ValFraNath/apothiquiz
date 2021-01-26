/**
 * Catch the thrown error and return a 400 error if
 * the reason is a user syntax error
 */
function handleSyntaxError(err, req, res, next) {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    res.status(400).json({ message: err.message });
    return;
  }
  next();
}

export default handleSyntaxError;
