const Categorias = require('../models/Categorias')
const Grupos = require('../models/Grupos');

const multer = require('multer');
const shortid = require('shortid');
const fs = require('fs')
const uuid = require('uuid').v4;

const configuracionMulter = {
    limits: { fileSize: 100000 },
    storage: fileStorage = multer.diskStorage({
        destination : (req, file, cb) => {
            cb(null, __dirname+'../../public/uploads/grupos');
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

exports.formNuevoGrupo = async(req, res) => {
    const categorias = await Categorias.findAll();
    res.render('nuevo-grupo', {
        nombrePagina : 'Crea tu nuevo grupo',
        categorias
    })
}

//Almacena los grupos en la base ded datos
exports.crearGrupos = async(req, res) => {
    //Sanitizar
    req.sanitize('nombre');
    req.sanitize('url');

    const grupo = req.body

    //Almacena el usuario autenticado como el creador del grupo
    grupo.usuarioId = req.user.id
    grupo.categoriaId = req.body.categoria

    //Leer la imagen
    if(req.file) {
        grupo.imagen = req.file.filename;
    }
    
    grupo.id = uuid();

    try {
        await Grupos.create(grupo);
        req.flash('exito', 'Se ha creado el grupo Correctamente');
        res.redirect('/administracion')
        
    } catch (error) {
        //Extaer el message de los errores
        const erroresSequelize = error.errors.map(err => err.message);
        req.flash('error', erroresSequelize);
        res.redirect('/nuevo-grupo');
    }

}

exports.formEditarGrupo = async(req, res) => {

    const consultas = [];
    consultas.push( Grupos.findByPk(req.params.grupoId))
    consultas.push( Categorias.findAll())

    //Promise con await
    const [grupo, categorias] = await Promise.all(consultas);

    res.render('editar-grupo', {
        nombrePagina : `Editar Grupo : ${grupo.nombre}`,
        grupo,
        categorias
    })
}

//Guarda los cambios de BD
exports.editarGrupo = async(req, res) => {
    const grupo = await Grupos.findOne({ where: { id : req.params.grupoId, usuarioId : req.user.id }})

    //Si no existe el grupo  o el dueño
    if(!grupo) {
        req.flash('error', 'Operacion no Valida');
        res.redirect('/administracion');
        return next();
    }

    //Todo bien, leer los valores
    const { nombre, descripcion, categoriaId, url} = req.body

    //Asignar los valores
    grupo.nombre = nombre;
    grupo.descripcion = descripcion;
    grupo.categoriaId = categoriaId;
    grupo.url = url

    //Guardamos en la base de datos
    await grupo.save();
    req.flash('exito', 'Cambios Almacenados Correctamente');
    res.redirect('/administracion');
}

//Muestra el formulario para editar una imagen de grupo
exports.formEditarImagen = async(req, res) => {
    const grupo = await Grupos.findOne({ where: { id : req.params.grupoId, usuarioId : req.user.id }})

    res.render('imagen-grupo', {
        nombrePagina : `Editar Imagen Grupo : ${grupo.nombre}`,
        grupo
    })
}

//Modifica la imagen en la BD y elimina la anterior
exports.editarImagen = async(req, res, next) => {
    const grupo = await Grupos.findOne({ where: { id : req.params.grupoId, usuarioId : req.user.id }})

    //El grupo existe y es valido
    if(!grupo) {
        req.flash('error', 'Operacion no Valida');
        res.redirect('/iniciar-sesion');
        return next();
    }

    //Verificar que el archivo sea nuevo
    // if(req.file) {
    //     console.log(req.file.filename);
    // }

    // //Revisar que exista un archivo anterior
    // if(grupo.imagen) {
    //     console.log(grupo.imagen);
    // }

    //Si hay imagen anterior y nueva, significa que vamos a borrar la anterior
    if(req.file && grupo.imagen) {
        const imagenAnteriorPath = __dirname + `/../public/uploads/grupos/${grupo.imagen}`;

        //eliminar archivo con filesystem
        fs.unlink(imagenAnteriorPath, (error) => {
            if(error) {
                console.log(error)
            }
            return;
        })
    }

    //Si hay una imagen nueva, guardamos
    if(req.file) {
        grupo.imagen = req.file.filename;
    }

    //Guardar en la DB
    await grupo.save();
    req.flash('exito', 'Cambios Almacenados Correctamente');
    res.redirect('/administracion');
}

//Muestra el formulario para eliminar un grupo
exports.formEliminarGrupo = async(req, res, next) => {
    const grupo = await Grupos.findOne({ where : { id : req.params.grupoId, usuarioId : req.user.id}});

    if(!grupo) {
        req.flash('error', 'Operacion no Valida');
        res.redirect('/administracion');
        return next();
    }

    //Todo bien ejecutar la vista
    res.render('eliminar-grupo', {
        nombrePagina : `Eliminar Grupo : ${grupo.nombre}`
    })
}

// //Eliminar el grupo e imagen
// exports.eliminarGrupo = async(req, res, next) => {
//     const grupo = await Grupos.findOne({ where : { id : req.params.grupoId, usuarioId : req.user.id }});

//     if(!grupo) {
//         res.flash('error', 'Operacion no valida');
//         res.redirect('/administracion');
//         return next();
//     }

//     //Si hay una imagen eliminarla
//     if(grupo.imagen) {
//         const imagenAnteriorPath = __dirname + `/public/uploads/grupos/${grupo.imagen}`;

//         //Eliminar archivo con fileSystem
//         fs.unlink(imagenAnteriorPath, (error) => {
//             if(error) {
//                 console.log(error)
//             }
//             return;
//         });
//     }

//     //Eliminar grupos
//     await Grupos.destroy({
//         where: {
//             id : req.params.grupoId
//         }
//     });

//     //Redireccionar al usuario
//     req.flash('exito', 'Grupo Eliminado');
//     res.redirect('/administracion');
// }

/** Elimina el grupo e imagen */
exports.eliminarGrupo = async (req, res, next) => {
    const grupo = await Grupos.findOne({ where : { id : req.params.grupoId, usuarioId : req.user.id }});


    // Si hay una imagen, eliminarla
    if(grupo.imagen) {
        const imagenAnteriorPath = __dirname + `/../public/uploads/grupos/${grupo.imagen}`;

        // eliminar archivo con filesystem
        fs.unlink(imagenAnteriorPath, (error) => {
            if(error) {
                console.log(error);
            }
            return;
        });
    }

    // Eliminar el grupo
    await Grupos.destroy({
        where: {
            id: req.params.grupoId
        }
    });

    // Redireccionar al usuario
    req.flash('exito', 'Grupo Eliminado');
    res.redirect('/administracion');

}