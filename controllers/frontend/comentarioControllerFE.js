const Comentarios = require('../../models/Comentarios');
const Meeti = require('../../models/Meeti');

exports.agregarComentario = async(req, res, next) => {
    //Obtener elcomentario
    const { comentario }= req.body;

    //Crear el comentario en la base de daros
    await Comentarios.create({
        mensaje : comentario,
        usuarioId : req.user.id,
        meetiId : req.params.id
    });

    //Redireccionar a la misma pagina 
    res.redirect('back');
    next();
}

//Elimina un comentario de la BD
exports.eliminarComentario = async(req, res, next) => {

    //Tomar el Id del comentario
    const { comentarioId } = req.body;

    //Consultar el comentario
    const comentario = await Comentarios.findOne({ where : { id : comentarioId }});

    

    //Verificar si exsite el comentario
    if(!comentario) {
        res.status(404).send('Accion no valida')
        return next();
    }

    //Consultar el Meeti del comentario
    const meeti = await Meeti.findOne({ where : { id : comentario.meetiId }})
    
    //Verificar que quien lo borra sea el creador
    if(comentario.usuarioId === req.user.id || meeti.usuarioId === req.user.id){
        await Comentarios.destroy({ where : {
            id : comentario.id
        }})
        res.status(200).send('Eliminado Correctamente');
        return next()
    } else {
        res.status(403).send('Accion no valida');
        return next()
    }
}