import { createApp } from "vue";
import "./style.css";
import Popup from "./components/popup.vue";
import { Button, Tabs, Input } from "ant-design-vue";
import "ant-design-vue/dist/antd.css";

const app = createApp(Popup);

app.use(Button);
app.use(Tabs);
app.use(Input);
app.mount("#app");
