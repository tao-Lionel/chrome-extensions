import { createApp } from "vue";
import "./style.css";
import Popup from "./components/popup.vue";
import { Button, Tabs } from "ant-design-vue";
import "ant-design-vue/lib/button/style";

const app = createApp(Popup);

app.use(Button);
app.use(Tabs);
app.mount("#app");
