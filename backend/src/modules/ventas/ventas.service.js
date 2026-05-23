const { ZodError } = require('zod');

const { AppError } = require('../../shared/errors/AppError');
const ventasRepository = require('./ventas.repository');
const { createVentaSchema } = require('./ventas.schema');
const IGV_RATE = 0.18;

async function listarVentas() {
  return ventasRepository.findAll();
}

async function obtenerVenta(id) {
  const venta = await ventasRepository.findById(id);
  if (!venta) {
    throw new AppError('Venta no encontrada', 404);
  }
  return venta;
}

async function crearVenta(payload, authUser) {
  try {
    const parsed = createVentaSchema.parse(payload);
    const consolidatedItems = consolidateItems(parsed.items);
    const productIds = consolidatedItems.map((item) => item.productId);
    const products = await ventasRepository.findProductsByIds(productIds);

    if (products.length !== productIds.length) {
      throw new AppError('Uno o más productos no existen o están inactivos', 404);
    }

    const productMap = new Map(products.map((product) => [product.id, product]));

    const preparedItems = consolidatedItems.map((item) => {
      const product = productMap.get(item.productId);

      if (!product) {
        throw new AppError(`Producto ${item.productId} no encontrado`, 404);
      }

      if (product.stock < item.cantidad) {
        throw new AppError(
          `Stock insuficiente para producto ${product.name}. Disponible: ${product.stock}, solicitado: ${item.cantidad}`,
          409,
        );
      }

      const unitPrice = Number(product.price);
      const lineTotal = Number((unitPrice * item.cantidad).toFixed(2));

      return {
        productId: item.productId,
        quantity: item.cantidad,
        unitPrice,
        lineTotal,
      };
    });

    const subtotal = Number(
      preparedItems.reduce((acc, item) => acc + item.lineTotal, 0).toFixed(2),
    );
    const igv = Number((subtotal * IGV_RATE).toFixed(2));
    const total = Number((subtotal + igv).toFixed(2));

    return ventasRepository.createSaleWithItems({
      code: generateSaleCode(),
      customerName: parsed.clienteNombre,
      subtotal,
      igv,
      total,
      sellerId: authUser.sub,
      items: preparedItems,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppError('Payload de venta inválido', 400, error.flatten());
    }
    throw error;
  }
}

function consolidateItems(items) {
  const bucket = new Map();

  for (const item of items) {
    const previous = bucket.get(item.productoId);
    if (!previous) {
      bucket.set(item.productoId, {
        productId: item.productoId,
        cantidad: item.cantidad,
      });
      continue;
    }

    previous.cantidad += item.cantidad;
  }

  return Array.from(bucket.values());
}

function generateSaleCode() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const suffix = String(Math.floor(Math.random() * 100000)).padStart(5, '0');
  return `V-${yyyy}${mm}${dd}-${suffix}`;
}

module.exports = {
  listarVentas,
  obtenerVenta,
  crearVenta,
};
