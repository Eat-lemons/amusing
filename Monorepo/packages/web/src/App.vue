<template>
  <div>
    <MainCont>
      <!-- 顶部 -->
      <NavHeader :group-name="'嘎嘎漂亮'" :person-number="userList.size" @more="handleOpenDrawer" :user-list="userList"
        :cur-user-id="curUser.id"></NavHeader>
      <!-- 消息部分 -->
      <div class="px-4">
        <ChatItem :chat-data="chatData" @handleOpenDrawer="handleOpenDrawer" />
      </div>
      <InputBox v-model="message" @send="handleSend"></InputBox>
    </MainCont>
    <JoinModal @join="handleJoin"></JoinModal>
    <YwzDrawer v-model="drawerShow">
      <div class="p-4 w-[920px]">
        <div class="px-4">
          <h4 class="text-center mb-2 text-xl">
            {{ userList.get(chatUserId)?.name }}
          </h4>
          <ChatItem style="height: calc(100vh - 134px)" :chat-data="userChatData.get(chatUserId) ?? []" />
        </div>
        <InputBox v-model="userMessage" @send="handleSendUser" />
      </div>
    </YwzDrawer>
    <!-- <Hellow></Hellow> -->
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import MainCont from './components/MainCont.vue'
import NavHeader from './components/NavHeader.vue'
import ChatItem, { ChatDataItem } from './components/ChatItem.vue';
import InputBox from './components/InputBox.vue';
import JoinModal, { JoinEvent } from './components/JoinModal.vue'
import YwzDrawer from './components/YwzDrawer.vue';
// 引入socket.io-client
import { io } from 'socket.io-client';
// import Hellow from './components/Hellow.vue';
// 创建io实例
const socket = io('ws://localhost:5432');
// 聊天数据
const chatData = ref<ChatDataItem[]>([])
// 当前用户
const curUser = reactive({ name: '', avatar: '', id: '' })
// 用户数量
const userList = ref(new Map())
const message = ref('')
// 要发送的消息
const handleSend = (v: string) => {
  // 放到群聊的数组中
  const obj = {
    id: Math.random().toString().split('.')[1].slice(0.10),
    name: curUser.name,
    avatar: curUser.avatar,
    content: v,
    userId: curUser.id
  }
  const type: 'me' = 'me'
  chatData.value.push(Object.assign({}, { type }, obj))
  message.value = ''
  socket.emit('send', obj)
}
// 监听广播的消息
socket.on('message', (e: any) => {
  const msg = Object.assign({}, e, { type: 'your' }) as ChatDataItem
  chatData.value.push(msg)
})
// 要加入的用户
const handleJoin = (v: JoinEvent) => {
  console.log(v);
  socket.emit('join', Object.assign({}, v))
}
// 监听加入事件
socket.on('joined', (e: typeof curUser) => {
  curUser.avatar = e.avatar
  curUser.name = e.name
  curUser.id = e.id
})
// 监听成功加入发布广播
socket.on('welcome', ({ name, uList }) => {
  uList.forEach((item: any[]) => {
    const [id, value] = item
    userList.value.set(id, value)
  })
  chatData.value.push({
    type: 'tips',
    id: Math.random().toString().split('.')[1].slice(0, 10),
    content: `欢迎${name}加入群聊~`
  })
})
// 监听quit退出发布消息
socket.on('quit', (id: string) => {
  const user = userList.value.get(id)
  userList.value.delete(id)
  chatData.value.push({
    type: 'tips',
    id: Math.random().toString().split('.')[1].slice(0, 10),
    content: `${user.name}退出群聊`
  })
})

// 控制抽屉显示与隐藏
const drawerShow = ref(false)
// 与所有用户私聊的内容存储单元
const userChatData = ref(<Map<string, ChatDataItem[]>>(new Map))
// 正在私聊的用户id
const chatUserId = ref('')
// 私聊聊天框的内容
const userMessage = ref('')
// 点击头像 打开抽屉
const handleOpenDrawer = (user: typeof curUser) => {
  chatUserId.value = user.id
  console.log(user.id, '========>');

  // 清空头像右上角的绿色原点
  const u = userList.value.get(chatUserId.value)
  // 判断当前id的消息是否存在  显示小绿点
  if (u) {
    u.new = false
  }
  drawerShow.value = true;
}
// 私发消息
const handleSendUser = (v: string) => {
  // 需要整一个新的数组存放私发消息
  const obj = {
    id: Math.random().toString().split('.')[1].slice(0, 10),
    name: curUser.name,
    avatar: curUser.avatar,
    content: v,
    userId: curUser.id,
    sendUserId: chatUserId.value,
  }
  // 在userChatData中新增一条数据，表示是自己发送的
  const type: 'me' = 'me'
  // 判断是否与该用户聊过天，如果没有创建一个空的聊天记录
  if (!userChatData.value.has(chatUserId.value)) {
    userChatData.value.set(chatUserId.value, [])
  }
  // 获取聊天记录，准备添加
  const _chatData = userChatData.value.get(chatUserId.value) ?? []
  _chatData.push(Object.assign({}, { type }, obj))
  // 清空输入框
  userMessage.value = ''
  // 发出sand事件，把消息发送出去
  socket.emit('send-user', obj)
}
// 监听接受消息
socket.on('message-user', (e: any) => {
  // 添加到私发的聊天记录中
  const msg = Object.assign({}, e, { type: 'your' }) as ChatDataItem
  // 拿到发送人的id
  const sendId = e.userId
  // 判断是否与该用户聊过天，如果没有创建一个空的聊天记录
  if (!userChatData.value.has(sendId)) {
    userChatData.value.set(sendId, [])
  }
  // 获取聊天记录，准备添加  查找到当前的id
  const _chatData = userChatData.value.get(sendId) ?? []
  // 添加进去
  _chatData.push(msg)
  // 头像的小绿点
  const u = userList.value.get(sendId)
  // 判断是否抽屉没打开，判断消息是否存在
  if (u && drawerShow.value !== true) {
    u.new = true
  }
})
</script>

<style scoped></style>