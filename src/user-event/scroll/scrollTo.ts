import { ReactTestInstance } from 'react-test-renderer';
import { UserEventInstance } from '../setup';
import { EventBuilder } from '../event-builder';
import { ErrorWithStack } from '../../helpers/errors';
import { isHostScrollView } from '../../helpers/host-component-names';
import { dispatchEvent } from '../utils';
import { ContentOffset } from '../event-builder/scroll';

export interface ScrollToOptions {
  y?: number;
  x?: number;
  callbacksNumber?: number;
  momentum?: Momentum;
}

export interface ScrollToTopOptions {
  callbacksNumber?: number;
}

export interface Momentum {
  value: number;
  callbacksNumber?: number;
}

export interface ScrollState {
  x: number;
  y: number;
}

const scrollStateForElement = new WeakMap<ReactTestInstance, ScrollState>();

export function getElementScrollState(element: ReactTestInstance): ScrollState {
  return scrollStateForElement.get(element) ?? { x: 0, y: 0 };
}

export function setElementScrollState(
  element: ReactTestInstance,
  scrollState: ScrollState
) {
  scrollStateForElement.set(element, scrollState);
}

export async function scrollTo(
  this: UserEventInstance,
  element: ReactTestInstance,
  options: ScrollToOptions
): Promise<void> {
  if (!isHostScrollView(element)) {
    throw new ErrorWithStack(
      `scrollTo() works only with host "ScrollView" elements. Passed element has type "${element.type}".`,
      scrollTo
    );
  }

  const scrollState = getElementScrollState(element);

  const { y, x, callbacksNumber, momentum } = options;

  await emitScrollEvents(
    element,
    scrollState,
    { y: y ?? 0, x: x ?? 0 },
    callbacksNumber,
    momentum
  );
}

export async function scrollToTop(
  element: ReactTestInstance,
  options?: ScrollToTopOptions
): Promise<void> {
  if (!isHostScrollView(element)) {
    throw new ErrorWithStack(
      `scrollToTop() works only with host "ScrollView" elements. Passed element has type "${element.type}".`,
      scrollTo
    );
  }

  const { x, y } = getElementScrollState(element);

  if (x === 0 && y === 0) {
    throw new ErrorWithStack(
      `scrollToTop() does NOT trigger if content offset is already x:0, y:0.`,
      scrollTo
    );
  }

  const callbacksNumber = options?.callbacksNumber || 0;

  emitIntermediateEvents(element, x, y, { x: 0, y: 0 }, callbacksNumber);

  dispatchEvent(
    element,
    'scrollToTop',
    EventBuilder.Scroll.scroll({
      x: 0,
      y: 0,
    })
  );

  setElementScrollState(element, { x: 0, y: 0 });
}

async function emitScrollEvents(
  element: ReactTestInstance,
  scrollState: ScrollState,
  offset: ContentOffset,
  callbacksNumber: number = 3,
  momentum?: Momentum
): Promise<void> {
  dispatchEvent(
    element,
    'scrollBeginDrag',
    EventBuilder.Scroll.scroll({
      x: scrollState.x,
      y: scrollState.y,
    })
  );

  await emitIntermediateEvents(
    element,
    scrollState.x,
    scrollState.y,
    offset,
    callbacksNumber
  );

  dispatchEvent(element, 'scrollEndDrag', EventBuilder.Scroll.scroll(offset));

  const actualScrollState: ScrollState = {
    x: offset.x || scrollState.x,
    y: offset.y || scrollState.y,
  };

  if (!momentum) {
    setElementScrollState(element, actualScrollState);
    return;
  }

  dispatchEvent(
    element,
    'momentumScrollBegin',
    EventBuilder.Scroll.scroll(offset)
  );

  const momentumOffset: ContentOffset = {
    x: offset.x ? offset.x + momentum.value : 0,
    y: offset.y ? offset.y + momentum.value : 0,
  };

  const momentumCallbacksNumber = momentum.callbacksNumber || 0;

  await emitIntermediateEvents(
    element,
    actualScrollState.x,
    actualScrollState.y,
    momentumOffset,
    momentumCallbacksNumber
  );

  dispatchEvent(
    element,
    'momentumScrollEnd',
    EventBuilder.Scroll.scroll(momentumOffset)
  );

  setElementScrollState(element, {
    x: momentumOffset.x || scrollState.x,
    y: momentumOffset.y || scrollState.y,
  });
}

async function emitIntermediateEvents(
  element: ReactTestInstance,
  x: number,
  y: number,
  offset: ContentOffset,
  callbacksNumber: number
): Promise<void> {
  const offsetDifference: ScrollState = {
    x: (x - (offset.x || 0)) * -1,
    y: (y - (offset.y || 0)) * -1,
  };

  // Number of jumps must be greater than total amount of 'onScroll' callbacks so that the 'scrollEndDrag' callback will set the final offset value
  const jumps = callbacksNumber + 1;

  const offsetStep = {
    x: offsetDifference.x / jumps,
    y: offsetDifference.y / jumps,
  };

  [...new Array(callbacksNumber)].forEach(() => {
    x = x + offsetStep.x;
    y = y + offsetStep.y;
    dispatchEvent(
      element,
      'scroll',
      EventBuilder.Scroll.scroll({
        x: x,
        y: y,
      })
    );
  });
}
