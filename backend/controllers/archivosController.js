const multer = require("multer")
const shortid = require("shortid")
const fs = require("fs")
const Enlaces = require("../models/Enlace")

exports.subirArchivo = async (req, res, next) => {
    const configuracionMulter = {
        limits: { fileSize: req.usuario ? 1024 * 1024 * 10 : 1024 * 1024 },
        storage: fileStorage = multer.diskStorage({
            destination: (req, file, cb) => {
                cb(null, __dirname + '/../uploads')
            },
            filename: (req, file, cb) => {
                const extension = file.originalname.substring(file.originalname.lastIndexOf('.'), file.originalname.length);
                cb(null, `${shortid.generate()}${extension}`)
            }
        })
    }
    
    //Subida de archivos
    const upload = multer(configuracionMulter).single("archivo")

    upload(req, res, async(error) => {
        console.log(req.file)

        if(!error) {
            res.json({ archivo: req.file.filename })
        } else {
            console.log(error)
            return next();
        }
    })
}

exports.eliminarArchivo = async (req, res) => {
    console.log(req.archivo)

    try {
        fs.unlinkSync(__dirname + `/../uploads/${req.archivo}`)
        console.log('Archivo eliminado')
    } catch(err) {
        console.log(err)
    }
}

//descarga archivos
exports.descargar = async (req, res, next) => {
    //obtiene el enlace
    const { archivo } = req.params
    const enlace = await Enlaces.findOne({ nombre: archivo })

    const archivoDescarga = __dirname + '/../uploads/' + archivo;
    res.download(archivoDescarga)

    //eliminar el archivo y la entrada
    //si las descargaw es igual a 1 Borrar la entra y borrar el archivo
    const {descargas, nombre} =  enlace;
    if(descargas === 1) {
        //eliminar archivo 
        req.archivo = nombre;

        //eliminar la entrada de la db

        await Enlaces.findOneAndRemove(enlace.id)
        next()
    } else {
        //si las descargas son mayores a 1 hay que restar
        enlace.descargas--;
        await enlace.save();
    }
}