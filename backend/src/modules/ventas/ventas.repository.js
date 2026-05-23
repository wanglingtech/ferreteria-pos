const { prisma } = require('../../config/database');

async function findAll() {
  return prisma.sale.findMany({
    include: {
      seller: {
        select: {
          id: true,
          fullName: true,
          username: true,
        },
      },
      items: {
        include: {
          product: {
            select: {
              id: true,
              sku: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

async function findById(id) {
  return prisma.sale.findUnique({
    where: { id },
    include: {
      seller: {
        select: {
          id: true,
          fullName: true,
          username: true,
          email: true,
        },
      },
      items: {
        include: {
          product: {
            select: {
              id: true,
              sku: true,
              name: true,
            },
          },
        },
      },
    },
  });
}

async function findProductsByIds(productIds, tx = prisma) {
  return tx.product.findMany({
    where: {
      id: { in: productIds },
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      stock: true,
      price: true,
    },
  });
}

async function createSaleWithItems(data) {
  return prisma.$transaction(async (tx) => {
    const sale = await tx.sale.create({
      data: {
        code: data.code,
        customerName: data.customerName || null,
        subtotal: data.subtotal,
        igv: data.igv,
        total: data.total,
        sellerId: data.sellerId,
      },
    });

    for (const item of data.items) {
      await tx.saleItem.create({
        data: {
          saleId: sale.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.lineTotal,
        },
      });

      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });

      await tx.stockMovement.create({
        data: {
          type: 'OUT',
          quantity: item.quantity,
          note: `Salida por venta ${sale.code}`,
          productId: item.productId,
          userId: data.sellerId,
        },
      });
    }

    return tx.sale.findUnique({
      where: { id: sale.id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
          },
        },
        seller: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
      },
    });
  });
}

module.exports = {
  findAll,
  findById,
  findProductsByIds,
  createSaleWithItems,
};
