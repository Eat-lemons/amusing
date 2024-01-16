const express = require('express');
const multiparty = require('multiparty');
const fs = require('fs');
const path = require('path');
const { Buffer } = require('buffer');
const fse = require("fs-extra");
const bodyParser = require('body-parser');
const cors = require('cors');
const { error } = require('console');

const UPLOAD_DIR = path.join(__dirname, './uploads')

// 提取后缀
const extractExt = (fileName) => {
    return fileName.slice(fileName.lastIndexOf('.'), fileName.length)
}

const app = express();


app.use(bodyParser.json())
app.use(cors());

app.post('/upload', function (req, res) {
    const form = new multiparty.Form()

    form.parse(req, async function (error, fields, files) {
        if (error) {
            res.status(401).json({
                ok: false,
                msg: '上传失败，请重新上传'
            })

            return
        }
        // console.log(fields);//哈希值
        // console.log(files);//切片信息
        const chunkHash = fields.chunkHash[0];
        const fileHash = fields.fileHash[0];
        // 创建临时切片的目录
        const chunkPath = path.resolve(UPLOAD_DIR, fileHash)
        // 判断有没有这个文件夹没得话创建
        if (!fse.existsSync(chunkPath)) {
            await fse.mkdir(chunkPath)
        }

        const oldPath = files.chunk[0].path
        // 将切片放到这个文件夹里
        await fse.move(oldPath, path.resolve(chunkPath, chunkHash))

        res.status(200).json({
            ok: true,
            msg: '上传成功'
        })
    })

})

// 创建文件 文件 考虑同步操作 async/await  Promise
app.post('/merge', async (req, res) => {
    const { fileHash, fileName, size } = req.body
    // console.log(fileHash);
    // console.log(fileName);
    // console.log(size);

    // 如果已存在改文件，就没必要合并了
    // 完整的文件路径 
    const filePath = path.resolve(UPLOAD_DIR, fileHash + extractExt(fileName))
    if (fse.existsSync(filePath)) {
        res.status(200).json({
            ok: true,
            msg: '合并成功'
        })
        return;
    }

    // 如果不存在改文件，才去合并
    const chunkDir = path.resolve(UPLOAD_DIR, fileHash)
    if (!fse.existsSync(chunkDir)) {
        res.status(200).json({
            ok: false,
            msg: '合并失败，请从新上传'
        })
        return;
    }

    // 合并操作 读取所有切片
    const chunkPaths = await fse.readdir(chunkDir)
    // 分片顺序是乱的 先排序
    chunkPaths.sort((a, b) => {
        return a.split('-')[1] - a.split('-')[1];
    })
    // console.log(chunkPaths);
    // 开始
    const list = chunkPaths.map((item, index) => {
        return new Promise(resolve => {
            // 切片的地址
            const chunkPath = path.resolve(chunkDir, item)
            // 读取流
            const readStream = fse.createReadStream(chunkPath)
            // 写的流
            const writeStream = fse.createWriteStream(filePath, {
                start: index * size,
                end: (index + 1) * size
            })

            readStream.on('end', async () => {
                await fse.unlink(chunkPath)
                resolve()
            })
            // 删除、
            readStream.pipe(writeStream)
        })
    })
    // 必须全部成功才能合并  all：有一个失败就不运行此步骤
    await Promise.all(list)
    // 清除临时存放hash分片的文件夹
    await fse.remove(chunkDir)

    res.status(200).json({
        ok: true,
        msg: '合并成功'
    })
})
// 秒传就是判断之前有没有这个文件
// 有就返回秒传 // 没有继续传
// 断点续传 
app.post('/verify', async (req, res) => {
    const { fileHash, fileName } = req.body
    // console.log(fileHash);
    // console.log(fileName);
    const filePath = path.resolve(UPLOAD_DIR, fileHash + extractExt(fileName))
    // 返回服务器上上传成功的切片
    const chunkDir = path.join(UPLOAD_DIR, fileHash)
    let chunkPaths = []
    // 判断文件是否存在 读取所有切片
    if (fse.existsSync(chunkDir)) {
        chunkPaths = await fse.readdir(chunkDir)
    }
    console.log(chunkPaths);

    if (fse.existsSync(filePath)) {
        // 如果存在不用上传
        res.status(200).json({
            ok: true,
            data: {
                shouldUpload: false
            }
        })

        return
    }
    // 如果不存在  上传
    res.status(200).json({
        ok: true,
        data: {
            shouldUpload: true,
            existChunks: chunkPaths
        }
    })
})

app.listen(3000, _ => {
    console.log('http://localhost:3000/');
})