import { Server } from 'socket.io'
import { socketServer } from './model/socket.js'
// 设置跨域 后台端口为5432
const io = new Server(5432, { cors: true })
socketServer(io)