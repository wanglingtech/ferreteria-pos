async function findAll() {
  return [];
}

async function findById(id) {
  return null;
}

async function create(data) {
  return { id: 0, ...data };
}

async function update(id, data) {
  return { id, ...data };
}

async function remove(id) {
  return { id, deleted: true };
}

module.exports = {
  findAll,
  findById,
  create,
  update,
  remove,
};
