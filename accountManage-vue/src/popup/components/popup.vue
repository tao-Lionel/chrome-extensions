<script setup lang="ts">
import { computed, ref } from "vue";

const activeKey = ref("1");
const accountArr = ref([""]);

const getAccount = async () => {
  const { account } = await chrome.storage.local.get("account");
  console.log(account);
  accountArr.value = account.split(",");
};

getAccount();

const blurAccount = (index: number) => {
  if (accountArr.value.at(-1)) {
    accountArr.value.push("");
  }

  if (!accountArr.value.at(index) && index !== accountArr.value.length - 1) {
    accountArr.value.splice(index, 1);
  }

  chrome.storage.local.set({ account: accountArr.value.join(",") });
};

const pressEnter = (index: number) => {
  blurAccount(index);
};

const clickAccount = async (phone: string) => {
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
  <div class="content">
    <a-tabs v-model:activeKey="activeKey">
      <a-tab-pane key="1" tab="账号" class="flex-col">
        <template v-if="accountArr.length > 1">
          <a-button v-for="(item, index) in accountArr" :key="index" class="mb-10" @click="clickAccount(item)">{{ item }}</a-button>
        </template>
        <span v-else>请先添加账号</span>
      </a-tab-pane>
      <a-tab-pane key="2" tab="账号列表">
        <template v-for="(item, index) in accountArr" :key="index">
          <a-input v-model:value="accountArr[index]" placeholder="请输入手机号" style="margin-bottom: 3px" @blur="blurAccount(index)" @pressEnter="pressEnter(index)" />
        </template>
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<style scoped></style>
