export function errorHandler(error, request, response, next) {
    console.error(error.message);

    response.status(error.status || 500).json({
        message: error.message || "Something went wrong"
    });
}
