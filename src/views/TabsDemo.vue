<template>
  <my-tabs v-model="currnetTab">
    <my-tab title="tab1" name="id1">
     111
    </my-tab>
    <my-tab title="tab2" name="id2">
      222
    </my-tab>
    <my-tab title="tab3" name="id3">
      333
    </my-tab>
     <my-tab title="tab4" name="id4">
      444
    </my-tab>
     <my-tab title="tab5" name="id5">
      555
    </my-tab>
  </my-tabs>
</template>

<script>
import { reactive, toRefs } from "vue";
import MyTabs from "@/components/Tabs.vue"
import MyTab from "@/components/Tab.vue"
import ListDemo from "./ListDemo.vue"
export default {
  components: { MyTabs, MyTab,ListDemo },
  setup() {

    const data = reactive({
      currnetTab: "id1",
    });

    const methods = {

    };


    return {
      ...toRefs(data),
      ...methods,
    };
  },
};
</script>

<style lang="scss" scoped>
#test {
  >.tabs-wrap {
    >.tabs-nav-wrap {
      display: flex;
      align-items: center;
      height: 1rem;

      >.tabs-nav-item {
        font-size: 0.32rem;
        line-height: 0.32rem;
        align-items: flex-start;
        height: 0.6rem;
        line-height: 0.6rem;
        max-width: 2rem;
        flex: initial;
        display: inline-block;
        white-space: nowrap;
        padding: 0 0.3rem;
        margin: 0 0.1rem;
        border-radius: .24rem;

        &.active {
          color: var(--highlight-color);
          background-color: var(--highlight-color-bg);
        }
      }
    }

    >.tabs-content-wrap {
      overflow: hidden;

      >.tabs-panel-bar {
        height: 10rem;
        display: flex;
        width: initial;
        // overflow: hidden;
        // width: 300vw;

        >.tabs-panel {
          flex-shrink: 0;
          display: inline-block;
          width: 100vw;
          height: 100%;
          background-color: #eee;
          overflow: hidden;

          >div {
            line-height: 10rem;
          }
        }

      }
    }
  }
}
</style>
