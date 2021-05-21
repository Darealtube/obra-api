module.exports = {
  async headers() {
    return [
      {
        source: "/api/graphql",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
        ],
      },
    ];
  },
};
