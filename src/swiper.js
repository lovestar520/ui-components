import React, { useState, useRef, useEffect } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { useDrag } from '@use-gesture/react';
import { isValideChildren, useRefState, modulus, bound } from './func';
import Style from './swiper.scss';

/**
 * Swiper Hook 轮播图组件，配合SwiperItem使用
 *
 * current: 当前图片Index
 * style: Swiper样式style
 * swiperClassName: Swiper样式className
 * needLoop: 是否循环    默认true
 * showBtn: 是否展示左右切换按钮（测试用，未设计样式）    默认false
 * showCount: 是否展示轮播图数量与当前index      默认true
 * countClassName: count的样式, 传对应的className
 * countStyle: count的样式, 传对应的style对象
 * autoplay: 是否自动轮播       默认false
 * autoplayInterval: 自动轮播间隔
 * vertical: 滑动方向是否为纵向        默认false
 *
 * onChange: 每次轮播切换调用
 * onTransition: 每次手势拖动调用
 * onTouchEnd: 每次手势拖动结束调用
 */
const Swiper = (props = {}) => {
  let {
    children,
    current = 0,
    style,
    swiperClassName,
    needLoop = true,
    showBtn = false,
    showCount = true,
    countStyle = {},
    countClassName = '',
    autoplay = false,
    autoplayInterval = 1500,
    vertical = false,
    onChange,
    onTransition,
    onTouchEnd
  } = props;

  const [dragging, setDragging, draggingRef] = useRefState(false);

  const swiperContainerRef = useRef(null);

  const count = React.Children.count(children);

  if (count === 0 || !isValideChildren(children)) {
    return null;
  }

  if (count <= 1) {
    needLoop = false;
  }

  const [activeIdx, setActiveIdx] = useState(current < count ? current : 0);

  const boundIndex = (current) => {
    let min = 0;
    let max = count - 1;
    return bound(current, min, max);
  };

  const getSlidePixels = () => {
    const pixels = (vertical ? swiperContainerRef.current?.offsetHeight : swiperContainerRef.current?.offsetWidth) || 0;
    return (pixels * 100) / 100;
  };

  const [{ position }, api] = useSpring(
    () => ({
      position: boundIndex(activeIdx) * 100,
      config: {
        tension: 200,
        friction: 30
      },
      onRest: () => {
        if (draggingRef.current) return;
        if (!needLoop) return;
        const rawX = position.get();
        const totalWidth = 100 * count;
        const standardPosition = modulus(rawX, totalWidth);
        if (standardPosition === rawX) return;
        api.start({
          position: standardPosition,
          immediate: true
        });
      }
    }),
    [count]
  );

  const bind = useDrag(
    (state) => {
      const slidePixels = getSlidePixels();
      if (!slidePixels) return;
      const paramIndex = vertical ? 1 : 0;
      const offset = state.offset[paramIndex];
      const direction = state.direction[paramIndex];
      const velocity = state.velocity[paramIndex];
      setDragging(true);
      onTransition && onTransition(state);

      if (!state.last) {
        api.start({
          position: (offset * 100) / slidePixels,
          immediate: true
        });
      } else {
        onTouchEnd && onTouchEnd(state);
        const minIndex = Math.floor(offset / slidePixels);
        const maxIndex = minIndex + 1;
        const index = Math.round((offset + velocity * 2000 * direction) / slidePixels);
        const targetIndex = bound(index, minIndex, maxIndex);
        swipeTo(targetIndex);

        setTimeout(() => {
          setDragging(false);
        });
      }
    },
    {
      transform: ([x, y]) => [-x, -y],
      from: () => {
        const slidePixels = getSlidePixels();
        return [(position.get() / 100) * slidePixels, (position.get() / 100) * slidePixels];
      },
      bounds: () => {
        if (needLoop) return {};
        const slidePixels = getSlidePixels();
        const lowerBound = boundIndex(0) * slidePixels;
        const upperBound = boundIndex(count - 1) * slidePixels;
        return vertical
          ? {
              top: lowerBound,
              bottom: upperBound
            }
          : {
              left: lowerBound,
              right: upperBound
            };
      },
      rubberband: true,
      axis: vertical ? 'y' : 'x',
      preventScroll: !vertical,
      pointer: {
        touch: true
      }
    }
  );

  useEffect(() => {
    if (!autoplay || dragging) return;
    const interval = setInterval(() => {
      handleNext();
    }, autoplayInterval);

    return () => {
      clearInterval(interval);
    };
  }, [autoplay, autoplayInterval, dragging]);

  const swipeTo = (index, immediate = false) => {
    const roundedIndex = Math.round(index);
    const targetIndex = needLoop ? modulus(roundedIndex, count) : bound(roundedIndex, 0, count - 1);
    setActiveIdx(targetIndex);
    api.start({
      position: (needLoop ? roundedIndex : boundIndex(roundedIndex)) * 100,
      immediate
    });
    onChange && onChange(targetIndex);
  };

  // 上一页
  const handlePrev = () => {
    swipeTo(Math.round(position.get() / 100) - 1);
  };

  // 下一页
  const handleNext = () => {
    swipeTo(Math.round(position.get() / 100) + 1);
  };

  const renderSwiperContainer = () => {
    return React.createElement(
      'div',
      Object.assign(
        {
          ref: swiperContainerRef,
          className: Style.swiperContainer,
          style: {
            flexDirection: vertical ? 'column' : 'row'
            // touchAction: vertical ? 'pan-y' : 'pan-x' //设置后不会触发浏览器的滚动
          }
        },
        bind()
      ),
      React.Children.map(children, (child, index) => {
        return React.createElement(
          animated.div,
          {
            className: Style.swiperSlide,
            style: {
              [vertical ? 'y' : 'x']: position.to((position) => {
                let finalPosition = -position + index * 100;
                const totalWidth = count * 100;
                const flagWidth = totalWidth / 2;
                finalPosition = modulus(finalPosition + flagWidth, totalWidth) - flagWidth;
                return `${finalPosition}%`;
              }),
              [vertical ? 'top' : 'left']: `-${index * 100}%`
            }
          },
          child
        );
      })
    );
  };

  return (
    <div style={style} className={swiperClassName ? `${Style.swiperWrapper} ${swiperClassName}` : Style.swiperWrapper}>
      {renderSwiperContainer()}

      {showCount ? (
        <div className={countClassName ? countClassName : Style.swiperCount} style={countStyle}>
          {activeIdx + 1}/{count}
        </div>
      ) : null}

      {showBtn ? (
        <>
          <div onClick={handlePrev} className={Style.swiperButtonPrev}>
            Left
          </div>
          <div onClick={handleNext} className={Style.swiperButtonNext}>
            Right
          </div>
        </>
      ) : null}
    </div>
  );
};

export default React.memo(Swiper);
