module.exports = {
  poweredByHeader: false,
  routes: [
    {
      src: "/.*",
      headers: {
        "Access-Control-Allow-Origin": "*",
        "X-Content-Type-Options": "nosniff",
        "X-XSS-Protection": "1",
      },
      continue: true,
    },
  ],
};
