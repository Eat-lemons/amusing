export const socketServer = io => {
    let userList = new Map();
    io.on('connection', socket => {
        // 监听用户加入
        socket.on('join', e => {
            userList.set(socket.id, e)
            // 加入成功后返回加入成功事件
            socket.emit('joined', Object.assign({}, e, { id: socket.id }))
            const uList = [...userList.entries()]
            // 触发广播
            socket.broadcast.emit('welcome', {
                ...e,
                uList
            })
            // 自己展示加入的信息
            socket.emit('welcome', {
                ...e,
                uList
            })
        })
        // 私聊
        socket.on('send-user', e => {
            const sendUserId = e.sendUserId
            socket.to(sendUserId).emit('message-user', e)
        })

        // 监听发送消息 触发message,让前端监听发布添加
        socket.on('send', e => {
            socket.broadcast.emit('message', e)
        })
        // 离开群聊，触发quit,前端监听发布离开
        socket.on('disconnecting', () => {
            const bool = userList.delete(socket.id)
            bool && socket.broadcast.emit('quit', socket.id)
        })
    })
}