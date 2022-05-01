<template>
  <div class="tabs-wrap" ref="tabsWrapRef">
    <div class="tabs-nav-wrap">
      <div :ref="setTabsNavRef" class="tabs-nav-item" :class="{ active: currentTabId === tab.props.name }"
        @click="selectTab(tab.props.name, index)" v-for="(tab, index) in tabSlotList" :key="tab.props.name"
        :data-refId="tab.props.name">{{ tab.props.title }}</div>
      <div class="tabs-nav-line"
        :style="{ left: `${tabNavLinePosition.left}px`, width: `${tabNavLinePosition.width}px`, transition: `all ${tabNavLinePosition.duration}s` }">
      </div>
    </div>
    <div class="tabs-content-wrap">
      <div class="tabs-panel-bar"
        :style="{ transform: `translateX(${translateX}px)`, transition: `all ${transitionTime}s` }"
        @touchstart="touchstart" @touchmove="touchmove" @touchend="touchend">
        <div :id="`tabs-panel-${index}`" class="tabs-panel" v-for="(tab, index) in tabSlotList" :key="tab.props.name">
          <Loader v-if="currentTabId === tab.props.name || mountedTabMap.has(tab.props.name)" :vNode="tab"
            @mounted="mounted" :key="tab.props.name" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { reactive, toRefs, onMounted, ref, watch } from "vue";
import Loader from "./Loader.vue";
import LRUCache from "@/plugins/dist/LRU.js"
export default {
  name: "my-tabs",
  components: { Loader },
  props: {
    modelValue: {
      type: String,
      default: ""
    },
    isTouchMove: {
      type: Boolean,
      default: true
    }
  },
  emits: {
    tabChange: null
  },
  setup(props, content) {
    let Width = window.innerWidth;
    onMounted(() => {
      // 初始化组件宽度
      Width = refs.tabsWrapRef.value.clientWidth;
      // 初始化tabline长度
      let dom = document.querySelector(".tabs-nav-item");
      data.tabNavLinePosition.width = dom.clientWidth;
    })
    let defaultSlot = content.slots.default();
    let tabSlotList = defaultSlot.filter(item => item.type.name === 'my-tab');
    const pageNumber = tabSlotList.length;
    const data = reactive({
      tabSlotList,
      currentTabId: tabSlotList.length ? tabSlotList[0].props.name : "",
      translateX: 0,
      transitionTime: 0,
      mountedTabMap: new LRUCache(3), //可配置LRU
      tabNavLinePosition: {
        duration: 0,
        left: 0,
        width: 0
      }
    });
    const refs = {
      tabsWrapRef: ref(),
      tabsNavRef: {}
    }

    let start = {
      x: 0,
      y: 0
    }
    let end = 0;
    let isTouch = false;
    let scrollDirection = ""; //  "" 未知  "w" 横向  "h" 纵向
    const methods = {
      // 点击切换tab栏
      selectTab(val, index) {
        data.currentTabId = val;
        data.transitionTime = 0;
        methods.updateTranslateX({
          value: index * (-Width),
          duration: 0.5
        })
        methods.changedPage(index);
      },
      // 页面变化时埋点行为
      changedPage(index) {
        // 获取tab id
        let pageName = tabSlotList[index].props.name;
        // 添加访问记录
        data.mountedTabMap.get(pageName);
        // 通知父组件
        content.emit("tabChange", pageName);
      },
      setTabsNavRef(e) {
        refs.tabsNavRef[e.dataset.refid] = e;
      },
      touchstart(e) {
        // touch开关
        if (!props.isTouchMove) {
          return false;
        }
        isTouch = true;
        // 初始化滑动方向与触控点
        scrollDirection = "";
        data.transitionTime = 0;
        console.log("touchstart", e);
        start = {
          x: e.touches[0].pageX,
          y: e.touches[0].pageY
        };
      },
      touchmove(e) {
        // touch开关
        if (!props.isTouchMove) {
          return false;
        }
        end = {
          x: e.touches[0].pageX,
          y: e.touches[0].pageY
        };
        if (scrollDirection === "") {
          // 判断滑动方向
          let x = Math.abs(end.x - start.x);
          let y = Math.abs(end.y - start.y);
          scrollDirection = x >= y ? "w" : "h";
        }
        if (scrollDirection === "w") {
          // 横向滑动，阻止默认事件再使用位移模仿滑动
          e.preventDefault();
          //移动滑块
          let translateX = data.translateX + end.x - start.x;
          if (translateX > 0) {
            translateX = 0
          }
          if (translateX < -(pageNumber - 1) * Width) {
            translateX = -(pageNumber - 1) * Width
          }
          methods.updateTranslateX({
            value: translateX,
            duration: 0
          })
          start = end;

        }
        if (scrollDirection === "h") {
          // 垂直滑动，不做任何处理（以避免影响了tab内部的上拉加载与下拉刷新）
        }
      },
      touchend(e) {
        // touch开关
        if (!props.isTouchMove) {
          return false;
        }
        isTouch = false;
        data.transitionTime = 0.5;
        if (scrollDirection === "w") {
          let index = Math.round(data.translateX / Width);
          methods.updateTranslateX({
            value: index * Width,
            duration: 0.5
          })
          methods.changedPage(-index);
          data.currentTabId = tabSlotList[-index].props.name;
        }
        scrollDirection = "";
      },
      // 子页面挂载
      mounted(e) {
        // 记录子页面加载情况用于缓存
        console.log("mounted", e);
        data.mountedTabMap.put(e, true);
      },
      // 统一入口控制修改data.translateX，以便对tabline做动画更新
      updateTranslateX({ value, duration }) {
        data.transitionTime = duration;
        data.translateX = value;
        methods.updateTablineAnimation({ value, duration })
      },
      // 更新tabline动画
      updateTablineAnimation({ value, duration }) {
        // 通过位移量进行差值计算tabline
        let fromIndex = Math.floor(-value / Width);
        let toIndex = Math.ceil(-value / Width);
        console.log("translateX", value, fromIndex, toIndex);
        let fromDom = document.querySelectorAll(".tabs-nav-item")[fromIndex];
        let toDom = document.querySelectorAll(".tabs-nav-item")[toIndex];
        let rate = (-value % Width) / Width;
        data.tabNavLinePosition.duration = duration;
        data.tabNavLinePosition.left = fromDom.offsetLeft * (1 - rate) + toDom.offsetLeft * rate;
        data.tabNavLinePosition.width = fromDom.offsetWidth * (1 - rate) + toDom.offsetWidth * rate;
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
  height: 100%;

  >.tabs-nav-wrap {
    display: flex;
    align-items: center;
    height: 1rem;
    overflow: scroll;
    position: relative;

    >.tabs-nav-item {
      font-size: 0.32rem;
      line-height: 0.32rem;
      align-items: flex-start;
      height: 0.6rem;
      line-height: 0.6rem;
      // max-width: 2rem;
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

    >.tabs-nav-line {
      position: absolute;
      background-color: red;
      border-radius: 0.04rem;
      height: 0.05rem;
      bottom: 0;
    }
  }

  >.tabs-content-wrap {
    overflow: hidden;
    height: calc(100% - 1rem);

    >.tabs-panel-bar {
      height: 100%;
      display: flex;

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
