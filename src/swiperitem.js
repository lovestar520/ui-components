import React, { useImperativeHandle, forwardRef, useRef, useEffect } from 'react';
import Style from './swiper.scss';

const SwiperItem = forwardRef((props, externalRef) => {
  let { children, style, className } = props || {};

  const slideElRef = useRef(null);

  useEffect(() => {
    if (externalRef) {
      externalRef.current = slideElRef.current;
    }
  });

  // 在useImperativeHandle中导出被父组件使用的方法
  useImperativeHandle(externalRef, () => ({}));

  return (
    <div ref={slideElRef} style={style} className={className ? `${Style.swiperItem} ${className}` : Style.swiperItem}>
      {children}
    </div>
  );
});

SwiperItem.displayName = 'SwiperItem';
export default SwiperItem;
