function endpointGuard(handler, errorHandler) {
  return async (req, res) => {
    console.log('request...')
    try {
      await handler(req, res)
    } catch (e) {
      console.log(e)

      if (errorHandler) {
        errorHandler(e)
      } else res.status(500)
    }
    res.end()
  }
}

module.exports = {
  endpointGuard,
}
