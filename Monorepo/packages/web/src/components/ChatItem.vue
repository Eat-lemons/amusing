<template>
    <div class="chat-area card w-full bg-base-300 shadow-xl px-8 pt-4 overflow-auto">
        <template v-for="item in props.chatData" :key="item.id">
            <div class="my-4" v-if="item.type === 'me' || item.type === 'your'">
                <div :class="[
                    'flex',
                    item.type === 'your' ? 'left' : 'right flex-row-reverse',
                ]">
                    <!-- 头像 -->
                    <div :class="['avatar', item.type === 'your' ? 'mr-2' : 'ml-2']" @click="open(item)">
                        <div class="w-12 h-12 rounded">
                            <img :src="item.avatar" />
                        </div>
                    </div>
                    <!-- 消息 -->
                    <div :class="['user', item.type === 'me' ? 'flex flex-col' : '']">
                        <span class="text-base-content/100" :class="item.type === 'me' ? 'self-end' : ''">{{ item.name
                        }}</span>
                        <div class="p-2 mt-2 rounded text-white max-w-192 text-base-content/100 text-wrap"
                            :class="item.type === 'your' ? 'bg-left' : 'bg-right'">
                            {{ item.content }}
                        </div>
                    </div>
                </div>
            </div>

            <div v-else class="my-4 mx-auto text-base-content/100">
                {{ item.content }}
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

export interface ChatDataItem {
    type: 'your' | 'me' | 'tips'
    id: string // 这条消息唯一的id
    name?: string // 用户名称
    content: string // 聊天内容 || 提示内容
    avatar?: string // 头像
    userId?: string // 用户的id

}
interface Props {
    chatData: ChatDataItem[]
}
interface UserId {
    id?: string
    name?: string
    new?: boolean
}
const props = defineProps<Props>()
console.log(props.chatData);
const emit = defineEmits(['handleOpenDrawer']);
const userId = ref<UserId>({});
const open = (item: ChatDataItem) => {
    console.log(item);
    if (item && item.type !== 'me') {
        userId.value.id = item.userId;
        userId.value.name = item.name;
        userId.value.new = false;
        emit('handleOpenDrawer', userId.value)
    }
}
</script>

<style scoped>
.chat-area {
    --tw-bg-opacity: 0.7;
    height: calc(720px - 148px);
}

/* 隐藏滚动条 */
.chat-area::-webkit-scrollbar {
    display: none;
}

.bg-left {
    --tw-bg-opacity: 0.8;
    background-color: hsl(var(--af) / var(--tw-bg-opacity));
}

.max-w-192 {
    max-width: 48rem;
}

.bg-right {
    --tw-bg-opacity: 0.8;
    background-color: hsl(var(--p) / var(--tw-bg-opacity));
    min-height: 10px;
}
</style>