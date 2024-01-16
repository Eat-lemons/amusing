<template>
  <div>
    <h2>大文件上传</h2>
    <input type="file" @change="handleUpload">
  </div>
</template>

<script setup>
import SparkMD5 from "spark-md5"
import { ref } from 'vue'

// 存储上传hash值
const fileHash = ref('')
// 存储上传的文件名
const fileName = ref('')
// 分片大小
const chunk_size = 1024 * 1024;
// 分片
const createChunks = (file) => {
  // 初始位置
  let cur = 0;
  // 存放分割完成的分片的数组
  let chunks = []
  // 循环
  while (cur < file.size) {
    // file是个二进制一个数据有这个slice方法 通过计算去截取
    // 每个分片的大小
    const blob = file.slice(cur, cur + chunk_size)
    // 添加到分割完成后的数组
    chunks.push(blob)
    // 下回从之前切割的位置作为起始位
    cur += chunk_size
  }
  return chunks
}

// hash计算函数
const calculateHash = (chunks) => {
  // 因为下面的onload是异步的，在读取完才执行 
  // 我们需要把它转成同步的
  return new Promise(resolve => {
    // 1.第一个跟最后一个切片参与计算
    // 2.中间的切片只计算前面两个字节中间两个后面两个
    const targets = []//存储参与计算的切片啊
    // npm官网  使用ArrayBuffer()这个方法
    const spark = new SparkMD5.ArrayBuffer()
    // npm官网  FileReader()这个方法
    const fileReader = new FileReader()

    chunks.forEach((chunk, index) => {
      // 第一个跟最后一个切片参与计算
      if (index == 0 || index == chunk.length) {
        targets.push(chunk)
      } else {
        // 中间的切片只计算 前面两个字节 中间两个 后面两个
        // 前面两个字节
        targets.push(chunk.slice(0, 2))
        // 中间两个  chunk_size/2 找到中间的
        targets.push(chunk.slice(chunk_size / 2, chunk_size / 2 + 2))
        // 后面两个 
        targets.push(chunk.slice(chunk_size - 2, chunk_size))
      }
    });
    // 通过方法再把这个数据转换成Blob对象
    fileReader.readAsArrayBuffer(new Blob(targets))
    // 读取、
    fileReader.onload = (e) => {
      spark.append(e.target.result)
      // 拿到计算后的hsah值
      console.log('hash:' + spark.end());
      resolve(spark.end())
    }
  })
}
// 开始合并
const megerRequest = () => {
  fetch('http://localhost:3000/merge', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      size: chunk_size,
      fileHash: fileHash.value,
      fileName: fileName.value,
    })
  }).then(() => {
    alert('合并成功')
  })
}

// 开始上传分片
const uploadChunks = async (chunks, existChunks) => {
  //遍历
  const data = chunks.map((chunk, index) => {
    return {
      fileHash: fileHash.value,//hash值
      chunkHash: fileHash.value + '-' + index,//第几个切片
      chunk,//切片
    }
  })
  // 遍历创建fromData对象 每个切片构造的fromData对象
  // 过滤一下之前传的切片 断点续传
  const fromDatas = data.filter(item => !existChunks.includes(item.chunkHash)
  ).map((item) => {
    const fromData = new FormData()
    fromData.append('fileHash', item.fileHash)
    fromData.append('chunkHash', item.chunkHash)
    fromData.append('chunk', item.chunk)

    return fromData
  })

  console.log(fromDatas);

  const max = 6;//最大的并发请求数 浏览器限制请求的最大数
  let index = 0;//初始下标 所有的formData都要上传 第几个fromData
  const taskPool = [];//请求池
  while (index < fromDatas.length) {
    const task = fetch('http://localhost:3000/upload', {
      method: 'POST',
      body: fromDatas[index]
    })
    // 发送成功后要移出请求池
    taskPool.splice(taskPool.findIndex(item => item === task), 1)
    // 请求后放到请求池中
    taskPool.push(task)
    // 不得超过最大请求次数
    if (taskPool.length === max) {
      await Promise.race(taskPool)
    }
    index++
  }

  await Promise.all(taskPool)

  // 通知服务器合并分片
  megerRequest()

}
// 秒传 + 断点续传
const verify = async () => {
  return fetch('http://localhost:3000/verify', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      fileHash: fileHash.value,
      fileName: fileName.value,
    })
  }).then(res => res.json()).then(res => {
    return res
  })
}


// 上传文件、
const handleUpload = async (e) => {
  console.log(e.target.files);
  const files = e.target.files
  if (!files) return
  console.log(files[0]);
  fileName.value = files[0].name

  // 文件分片
  const chunks = createChunks(files[0])
  console.log(chunks);

  // hash计算
  const hsah = await calculateHash(chunks)
  // console.log(hsah);
  fileHash.value = hsah

  // 校验hash值 
  const data = await verify()
  console.log(data.data);
  if (!data.data.shouldUpload) {
    alert('秒传上传成功')
    return;
  }
  // 开始上传分片  携带暂存的文件夹目录分片文件
  uploadChunks(chunks, data.data.existChunks)

}


</script>

<style scoped></style>