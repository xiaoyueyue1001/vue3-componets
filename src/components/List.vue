<template>
  <div class="list-wrap" @scroll="panelScroll" @touchstart="touchstart" @touchmove="touchmove" @touchend="touchend">
    <div class="list-scroll-bar" ref="scrollBar"
      :style="{ transition: `all ${transitionTime}s`, transform: `translateY(${translateY}px)` }">
      <div class="top">下拉刷新</div>
      <slot></slot>
      <div class="bottom" v-if="props.finished">我也是有底线的...</div>
      <div class="last-dom"></div>
    </div>
  </div>
</template>
<script>
import { nextTick } from "process";
import { reactive, ref, toRefs, onMounted } from "vue";
export default {
  props: {
    finished: {
      type: Boolean,
      default: false
    }
  },
  emits: {
    onload: null,
    refresh: null,
  },
  setup(props, content) {
    const refs = {
      scrollBar: ref()
    }
    const data = reactive({
      transitionTime: 0,
      translateY: -50
    });
    let start = 0;
    let end = 0;
    let isScroll = false;
    let isLoadding = false;
    let isRefreshing = false; // 正在刷新中
    const methods = {
      panelScroll(e) {
        const ele = e.target;
        const allHeight = ele.scrollHeight; // 元素内容高度
        const height = ele.clientHeight; // 元素高度
        const scrollTop = ele.scrollTop; // 滚动距离

        if (scrollTop >= allHeight - height) {
          // 滚动到底部了
          console.log("滚动到底部了", props.finished);
          if (!props.finished && !isRefreshing) {
            isLoadding = true;
            content.emit("onload", () => {
              isLoadding = false;
            });
          }
        }
      },
      // 检测是否到达底部
      checkIsBottom() {
        const ele = refs.scrollBar.value;
        const elePoint = ele.getBoundingClientRect();
        const bottomY = elePoint.y + elePoint.height;
        const eleParentPoint = ele.parentElement.getBoundingClientRect();
        const isBottom = bottomY >= eleParentPoint.height;

        // 是否进入下次检测
        if (!props.finished && !isBottom && !isRefreshing) {
          // 还未到底
          console.log("还没到底");
          if (!isLoadding) {
            isLoadding = true;
            content.emit("onload", () => {
              isLoadding = false;
              methods.checkIsBottom();
            });
          }
        }
      },
      touchstart(e) {
        console.log("touchstart", e);
        const ele = e.target;
        const scrollEle = ele.parentElement.parentElement.parentElement;
        console.log("scrollEle.scrollTop",scrollEle.scrollTop)
        if (scrollEle.scrollTop <= 0) {
          // 滑动到了顶部
          start = e.touches[0].pageY;
          data.transitionTime = 0;
          isScroll = true;
        }
      },
      touchmove(e) {
        const ele = e.target;
        const scrollEle = ele.parentElement.parentElement.parentElement;
        if (isScroll && scrollEle.scrollTop <= 0) {
          // console.log("touchmove", e);
          end = e.touches[0].pageY;
          if (start < end) {
            e.preventDefault();
            //移动滑块
            data.translateY = Math.min(-50 + (end - start), 0);
          } else {

          }
        }
      },
      touchend(e) {
        console.log("touchend", e);
        if (isScroll) {
          isScroll = false;
          data.transitionTime = 0.5;
          if (data.translateY === 0) {
            // 下拉到底了
            if (!isRefreshing) {
              isRefreshing = true;
              isLoadding = true;
              content.emit("refresh", () => {
                isRefreshing = false;
                isLoadding = false;
                nextTick(methods.checkIsBottom)
              });
            }
          }
          data.translateY = -50;
        }
      }
    };

    onMounted(() => {
      methods.checkIsBottom();
    })

    return {
      props,
      ...refs,
      ...toRefs(data),
      ...methods,
    };
  },
};
</script>

<style lang="scss" scoped>
.list-wrap {
  height: 10rem !important;
  background-color: #eee;
  overflow: scroll;

  >.list-scroll-bar {
    // transform: translateY(-50px);

    >.top {
      height: 50px;
      line-height: 50px;
      text-align: center;
      background-color: #ccc;
    }

    >.bottom {
      height: 0;
      line-height: 50px;
      text-align: center;
      color: #ccc;
    }

  }
}
</style>
