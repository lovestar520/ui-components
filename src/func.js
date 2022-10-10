import React, { useState, useEffect, useRef } from 'react';

const useRefState = (initialState) => {
  const [state, setState] = useState(initialState);
  const ref = useRef(state);

  useEffect(() => {
    ref.current = state;
  }, [state]);

  return [state, setState, ref];
};

const isValideChildren = (children) => {
  let isValide = true;
  React.Children.map(children, (child, index) => {
    if (!React.isValidElement(child)) {
      isValide = false;
    } else if (!child.type || child.type.displayName !== 'SwiperItem') {
      isValide = false;
    }
  });

  return isValide;
};

const modulus = (value, division) => {
  const remainder = value % division;
  return remainder < 0 ? remainder + division : remainder;
};

const bound = (position, min, max) => {
  let ret = position;
  if (min !== undefined) {
    ret = Math.max(position, min);
  }
  if (max !== undefined) {
    ret = Math.min(ret, max);
  }
  return ret;
};

export { useRefState, isValideChildren, modulus, bound };
