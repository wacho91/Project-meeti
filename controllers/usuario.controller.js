const Usuarios = require('../models/Usuarios');
const { check, validationResult } = require('express-validator');
const enviarEmail = require('../handlers/emails');
const { DataRowMessage } = require('pg-protocol/dist/messages');

const multer = require('multer');
const shortid = require('shortid');
const fs = require('fs')

const configuracionMulter = {
    limits: { fileSize: 100000 },
    storage: fileStorage = multer.diskStorage({
        destination : (req, file, cb) => {
            cb(null, __dirname+'../../public/uploads/perfiles');
        },
        filename : (req, file, cb) => {
            const extension = file.mimetype.split('/')[1];
            cb(null, `${shortid.generate()}.${extension}`);
        }
    }),
    fileFilter(req, file, cb) {
        if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png'){
            //el callback se ejecuta como true o false : true cuando la imagen se acepta
            cb(null, true);
        } else {
            cb(new Error('Formato no valido'), false);
        }
    },
    
}

const upload = multer(configuracionMulter).single('imagen');

//Sube imagen en el servidor
exports.subirImagen = (req, res, next) => {
    upload(req, res, function(error) {
        if(error) {
            if(error instanceof multer.MulterError) {
                if(error.code === 'LIMIT_FILE_SIZE'){
                    req.flash('error', 'El archivo es muy grande: Maximo 100kb');
                } else {
                    req.flash('error', error.message);
                }
            }else{
                req.flash('error', error.message);
            }
            res.redirect('back');
            return;
        } else {
            return next();
        }
        
    });
}

exports.formCrearCuenta = (req, res) => {
    res.render('crear-cuenta', {
        nombrePagina : 'Crear tu Cuenta'
    })
}

exports.crearNuevaCuenta = async(req, res) => {
    const usuario = req.body

    const rules = [
        check('confirmar').not().isEmpty().withMessage('Confirmar el password es obligatorio').escape(),
        check('confirmar').equals(req.body.password).withMessage('Los passwords no son iguales')
    ]

    await Promise.all(rules.map(validation => validation.run(req)));

    //Leer los errores
    const erroresExpress = validationResult(req);

    

    try {
        await Usuarios.create(usuario)

        //Url de confirmacion
        const url = `http://${req.headers.host}/confirmar-cuenta/${usuario.email}`;


        //Enviar email de configuracion
        await enviarEmail.enviarEmail({
            usuario,
            url,
            subject: 'Confirma tu cuenta de meeti',
            archivo : 'confirmar-cuenta'
        })

        //flash Message y redireccionar
        req.flash('exito', 'Hemos enviado un email, confirma tu cuenta')
        res.redirect('/iniciar-sesion')
            
    } catch (error) {
        //Extaer el message de los errores
        const erroresSequelize = error.errors.map(err => err.message);
        
        console.log(erroresSequelize)
        //Extraer unicamente el msg de los errores
        const errExp = erroresExpress.array().map(err=>err.msg);

        console.log(errExp);

        //unirlos
        const listaErrores = [...erroresSequelize, ...errExp];

        req.flash('error', listaErrores);
        res.redirect('/crear-cuenta');
    }
    
}

//Confirma las suscripcion del ususario
exports.confirmarCuenta = async(req, res, next) => {
    //Verificar que el usuario existe
    const usuario = await Usuarios.findOne({where : {email: req.params.correo}});

    //Si no existe, redireccionar
    if(!usuario) {
        req.flash('erro', 'No existe esa cuenta');
        res.redirect('/crear-cuenta');
        return next();
    }

    //Si existe, confirmar y redireccionar
    usuario.activo = 1;
    await usuario.save();

    req.flash('exito', 'La cuenta se ha confirmado, ya puedes iniciar sesión');
    res.redirect('/iniciar-sesion');
}

//Formulario para iniciar sesion
exports.formIniciarSesion = (req, res) => {
    res.render('iniciar-sesion', {
        nombrePagina : 'Iniciar Sesion'
    })
}

// Muestra el formulario para editar el perfil
exports.formEditarPerfil = async (req, res) => {
    const usuario = await Usuarios.findByPk(req.user.id);

    res.render('editar-perfil', {
        nombrePagina : 'Editar Perfil',
        usuario
    })
}

// almacena en la Base de datos los cambios al perfil
exports.editarPerfil = async (req, res) => {

    const usuario = await Usuarios.findByPk(req.user.id);

    req.sanitize('nombre');
    req.sanitize('email');
    // leer datos del form
    const { nombre, descripcion, email} = req.body;

    // asignar los valores
    usuario.nombre = nombre;
    usuario.descripcion = descripcion;
    usuario.email = email;

    // guardar en la BD
    await usuario.save();
    req.flash('exito', 'Cambios Guardados Correctamente');
    res.redirect('/administracion');

}

//Muestra el formulario para editar el password
exports.formCambiarPassword = (req, res) => {
    res.render('cambiar-password', {
        nombrePagina : 'Cambiar Password'
    })
}

//Revisa si el password anterior es correcto y lo modifica por uno nuevo
exports.cambiarPassword = async (req, res, next) => {
    const usuario = await Usuarios.findByPk(req.user.id);

    // verificar que el password anterior sea correcto
    if(!usuario.validarPassword(req.body.anterior)) {
        req.flash('error', 'El password actual es incorrecto');
        res.redirect('/administracion');
        return next();
    }

    // si  el password es correcto, hashear el nuevo
    const hash = usuario.hashPassword(req.body.nuevo);

    // asignar el password al usuario
    usuario.password = hash;

    // guardar en la base de datos
    await usuario.save();

    // redireccionar
    req.logout();
    req.flash('exito', 'Password Modificado Correctamente, vuelve a iniciar sesión');
    res.redirect('/iniciar-sesion');
}

//Muestra el formulario para subir una imagen de perfil
exports.formSubirImagenPerfil = async(req, res) => {
    const usuario = await Usuarios.findByPk(req.user.id);

    //Mostrar la vista
    res.render('imagen-perfil', {
        nombrePagina : 'Subir Imagen Perfil',
        usuario
    });
    
}

//Guarda la imagen nueva, elimina la anterior (si aplica) y guarda el registro en la BD
exports.guardarImagenPerfil = async(req, res) => {
    const usuario = await Usuarios.findByPk(req.user.id);

    // si hay imagen anterior, eliminarla
    if(req.file && usuario.imagen) {
        const imagenAnteriorPath = __dirname + `/../public/uploads/perfiles/${usuario.imagen}`;

        // eliminar archivo con filesystem
        fs.unlink(imagenAnteriorPath, (error) => {
            if(error) {
                console.log(error);
            }
            return;
        })
    }

    // almacenar la nueva imagen
    if(req.file) {
        usuario.imagen = req.file.filename;
    }

    // almacenar en la base de datos y redireccionar
    await usuario.save();
    req.flash('exito', 'Cambios Almacenados Correctamente');
    res.redirect('/administracion');
}