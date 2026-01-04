import prisma from '../config/database.js';

export const getTiposArreglo = async (req, res) => {
  try {
    const tipos = await prisma.tipoArreglo.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
      include: {
        _count: {
          select: { arreglos: true },
        },
      },
    });
    res.json(tipos);
  } catch (error) {
    console.error('Error al obtener tipos de arreglo:', error);
    console.error('Error completo:', JSON.stringify(error, null, 2));
    
    // Si es un error de Prisma, dar más detalles
    if (error.code) {
      console.error('Código de error Prisma:', error.code);
    }
    
    res.status(500).json({ 
      error: 'Error al obtener tipos de arreglo',
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && { 
        stack: error.stack,
        code: error.code 
      })
    });
  }
};

export const createTipoArreglo = async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;

    if (!nombre) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    const tipo = await prisma.tipoArreglo.create({
      data: {
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || null,
        activo: true,
      },
    });

    res.status(201).json(tipo);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Ya existe un tipo con ese nombre' });
    }
    console.error('Error al crear tipo de arreglo:', error);
    res.status(500).json({ error: 'Error al crear tipo de arreglo' });
  }
};

export const updateTipoArreglo = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, activo } = req.body;

    const tipo = await prisma.tipoArreglo.findUnique({
      where: { id },
      include: {
        _count: {
          select: { arreglos: true },
        },
      },
    });

    if (!tipo) {
      return res.status(404).json({ error: 'Tipo de arreglo no encontrado' });
    }

    // No permitir desactivar si tiene arreglos
    if (activo === false && tipo._count.arreglos > 0) {
      return res.status(400).json({ 
        error: 'No se puede desactivar un tipo que tiene arreglos asociados' 
      });
    }

    const tipoActualizado = await prisma.tipoArreglo.update({
      where: { id },
      data: {
        nombre: nombre ? nombre.trim() : undefined,
        descripcion: descripcion !== undefined ? (descripcion?.trim() || null) : undefined,
        activo: activo !== undefined ? activo : undefined,
      },
    });

    res.json(tipoActualizado);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Ya existe un tipo con ese nombre' });
    }
    console.error('Error al actualizar tipo de arreglo:', error);
    res.status(500).json({ error: 'Error al actualizar tipo de arreglo' });
  }
};

export const deleteTipoArreglo = async (req, res) => {
  try {
    const { id } = req.params;

    const tipo = await prisma.tipoArreglo.findUnique({
      where: { id },
      include: {
        _count: {
          select: { arreglos: true },
        },
      },
    });

    if (!tipo) {
      return res.status(404).json({ error: 'Tipo de arreglo no encontrado' });
    }

    // No permitir eliminar si tiene arreglos
    if (tipo._count.arreglos > 0) {
      return res.status(400).json({ 
        error: 'No se puede eliminar un tipo que tiene arreglos asociados' 
      });
    }

    await prisma.tipoArreglo.delete({
      where: { id },
    });

    res.json({ message: 'Tipo de arreglo eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar tipo de arreglo:', error);
    res.status(500).json({ error: 'Error al eliminar tipo de arreglo' });
  }
};

