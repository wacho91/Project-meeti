const passport = require('passport')

exports.autenticarUsuario = passport.authenticate('local', {
    successRedirect : '/administracion',
    failureRedirect : '/iniciar-sesion',
    failureFlash : true,
    badRequestMessage : 'Ambos campos son obligatorios'
})


//Revisa si el usuario esta autenticado o no
exports.usuarioAutenticado = (req, res, next) => {
    //Si el usuario esta autenticad, adelante
    if(req.isAuthenticated()) {
        return next()
    }

    //Si no esta autenticado
    return res.redirect('/iniciar-sesion');
}

//Cerrar sesion
exports.cerrarSesion = (req, res, next) => {
    req.logout();
    req.flash('correcto', 'Cerraste sesion correctamente');
    res.redirect('/iniciar-sesion');
    next();
}