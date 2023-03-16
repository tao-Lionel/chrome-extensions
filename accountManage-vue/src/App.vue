<script setup lang="ts">
const phoneStr = import.meta.env.VITE_PHONE;
const phoneArr = phoneStr.split(",");
console.log(phoneArr);

const clickAccount = async (phone: number) => {
  console.log(phone);
  const tab = await getCurrentTab();
  console.log(tab);
  await chrome?.tabs.sendMessage(tab.id, { phone });
};

// 获取当前tab标签
const getCurrentTab = async () => {
  let queryOptions = { active: true, currentWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
};
</script>

<template>
  <div class="flex-col content">
    <button v-for="(item, index) in phoneArr" :key="index" class="btn mb-10 button1" @click="clickAccount(item)">{{ item }}</button>
  </div>
</template>

<style scoped></style>
