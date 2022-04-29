<template>
  <div class="tabs-wrap" ref="tabsWrapRef">
    <div class="tabs-nav-wrap">
      <div class="tabs-nav-item" :class="{ active: currentTabId === tab.props.name }"
        @click="selectTab(tab.props.name, index)" v-for="(tab, index) in tabSlotList">{{ tab.props.title }}</div>
    </div>
    <div class="tabs-content-wrap">
      <div class="tabs-panel-bar"
        :style="{ transform: `translateX(${translateX}px)`, transition: `all ${transitionTime}s` }"
        @touchstart="touchstart" @touchmove="touchmove" @touchend="touchend">
        <div :id="`tabs-panel-${index}`" class="tabs-panel" v-for="(tab, index) in tabSlotList">
          <Loader v-if="currentTabId === tab.props.name || mountedTabMap.has(tab.props.name)" :vNode="tab" @mounted="mounted"/>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { reactive, toRefs, onMounted, ref } from "vue";
import Loader from "./Loader.vue";
import LRUCache from "@/plugins/dist/LRU.js"
export default {
  name: "my-tabs",
  components: { Loader },
  props: {
    modelValue: {
      type: String,
      default: ""
    }
  },
  setup(props, content) {
    let Width = window.innerWidth;
    onMounted(() => {
      Width = refs.tabsWrapRef.value.clientWidth
    })
    let defaultSlot = content.slots.default();
    let tabSlotList = defaultSlot.filter(item => item.type.name === 'my-tab');
    const pageNumber = tabSlotList.length;
    const data = reactive({
      tabSlotList,
      currentTabId: tabSlotList.length ? tabSlotList[0].props.name : "",
      translateX: 0,
      transitionTime: 0,
      mountedTabMap:new LRUCache(3) //可配置LRU
    });
    const refs = {
      tabsWrapRef: ref()
    }

    let start = {
      x: 0,
      y: 0
    }
    let end = 0;
    let isTouch = false;
    let scrollDirection = ""; //  "" 未知  "w" 横向  "h" 纵向
    const methods = {
      selectTab(val, index) {
        data.currentTabId = val;
        data.transitionTime = 0;
        data.translateX = index * (-Width);
        methods.chnagedPage(index);
      },
      touchstart(e) {
        isTouch = true;
        scrollDirection = "";
        data.transitionTime = 0;
        console.log("touchstart", e);
        start = {
          x: e.touches[0].pageX,
          y: e.touches[0].pageY
        };
      },
      touchmove(e) {
        end = {
          x: e.touches[0].pageX,
          y: e.touches[0].pageY
        };
        if (scrollDirection === "") {
          // 判断方向
          let x = Math.abs(end.x - start.x);
          let y = Math.abs(end.y - start.y);
          console.log("x,y", x, y);
          scrollDirection = x >= y ? "w" : "h";
        }
        if (scrollDirection === "w") {
          e.preventDefault();
          //移动滑块
          data.translateX += end.x - start.x;
          if (data.translateX > 0) {
            data.translateX = 0
          }
          if (data.translateX < -(pageNumber - 1) * Width) {
            data.translateX = -(pageNumber - 1) * Width
          }
          start = end;

        }
        if (scrollDirection === "h") {

        }
      },
      touchend(e) {
        isTouch = false;
        data.transitionTime = 0.5;
        if (scrollDirection === "w") {
          let index = Math.round(data.translateX / Width);
          data.translateX = index * Width;
          methods.chnagedPage(-index);
          data.currentTabId = tabSlotList[-index].props.name;
        }
        scrollDirection = "";
      },
      mounted(e){
        console.log("mounted",e);
        data.mountedTabMap.put(e,true);
      },
      chnagedPage(index){
        let pageName = tabSlotList[index].props.name;
        data.mountedTabMap.get(pageName);
      }
    };


    return {
      ...refs,
      ...toRefs(data),
      ...methods,
    };
  },
};
</script>

<style lang="scss" scoped>
.tabs-wrap {
  >.tabs-nav-wrap {
    display: flex;
    align-items: center;
    height: 1rem;
    overflow: scroll;
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
</style>
