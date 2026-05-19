async function findAll() {
  return [];
}

async function create(data) {
  return {
    id: 0,
    ...data,
  };
}

module.exports = {
  findAll,
  create,
};
