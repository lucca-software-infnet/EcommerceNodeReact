// backend/src/middlewares/role.middleware.js

class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}

/**
 * Middleware para verificar roles/permissões
 */
export default function roleMiddleware(allowedRoles = []) {
  return async function (req, reply) {
    try {
      const user = req.user;
      
      if (!user) {
        throw new AppError('Não autenticado', 401);
      }
      
      // Verifica se usuário tem uma das roles permitidas
      if (allowedRoles.length > 0) {
        let userRole = 'USER';
        
        // Determina role do usuário baseado no seu schema
        if (user.ehAdmin) {
          userRole = 'ADMIN';
        } else if (user.tipo) { // Se tiver campo tipo no futuro
          userRole = user.tipo;
        }
        
        if (!allowedRoles.includes(userRole)) {
          throw new AppError('Acesso não autorizado', 403);
        }
        
        // Adiciona role ao objeto user para uso posterior
        req.user.role = userRole;
      }
      
      // Continua para o próximo handler
      return;
    } catch (error) {
      if (error instanceof AppError) {
        return reply.code(error.statusCode).send({
          error: error.message
        });
      }
      
      return reply.code(500).send({
        error: 'Erro interno no middleware de permissões'
      });
    }
  };
}

/**
 * Middleware para verificar se é dono do recurso
 */
export function ownerMiddleware(resourceType) {
  return async function (req, reply) {
    try {
      const user = req.user;
      const resourceId = req.params.id || req.params.userId;
      
      if (!user) {
        throw new AppError('Não autenticado', 401);
      }
      
      // ADMIN pode acessar qualquer recurso
      if (user.ehAdmin) {
        return;
      }
      
      // Para usuário comum, verifica se é dono
      if (resourceType === 'usuario' && user.id !== parseInt(resourceId)) {
        throw new AppError('Acesso não autorizado', 403);
      }
      
      // Para produto, precisa verificar no banco (será feito no service)
      if (resourceType === 'produto') {
        // A verificação será feita no service
        req.isOwnerCheckRequired = true;
      }
      
      return;
    } catch (error) {
      if (error instanceof AppError) {
        return reply.code(error.statusCode).send({
          error: error.message
        });
      }
      
      return reply.code(500).send({
        error: 'Erro interno no middleware de propriedade'
      });
    }
  };
}