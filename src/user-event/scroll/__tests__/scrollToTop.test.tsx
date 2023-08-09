import * as React from 'react';
import { ScrollView } from 'react-native';
import { createEventLogger } from '../../../test-utils';
import { render, screen } from '../../..';
import { userEvent } from '../..';

describe('userEvent.scroll with fake timers', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(0);
  });

  test('calls events', async () => {
    const { events, logEvent } = createEventLogger();
    const user = userEvent.setup();

    render(
      <ScrollView
        onScroll={logEvent('scroll')}
        onScrollBeginDrag={logEvent('scrollBeginDrag')}
        onScrollEndDrag={logEvent('scrollEndDrag')}
        onMomentumScrollBegin={logEvent('momentumScrollBegin')}
        onMomentumScrollEnd={logEvent('momentumScrollEnd')}
        onScrollToTop={logEvent('scrollToTop')}
        testID="scrollable"
      />
    );

    await user.scrollToTop(screen.getByTestId('scrollable'));

    expect(events).toMatchInlineSnapshot(`
      [
        {
          "name": "scrollToTop",
          "payload": {
            "contentInset": {
              "bottom": 0,
              "left": 0,
              "right": 0,
              "top": 0,
            },
            "contentOffset": {
              "x": 0,
              "y": 0,
            },
            "contentSize": {
              "height": 0,
              "width": 0,
            },
            "layoutMeasurement": {
              "height": 0,
              "width": 0,
            },
            "responderIgnoreScroll": true,
            "target": 0,
            "velocity": {
              "x": 0,
              "y": 0,
            },
          },
        },
      ]
    `);
  });

  test('scrollToTop is accessible directly in userEvent', async () => {
    const mockOnScrollToTop = jest.fn();

    render(
      <ScrollView onScrollToTop={mockOnScrollToTop} testID="scrollable" />
    );

    await userEvent.scrollToTop(screen.getByTestId('scrollable'));

    expect(mockOnScrollToTop).toHaveBeenCalled();
  });
});