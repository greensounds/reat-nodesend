const Enlaces = require("../models/Enlace")
const shortid = require("shortid")
const bcrypt = require("bcrypt")
const { validationResult } = require('express-validator')

exports.nuevoEnlace = async (req, res, next) => {
    //revisar si hay errores
    const errores = validationResult(req);
    if(!errores.isEmpty()) {
        return res.status(400).json({errores: errores.array()})
    }

    //Crear un objeto
    const { nombre_original, nombre } = req.body;
    const enlace = new Enlaces();
    enlace.url = shortid.generate();
    enlace.nombre = nombre;
    enlace.nombre_original = nombre_original;

    //si el user esta autenticado
    if(req.usuario) {
        const { password, descargas } = req.body;
        
        //Asignar a enlace el numero de descargas
        if(descargas) {
            enlace.descargas = descargas
        }

        //asignar un password
        if(password) {
            const salt = await bcrypt.genSalt(10)
            enlace.password = await bcrypt.hash( password, salt);
        }

        //asignar el autor
        enlace.autor = req.usuario.id;
    }

    try {
        //almacenar en la db
        await enlace.save()
        return res.json({msg: `${enlace.url}`})
        next();
    } catch(err) {
        console.log(err);
    }
}

//obtiene un listado de todos los enlaces
exports.todosEnlaces = async (req, res) => {
    try {
        const enlaces = await Enlaces.find({}).select('url -_id');
        res.json({enlaces})
    } catch (err) {
        console.log(err)
    }
}

//retorna si el enlace tiene password
exports.tienePassword = async (req, res, next) => {
    //verficar si existe en enlace
    const enlace = await Enlaces.findOne({url: req.params.url })

    if(!enlace) {
        res.status(404).json({msg: "Ese en lace no existe"})
        return next();
    }

    if(enlace.password) {
        return res.json({
            password: true, 
            enlace: enlace.url
        })
    }

    next();
}

//verfica si el password es correcto
exports.verficarPassword = async(req, res, next) => {
    const { url } = req.params;
    const { password } = req.body;
    //consultar por el enlace
    const enlace = await Enlaces.findOne({ url });

    //verificar el password
    if(bcrypt.compareSync(password, enlace.password)) {
        next();
    } else {
        return res.status(401).json({msg: 'Password incorrecto'})
    }
}

//Obtener Enlace
exports.obtenerEnlace = async (req, res, next) => {
    //verficar si existe en enlace
    const enlace = await Enlaces.findOne({url: req.params.url })

    if(!enlace) {
        res.status(404).json({msg: "Ese en lace no existe"})
        return next();
    }
    

    //si el enlace existe
    res.json({ archivo: enlace.nombre, password: false })

    next();
}