const express = require('express')
const router = express.Router()

const homeController = require('../controllers/homeController')
const usuarioController = require('../controllers/usuario.controller')
const authController = require('../controllers/authController');
const adminController = require('../controllers/adminController');
const grupoController = require('../controllers/grupoController');
const meetiController = require('../controllers/meetiController');

const meetiControllerFE  = require('../controllers/frontend/meetiControllerFE');
const usuariosControllerFE = require('../controllers/frontend/usuariosControllerFE');
const gruposControllerFE = require('../controllers/frontend/gruposControllerFE');
const comentarioControllerFE = require('../controllers/frontend/comentarioControllerFE');
const busquedaControllerFE = require('../controllers/frontend/busquedaControllerFE');

module.exports = function() {

    /*Area publica */
    router.get('/', homeController.home);

    // Muestra un meeti
    router.get('/meeti/:slug', 
        meetiControllerFE.mostrarMeeti
    );

    //Confirma la asistencia a meeti
    router.post('/confirmar-asistencia/:slug', 
        meetiControllerFE.confirmarAsistencia
    )

    //Muestra asistencia del meeti
    router.get('/asistentes/:slug',
        meetiControllerFE.mostrarAsistentes
    )

    //Agrega comentarios al meeti
    router.post('/meeti/:id', 
        comentarioControllerFE.agregarComentario
    )

    //Eliminar comentarios en el meeti
    router.post('/eliminar-comentario', 
        comentarioControllerFE.eliminarComentario
    )

    //Muestra perfiles en el frontend
    router.get('/usuarios/:id', 
        usuariosControllerFE.mostrarUsuarios
    )

    //Muestra los grupos en el frontend
    router.get('/grupos/:id',
        gruposControllerFE.mostrarGrupo
    )

    //Muestra meeti's por categoria
    router.get('/categoria/:categoria',
        meetiControllerFE.mostrarCategoria
    )

    //Añade la busqueda
    router.get('/busqueda',
        busquedaControllerFE.resultadoBusqueda
    )

    //Crear y confirmar cuentas
    router.get('/crear-cuenta', usuarioController.formCrearCuenta);
    router.post('/crear-cuenta', usuarioController.crearNuevaCuenta);
    router.get('/confirmar-cuenta/:correo', usuarioController.confirmarCuenta);
    
    //Iniciar sesion
    router.get('/iniciar-sesion', usuarioController.formIniciarSesion);
    router.post('/iniciar-sesion', authController.autenticarUsuario);

    //Cerrar sesion
    router.get('/cerrar-sesion',
        authController.usuarioAutenticado,
        authController.cerrarSesion
    )

    /*Area privada */

    //pANEL DE ADMINISTRACION
    router.get('/administracion', authController.usuarioAutenticado, adminController.panelAdministracion);

    //NUevo grupos
    router.get('/nuevo-grupo',
        authController.usuarioAutenticado,
        grupoController.formNuevoGrupo
    )

    router.post('/nuevo-grupo', 
        grupoController.subirImagen,
        grupoController.crearGrupos
    )

    //Editar grupos
    router.get('/editar-grupo/:grupoId',
        authController.usuarioAutenticado,
        grupoController.formEditarGrupo
    )

    router.post('/editar-grupo/:grupoId',
        authController.usuarioAutenticado,
        grupoController.editarGrupo
    )

    //Editar la imagen del grupo
    router.get('/imagen-grupo/:grupoId',
        authController.usuarioAutenticado,
        grupoController.formEditarImagen
    )

    router.post('/imagen-grupo/:grupoId',
        authController.usuarioAutenticado,
        grupoController.subirImagen,
        grupoController.editarImagen
    )

    //Eliminar grupos
    router.get('/eliminar-grupo/:grupoId',
        authController.usuarioAutenticado,
        grupoController.formEliminarGrupo
    )

    router.post('/eliminar-grupo/:grupoId',
        authController.usuarioAutenticado,
        grupoController.eliminarGrupo
    )

    //Nuevo Meeti
    router.get('/nuevo-meeti',
        authController.usuarioAutenticado,
        meetiController.formNuevoMeeti
    )

    router.post('/nuevo-meeti',
        authController.usuarioAutenticado,
        meetiController.sanitizarMeeti,
        meetiController.crearMeeti
    )

    //Editar Meeti
    router.get('/editar-meeti/:id',
        authController.usuarioAutenticado,
        meetiController.formEditarMeeti
    )

    router.post('/editar-meeti/:id', 
        authController.usuarioAutenticado,
        meetiController.editarMeeti
    )

    //Eliminar meeti
    router.get('/eliminar-meeti/:id',
        authController.usuarioAutenticado,
        meetiController.formEliminarMeeti
    );
    router.post('/eliminar-meeti/:id',
        authController.usuarioAutenticado,
        meetiController.eliminarMeeti
    );

    // Editar información de perfil
    router.get('/editar-perfil',
    authController.usuarioAutenticado,
    usuarioController.formEditarPerfil
    );
    router.post('/editar-perfil',
    authController.usuarioAutenticado,
    usuarioController.editarPerfil
    );

    // modifica el password
    router.get('/cambiar-password',
        authController.usuarioAutenticado,
        usuarioController.formCambiarPassword
    );
    router.post('/cambiar-password',
        authController.usuarioAutenticado,
        usuarioController.cambiarPassword
    );

    // Imagenes de perfil
    router.get('/imagen-perfil', 
        authController.usuarioAutenticado,
        usuarioController.formSubirImagenPerfil
    );
    router.post('/imagen-perfil', 
        authController.usuarioAutenticado,
        usuarioController.subirImagen,
        usuarioController.guardarImagenPerfil
    );
    
   
    return router
}